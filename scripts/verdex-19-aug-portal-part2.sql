-- Verdex client portal — part 2 of the 19 August 2026 changes.
--
-- Applied inline earlier in the day; this file is the record. Idempotent.
--
-- Both changes come from reading two documents we ALREADY HELD:
--   * the plant layout of 6 August 2026, which carries every storage volume
--     and which we had been asking the client for over two weeks;
--   * the Thermomat heater datasheet, whose own heading is "Boiler" — which
--     explains a contradiction we had been carrying since 17 August — and
--     which describes the unit as dual-fuel, light oil and gas.

begin;

-- ---------------------------------------------------------------------------
-- Storage volumes are ON the drawing. Move both off the ask list.
-- ---------------------------------------------------------------------------

update public.project_facts set
  section     = 'operation',
  label       = 'Storage areas and volumes',
  value       = 'Read off your site layout of 6 August 2026: raw material stockpiles of 60, 60, 150 and 72 cubic metres, two stockpile areas of 10 m by 15 m by 2 m high at 300 cubic metres each, and a pellet and additive stockpile of 50 cubic metres. About 992 cubic metres of raw material storage in total, plus four processed-material silos of roughly 150 cubic metres.',
  source_note = 'Read directly off Verdex Plant Layout, Distribute Version, VCE, 6 August 2026 — the drawing you sent us. We had been asking for this and it was already on our file',
  confirmable = true,
  updated_at  = now()
 where id = '9a1aea6a-d7d7-4fd1-a5a2-354a4564c090';

update public.project_facts set
  section     = 'operation',
  label       = 'Storage capacity in cubic metres',
  value       = 'About 992 cubic metres of raw material storage, read off your site layout of 6 August 2026. The registration threshold for this category is 100 cubic metres, so it is comfortably engaged and the question is no longer whether but how it is registered.',
  source_note = 'Read off Verdex Plant Layout, Distribute Version, VCE, 6 August 2026',
  confirmable = true,
  updated_at  = now()
 where id = '7ea670f3-f008-4fcd-946c-172aee3ad18f';

-- ---------------------------------------------------------------------------
-- The layout item now asks the two things the drawing itself raised.
-- ---------------------------------------------------------------------------

update public.project_facts set
  label       = 'Site layout — two things it does not show',
  value       = 'Thank you — the layout of 6 August is on our file and it answers a great deal, including every storage volume. Two things it does not settle. First, it labels a BOILER between the presses and the cooling tower, which does not match what we were told on site. Second, it shows a diesel storage tank with a bund wall, size to be confirmed, which is not on any equipment list we hold. Please confirm both.',
  source_note = 'Read off your Verdex Plant Layout of 6 August 2026',
  updated_at  = now()
 where id = '6fa57bb0-5e9f-4efb-8adb-3e6a3ea47f4f';

-- ---------------------------------------------------------------------------
-- The datasheet answered the rated output. Ask for what is genuinely left.
-- ---------------------------------------------------------------------------

update public.project_facts set
  label       = 'The heater — burner rating, and whether it ever runs on oil',
  value       = 'Thank you for the Thermomat datasheet. It gives the output as 600 000 kcal/h, about 0,7 MW, at 280 degrees. Two things it raises. It describes the unit as dual-fuel, light oil and gas — please confirm whether it is ever fired on oil, and if so how often. And the datasheet gives an output rating; for the air assessment we need the burner input rating.',
  source_note = 'Read off the Thermomat technical summary you sent on 18 August 2026. An emission source is described by its rated input, and the fuel decides the emission profile',
  updated_at  = now()
 where id = 'c1c1ddc7-b4b9-46e8-9404-74a94ebaac8c';

-- ---------------------------------------------------------------------------
-- The boiler question becomes a confirmation, not an investigation.
-- The manufacturer's own datasheet is headed "Boiler", which reconciles the
-- landlord minutes and the plant layout with what the site visit saw.
-- ---------------------------------------------------------------------------

update public.project_facts set
  label       = 'The boiler — we think this is a naming difference',
  value       = 'We think we have this. The manufacturer''s own datasheet for your Thermomat unit is headed Boiler, which explains why your landlord minutes and your plant layout both call it that, while there is no separate steam boiler on site. Please confirm that is right: one thermic fluid heater, referred to as a boiler in the installation records, and no other boiler.',
  source_note = 'The Thermomat technical summary you sent on 18 August 2026 is headed Boiler, which reconciles your landlord minutes of 27 March 2025 and your plant layout of 6 August 2026 with what we saw on site',
  updated_at  = now()
 where label in ('Was a boiler ever installed?', 'The boiler — we think this is a naming difference');

-- ---------------------------------------------------------------------------
-- New: the diesel tank, which may feed the heater rather than the fire pump.
-- ---------------------------------------------------------------------------

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, confirmable)
select '6db92884-44b6-43e3-8518-218fb4260646', 'outstanding',
  'The diesel tank — what it holds and what it feeds',
  'Your plant layout shows a diesel storage tank with a 150 per cent bund wall, size marked to be confirmed. We need the capacity, what fuel it actually holds, and what it feeds. We had assumed the fire pump, but the heater datasheet describes the unit as dual-fuel, light oil and gas, so it may serve both.',
  'Fuel stored on site has to be described in the application, and the quantity bears on the fire and hazard assessment',
  (select coalesce(max(sort_order),0) + 1 from public.project_facts
    where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and section = 'outstanding'),
  'client_safe', false
 where not exists (select 1 from public.project_facts
   where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and label like 'The diesel tank%');

-- verification
select p.sort_order as leg, f.section, count(*) as rows,
       count(*) filter (where f.sensitivity = 'client_safe'
                          and coalesce(f.source_note,'') = '') as missing_source_note
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where p.client_id = '7c782793-c84a-4001-a991-a6d41c391913'
 group by 1,2 order by 1,2;

commit;
