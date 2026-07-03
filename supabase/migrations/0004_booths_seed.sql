-- Seed data transcribed verbatim from lib/booths.ts (BOOTHS array) as of
-- the Phase 1 backend migration. If lib/booths.ts changes, update both.
insert into public.booths (
  id, kind, glyph, name, locale, stamp_locale, motto, tagline, place, prefix,
  accent, paper, map_x, map_y, map_true_x, map_true_y,
  season_months, season_returns,
  exclusive_place, exclusive_note, exclusive_geo_lat, exclusive_geo_lng, exclusive_geo_radius_km,
  prompts
) values
(
  'standard', 'place', 'camera', 'The Standard', 'HEAD OFFICE, TORONTO', 'HEAD OFFICE',
  'HONEST LIGHT', 'The company''s original apparatus. Honest light, plain dealing.',
  'Toronto, Canada', 'STD', '#1F3A5F', '#F9F4E9',
  238, 112, 259, 158,
  null, null,
  null, null, null, null, null,
  array['SIT UP STRAIGHT, PLEASE','NOW — A REAL SMILE','LOOK AT YOUR COMPANION','EYES CLOSED, CHIN UP','A BIG LAUGH, GO','PROFILE, PLEASE','LEAN IN TOGETHER','SERIOUS, LIKE A PASSPORT']
),
(
  'midnight', 'place', 'moon', 'Midnight Express', 'SLEEPER CAR No. 9', 'SLEEPER CAR No. 9',
  'LAST SERVICE 23:59', 'Fitted to the night train. Last service 23:59.',
  'Aboard the night train', 'MDX', '#44406E', '#F5F0E4',
  210, 134, null, null,
  null, null,
  null, null, null, null, null,
  array['PRETEND YOU''RE BEING FOLLOWED','WHISPER A SECRET','LOOK OUT THE WINDOW','TIP AN IMAGINARY HAT','SLEEPY EYES','TOAST WITH INVISIBLE GLASSES','GAZE AT SOMETHING FAR AWAY','CAUGHT MID-LAUGH']
),
(
  'seaside', 'place', 'waves', 'Seaside Pier', 'PIER PAVILION, SANTA MONICA', 'PIER PAVILION',
  'SALT AIR FREE', 'Salt air included at no extra charge.',
  'Santa Monica, California', 'SEA', '#2F6B5E', '#F8F4E6',
  140, 196, null, null,
  null, null,
  null, null, null, null, null,
  array['SQUINT INTO THE SUN','HOLD AN INVISIBLE ICE CREAM','WINDSWEPT HAIR — SELL IT','SAILOR''S SALUTE','A SEAGULL TOOK YOUR CHIPS','POSTCARD SMILE','LOOK OUT FOR LAND','BEST CANNONBALL FACE']
),
(
  'montreal', 'place', 'fleur', 'Vieux-Montréal', 'GARE WINDSOR, MONTRÉAL', 'MONTRÉAL, QUÉ.',
  'BONJOUR-HI', 'Cobblestones, cathedral light, and a second language.',
  'Montréal, Québec', 'MTL', '#5A3F6E', '#F6F1E6',
  293, 128, 273, 147,
  null, null,
  null, null, null, null, null,
  array['SAY BONJOUR-HI','INVISIBLE CROISSANT, BIG BITE','WINTER COAT SHRUG','GARGOYLE FACE','LOOK UP AT THE SPIRES','TOURIST WITH A MAP','JAZZ HANDS, OBVIOUSLY','POUTINE DAYDREAM']
),
(
  'niagara', 'place', 'falls', 'Niagara Falls', 'TABLE ROCK, ONTARIO', 'NIAGARA FALLS, ONT.',
  'HONEYMOON CAPITAL', 'Issued only within sound of the falls.',
  'Niagara Falls, Ontario', 'NIA', '#37596E', '#F4F1E6',
  268, 196, 260, 160,
  null, null,
  'TABLE ROCK, NIAGARA FALLS', 'Presence verified by location — or simulated for demonstration.', 43.079, -79.0788, 2.5,
  array['HOLD ONTO YOUR HAT','POINT AT THE FALLS','YOU FORGOT THE PONCHO','HONEYMOON POSE','BRACE AGAINST THE MIST','AWE — REAL AWE','BARREL RIDER''S SALUTE','SHOUT OVER THE ROAR']
),
(
  'midsummer', 'seasonal', 'bunting', 'Midsummer Lawn', 'THE COMPANY GARDENS', 'COMPANY GARDENS',
  'DUSK AT NINE', 'Set out on the lawn for the long evenings. June to August.',
  'Wherever summer finds you', 'MSR', '#6B7C3F', '#F8F4E2',
  null, null, null, null,
  array[5,6,7], 'RETURNS IN JUNE',
  null, null, null, null, null,
  array['GOLDEN HOUR SQUINT','CHEERS WITH LEMONADE','CAUGHT A FIREFLY','LAWN CHAIR LEAN','TIP YOUR SUNHAT','BAREFOOT ON GRASS','WATCH THE LONG DUSK','PICNIC THIEF']
),
(
  'firstsnow', 'seasonal', 'snow', 'First Snow', 'THE WINTER PLATFORM', 'WINTER PLATFORM',
  'BUNDLE UP', 'Wheeled out when the first flakes hold. December to February.',
  'Wherever winter finds you', 'SNO', '#3E5E78', '#F4F2EA',
  null, null, null, null,
  array[11,0,1], 'RETURNS IN DECEMBER',
  null, null, null, null, null,
  array['CATCH A SNOWFLAKE','MITTENS UP','SHIVER, DRAMATICALLY','SNOWBALL WIND-UP','FOG THE GLASS','HOT CHOCOLATE HANDS','FRESH POWDER GRIN','SCARF OVER NOSE']
)
on conflict (id) do nothing;
