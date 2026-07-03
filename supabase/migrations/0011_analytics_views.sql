-- Mirrors supabase/views/analytics.sql (Phase 2 share-loop funnel + K-factor
-- views). Kept in sync by hand; this file is NOT applied automatically —
-- the orchestrator applies it deliberately via the Supabase MCP
-- apply_migration tool once ready. See supabase/views/analytics.sql for
-- the full commentary on each view.

-- Analytics views for the acquisition funnel + K-factor North Star metric.
-- (LAUNCH_PLAN.md §1 "Definition of the first customer" / §5 Phase 2 "share
-- loop".)
--
-- NOT applied automatically by the analytics agent — this file is written
-- for a human/agent to apply deliberately (e.g. via the Supabase SQL editor,
-- an MCP `apply_migration` call, or
-- `supabase db execute -f supabase/views/analytics.sql`) once ready. The
-- same SQL is mirrored in supabase/migrations/0011_analytics_views.sql for
-- the migration history — that file is not applied automatically either.
--
-- It runs cleanly against the CURRENT schema
-- (supabase/migrations/0008_events.sql) today: session_id, strip_id,
-- share_slug, utm (dedicated jsonb column), and meta all already exist.
-- share_completed / referred_arrival / referred_signup / referred_activation
-- are wired in lib/signals.ts by this change; the frontend-shareloop work
-- fires the actual call sites, so those rows read 0 until then.
--
-- Funnel (full taxonomy + firing sites documented in lib/signals.ts):
--   sitting_started -> sitting_completed -> strip_affixed
--     -> strip_shared / story_card_shared   (share intent)
--     -> share_completed                    (share actually completed)
--     -> referred_arrival                   (new visitor via shared slug)
--     -> referred_signup / referred_activation
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
  'share_completed',
  'referred_arrival',
  'referred_signup',
  'referred_activation'
)
group by 1, 2
order by 1 desc, 2;

-- 2. K-factor (all-time) --------------------------------------------------
-- K = referred activations / activated sessions.
--   "Activated"           = a distinct session that fired sitting_completed
--                            (reached the "aha" of getting a strip — the
--                            LAUNCH_PLAN.md §1 "first user" milestone).
--   "Referred activation" = a distinct session that fired
--                            referred_activation (arrived via a shared link
--                            and affixed its OWN first strip). This is the
--                            PRACTICAL K-factor numerator today, since
--                            account signup has no UI yet.
--   "Referred signup"     = a distinct session that fired referred_signup
--                            (arrived via a shared link and created an
--                            account). Reported as a variant numerator
--                            (k_factor_signups) for once accounts land.
create or replace view public.analytics_kfactor as
with activated as (
  select count(distinct session_id) as activated_sessions
  from public.events
  where name = 'sitting_completed'
),
referred_activation as (
  select count(distinct session_id) as referred_activations
  from public.events
  where name = 'referred_activation'
),
referred_signup as (
  select count(distinct session_id) as referred_signups
  from public.events
  where name = 'referred_signup'
)
select
  referred_activation.referred_activations,
  referred_signup.referred_signups,
  activated.activated_sessions,
  case
    when activated.activated_sessions = 0 then null
    else round(
      referred_activation.referred_activations::numeric
        / activated.activated_sessions,
      4
    )
  end as k_factor,
  case
    when activated.activated_sessions = 0 then null
    else round(
      referred_signup.referred_signups::numeric
        / activated.activated_sessions,
      4
    )
  end as k_factor_signups
from activated, referred_activation, referred_signup;

-- 3. K-factor trend (daily) -----------------------------------------------
-- Same math as #2, bucketed by day, for charting K over time instead of a
-- single all-time number. Reports both the referred_activation-based
-- k_factor (primary, practical numerator) and the referred_signup-based
-- k_factor_signups (variant, for once accounts land).
create or replace view public.analytics_kfactor_daily as
with activated as (
  select
    date_trunc('day', created_at) as day,
    count(distinct session_id) as activated_sessions
  from public.events
  where name = 'sitting_completed'
  group by 1
),
referred_activation as (
  select
    date_trunc('day', created_at) as day,
    count(distinct session_id) as referred_activations
  from public.events
  where name = 'referred_activation'
  group by 1
),
referred_signup as (
  select
    date_trunc('day', created_at) as day,
    count(distinct session_id) as referred_signups
  from public.events
  where name = 'referred_signup'
  group by 1
)
select
  coalesce(activated.day, referred_activation.day, referred_signup.day)
    as day,
  coalesce(referred_activation.referred_activations, 0)
    as referred_activations,
  coalesce(referred_signup.referred_signups, 0) as referred_signups,
  coalesce(activated.activated_sessions, 0) as activated_sessions,
  case
    when coalesce(activated.activated_sessions, 0) = 0 then null
    else round(
      coalesce(referred_activation.referred_activations, 0)::numeric
        / activated.activated_sessions,
      4
    )
  end as k_factor,
  case
    when coalesce(activated.activated_sessions, 0) = 0 then null
    else round(
      coalesce(referred_signup.referred_signups, 0)::numeric
        / activated.activated_sessions,
      4
    )
  end as k_factor_signups
from activated
full outer join referred_activation using (day)
full outer join referred_signup using (day)
order by day desc;

-- 4. Top referring share_slugs ---------------------------------------------
-- Which shared strips/story cards actually pulled in new visitors and drove
-- them to activate. `share_slug` here is the REFERRER's slug, carried
-- through referred_arrival -> referred_signup / referred_activation (see
-- lib/signals.ts) — not the slug of whatever the referred visitor later
-- makes and shares themselves.
create or replace view public.analytics_top_referring_slugs as
with arrivals as (
  select
    share_slug,
    count(*) as arrival_count,
    count(distinct session_id) as arrival_sessions
  from public.events
  where name = 'referred_arrival'
    and share_slug is not null
  group by 1
),
activations as (
  select
    share_slug,
    count(distinct session_id) as activation_sessions
  from public.events
  where name = 'referred_activation'
    and share_slug is not null
  group by 1
),
signups as (
  select
    share_slug,
    count(distinct session_id) as signup_sessions
  from public.events
  where name = 'referred_signup'
    and share_slug is not null
  group by 1
)
select
  arrivals.share_slug,
  arrivals.arrival_count,
  arrivals.arrival_sessions,
  coalesce(activations.activation_sessions, 0) as activation_sessions,
  coalesce(signups.signup_sessions, 0) as signup_sessions,
  case
    when arrivals.arrival_sessions = 0 then null
    else round(
      coalesce(activations.activation_sessions, 0)::numeric
        / arrivals.arrival_sessions,
      4
    )
  end as arrival_to_activation_rate
from arrivals
left join activations using (share_slug)
left join signups using (share_slug)
order by activation_sessions desc, arrival_sessions desc;

-- 5. Attribution by UTM source/campaign (optional) -------------------------
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
    'referred_activation',
    'strip_shared',
    'story_card_shared',
    'share_completed'
  )
group by 1, 2, 3
order by 1, 2, 3;

-- 6. Lock the views down ----------------------------------------------------
-- Views execute with the owner's privileges (no security_invoker here on
-- purpose — they must aggregate over RLS-hidden events rows), and Supabase's
-- default grants would expose them to the anon/authenticated API roles.
-- Analytics stay server-side: only service_role / SQL editor / the future
-- auth-gated admin surface may read them.
revoke all on public.analytics_daily_funnel from anon, authenticated;
revoke all on public.analytics_kfactor from anon, authenticated;
revoke all on public.analytics_kfactor_daily from anon, authenticated;
revoke all on public.analytics_top_referring_slugs from anon, authenticated;
revoke all on public.analytics_utm_attribution from anon, authenticated;
