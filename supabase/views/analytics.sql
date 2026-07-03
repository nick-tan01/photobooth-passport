-- Analytics views for the acquisition funnel + K-factor North Star metric.
-- (LAUNCH_PLAN.md §1 "Definition of the first customer" / §4 Phase 1 §E.)
--
-- NOT applied automatically by the analytics agent — this file is written
-- for a human/agent to apply deliberately (e.g. via the Supabase SQL editor
-- or `supabase db execute -f supabase/views/analytics.sql`) once ready.
-- It runs cleanly against the CURRENT schema
-- (supabase/migrations/0008_events.sql) today; the K-factor numerator and
-- the referred_* rows will simply read 0 until Phase 2 wires up
-- referred_arrival / referred_signup (the /s/[slug] attribution capture and
-- the post-referral signup flow — see LAUNCH_PLAN.md §5).
--
-- Funnel (full taxonomy + firing sites documented in lib/signals.ts):
--   sitting_started -> sitting_completed -> strip_affixed
--     -> strip_shared / story_card_shared
--     -> referred_arrival -> referred_signup        [Phase 2]
--
-- Session grouping: every event carries an anonymous `session_id` (see
-- lib/signals.ts `pp_sid`), so "distinct session_id" approximates "distinct
-- guest" without any PII.

-- 1. Daily funnel counts --------------------------------------------------
-- One row per (day, event name): a raw event count plus a distinct-session
-- count (so a session firing the same event twice in a day still counts
-- once toward that day's funnel stage).
create or replace view public.analytics_daily_funnel as
select
  date_trunc('day', created_at) as day,
  name as event_name,
  count(*) as event_count,
  count(distinct session_id) as session_count
from public.events
where name in (
  'sitting_started',
  'sitting_completed',
  'strip_affixed',
  'strip_shared',
  'story_card_shared',
  'referred_arrival',
  'referred_signup'
)
group by 1, 2
order by 1 desc, 2;

-- 2. K-factor (all-time) --------------------------------------------------
-- K = referred signups / activated sessions.
--   "Activated"       = a distinct session that fired sitting_completed
--                        (reached the "aha" of getting a strip — the
--                        LAUNCH_PLAN.md §1 "first user" milestone).
--   "Referred signup" = a distinct session that fired referred_signup
--                        (Phase 2: arrived via a shared link and then
--                        created/activated an account).
create or replace view public.analytics_kfactor as
with activated as (
  select count(distinct session_id) as activated_sessions
  from public.events
  where name = 'sitting_completed'
),
referred as (
  select count(distinct session_id) as referred_signups
  from public.events
  where name = 'referred_signup'
)
select
  referred.referred_signups,
  activated.activated_sessions,
  case
    when activated.activated_sessions = 0 then null
    else round(referred.referred_signups::numeric / activated.activated_sessions, 4)
  end as k_factor
from activated, referred;

-- 3. K-factor trend (daily) -----------------------------------------------
-- Same math as #2, bucketed by day, for charting K over time instead of a
-- single all-time number.
create or replace view public.analytics_kfactor_daily as
with activated as (
  select
    date_trunc('day', created_at) as day,
    count(distinct session_id) as activated_sessions
  from public.events
  where name = 'sitting_completed'
  group by 1
),
referred as (
  select
    date_trunc('day', created_at) as day,
    count(distinct session_id) as referred_signups
  from public.events
  where name = 'referred_signup'
  group by 1
)
select
  coalesce(activated.day, referred.day) as day,
  coalesce(referred.referred_signups, 0) as referred_signups,
  coalesce(activated.activated_sessions, 0) as activated_sessions,
  case
    when coalesce(activated.activated_sessions, 0) = 0 then null
    else round(
      coalesce(referred.referred_signups, 0)::numeric
        / activated.activated_sessions,
      4
    )
  end as k_factor
from activated
full outer join referred using (day)
order by day desc;

-- 4. Attribution by UTM source/campaign (optional) -------------------------
-- Which shared links/campaigns actually drove arrivals and signups. Reads
-- the dedicated `utm` jsonb column (populated by /api/signal from the
-- SignalExtra.utm passed to lib/signals.ts `signal()`), not `meta` — utm
-- params are meant to survive the funnel intact via this column.
create or replace view public.analytics_utm_attribution as
select
  utm->>'utm_source' as utm_source,
  utm->>'utm_campaign' as utm_campaign,
  name as event_name,
  count(*) as event_count,
  count(distinct session_id) as session_count
from public.events
where utm is not null
  and name in (
    'referred_arrival',
    'referred_signup',
    'strip_shared',
    'story_card_shared'
  )
group by 1, 2, 3
order by 1, 2, 3;
