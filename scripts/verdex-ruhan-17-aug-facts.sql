-- Verdex — the new facts from Ruhan Rykaart's reply of 17 August 2026, 14:10.
--
-- Five existing facts are updated rather than duplicated, and three rows are
-- new. Everything here is the client's own information given back to him, so
-- it is client_safe and confirmable.
--
-- What is deliberately NOT on the client surface: our reading that a 210 m3
-- excavation may constitute "construction" and so may mean the Category C
-- registrations were engaged and missed. That is an open legal question with
-- Waldo (W-022), it is not settled, and a portal row must not get there first.
-- Recorded internally at Verdex/00 - FACTS.md section 5F.

begin;

-- ---------------------------------------------------------------------------
-- 1. UPDATED — facts the reply corrected or completed
-- ---------------------------------------------------------------------------

-- Weighbridge: the contradiction is closed.
update public.project_facts set
  value       = 'There is an operational weighbridge on site. You confirmed this on 17 August 2026, which agrees with the 2003 building plans. Our site team simply did not see it on the day.',
  source_note = 'Confirmed by Ruhan on 17 August 2026, reconciling the approved building plan 1655/03 with the 14 August site visit',
  updated_at  = now()
 where id = '83610604-6824-4eb5-b90f-df79c310df1a';

-- Shredders: twelve installed, eight running.
update public.project_facts set
  value       = 'Twelve, in three parallel trains of two primary and two secondary each. All twelve are operational and eight run full time.',
  source_note = 'Your process flow diagram VER_PFD_PFS_001, with the operating split confirmed by Ruhan on 17 August 2026',
  updated_at  = now()
 where id = 'ca0bf05b-e9a8-4dd8-9232-54d088541a89';

-- Press heating: the heater is a thermic fluid heater, not direct firing.
update public.project_facts set
  value       = 'LPG, through a thermic fluid heater which heats the press oil. There is no boiler on site.',
  source_note = 'The site visit of 14 August 2026, with the heater confirmed by Ruhan on 17 August 2026',
  updated_at  = now()
 where id = '95c4f71a-cb52-4653-9602-c5c8b91a9a31';

-- Cooling plant: water source, usage and treatment now known.
update public.project_facts set
  value       = 'A cooling tower, plate heat exchanger, circulating pump and water tank, in the roofed area alongside the building. Municipal water, roughly 200 litres of evaporative loss, softened and treated, tested monthly.',
  source_note = 'The site visit of 14 August 2026, with the water source, usage and treatment confirmed by Ruhan on 17 August 2026',
  updated_at  = now()
 where id = 'c385189c-2ac1-4453-9884-c75a35014574';

-- ---------------------------------------------------------------------------
-- 2. NEW — facts the reply established for the first time
-- ---------------------------------------------------------------------------

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, confirmable)
select '6db92884-44b6-43e3-8518-218fb4260646', 'operation', v.label, v.value, v.source_note,
       (select coalesce(max(sort_order),0) from public.project_facts
         where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and section = 'operation') + v.n,
       'client_safe', true
  from (values
    ('The press pit',
     'A pit of approximately 12 m by 5 m by 3,5 m was excavated for the press. You confirmed on 17 August 2026 that Verdex built it, so it does not pre-date your occupation of the site.',
     'Confirmed by Ruhan on 17 August 2026, answering our question about the pit the lease authorises',
     1),
    ('Press configuration',
     'An eleven-stack press. Cycle times vary with board thickness. LPG is refilled about once every four weeks.',
     'Confirmed by Ruhan on 17 August 2026',
     2),
    ('Revised building plans',
     'You advised on 17 August 2026 that revised plans covering the alterations made to the site are being prepared for submission to the City of Tshwane.',
     'Stated by Ruhan on 17 August 2026',
     3)
  ) as v(label, value, source_note, n)
 where not exists (
   select 1 from public.project_facts x
    where x.project_id = '6db92884-44b6-43e3-8518-218fb4260646' and x.label = v.label);

-- ---------------------------------------------------------------------------
-- 3. NEW OUTSTANDING — genuinely still open, and now owned by Dewald
-- ---------------------------------------------------------------------------

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, confirmable)
select '6db92884-44b6-43e3-8518-218fb4260646', 'outstanding',
       'How the tonnages are measured',
       'Now that the weighbridge is confirmed, we need to say in the application how incoming and outgoing quantities are recorded — weighbridge tickets, supplier tickets, or another method — and to hold a sample of those records. Ruhan referred this to Dewald on 17 August 2026.',
       'Part 4 of the Department form asks for waste quantities, and every tonnage in the application has to rest on a stated method',
       (select coalesce(max(sort_order),0) from public.project_facts
         where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and section = 'outstanding') + 1,
       'client_safe', false
 where not exists (
   select 1 from public.project_facts x
    where x.project_id = '6db92884-44b6-43e3-8518-218fb4260646'
      and x.label = 'How the tonnages are measured');

-- ---------------------------------------------------------------------------
-- verification: counts, and no client-visible fact left without provenance
-- ---------------------------------------------------------------------------
select p.sort_order as leg, f.section, count(*) as rows,
       count(*) filter (where f.sensitivity = 'client_safe'
                          and coalesce(f.source_note,'') = '') as missing_source_note
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where p.client_id = '7c782793-c84a-4001-a991-a6d41c391913'
 group by 1,2 order by 1,2;

commit;
