-- Seed the existing VOYAGE demo charter (mirrors lib/charters.ts CHARTERS[0])
-- so the current client-side demo flow keeps working once wired to the
-- redeem_charter() RPC.
insert into public.charters (
  code, glyph, name, locale, stamp_locale, motto, tagline, place, prefix,
  accent, paper, prompts, event_name
) values (
  'VOYAGE',
  'bunting',
  'The Maiden Voyage Ball',
  'PRIVATE EVENT · BY INVITATION',
  'PRIVATE CHARTER',
  'BLACK TIE, LOOSENED',
  'A private charter of the Grand Tour Company.',
  'A private engagement',
  'PVT',
  '#7C3F4E',
  '#F7F1E8',
  array['RAISE A TOAST','BLACK TIE POSTURE','CONFETTI INCOMING','FIRST DANCE POSE','SPEECH! SPEECH!','CLINK GLASSES','LAUGH AT THE BEST MAN','MIDNIGHT COUNTDOWN'],
  'Demo charter — mirrors lib/charters.ts CHARTERS[0]'
)
on conflict (code) do nothing;
