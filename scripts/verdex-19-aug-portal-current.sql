-- Verdex client portal — brought current on 19 August 2026, during Luaan's call
-- with Dewald Muller.
--
-- This file is the RECORD of changes already applied to production that day.
-- It is written to be idempotent, so re-running it is safe.
--
-- Three groups of change:
--   1. one outstanding item that had gone stale and was asking for something
--      the client had already sent;
--   2. three facts from the construction record filed that morning;
--   3. five things we genuinely need from the client that were not being asked
--      for anywhere.
--
-- What is deliberately NOT on the client surface, and stays off it:
--   * the administrative fine and the cessation risk — still withheld;
--   * what was excavated from the press pit and where it went — to be asked by
--     telephone, as a records question, not as a written item (W-007);
--   * the National Building Regulations point and the missed Category C
--     registrations — both unsettled with Waldo (W-022, W-026).

begin;

-- ---------------------------------------------------------------------------
-- 1. STALE — Ruhan sent the layout on 6 August and answered again on 18 August.
--    Asking for it as though he had not is the fastest way to lose a client's
--    goodwill on a portal he has just been given access to.
-- ---------------------------------------------------------------------------

update public.project_facts set
  label       = 'Site layout — thank you, and one question back',
  value       = 'Thank you — we have the layout you sent on 6 August and your note of 18 August that it shows the equipment, LPG installation, cooling plant, weighbridge and storage areas. You asked whether more component detail is needed: only where a machine sits in relation to storage and offloading, not engineering detail. We will come back with the specific gaps rather than asking again.',
  source_note = 'Part 4 of the Department form asks for the facility layout. You answered on 18 August 2026 and offered further detail if required',
  updated_at  = now()
 where id = '6fa57bb0-5e9f-4efb-8adb-3e6a3ea47f4f';

-- ---------------------------------------------------------------------------
-- 2. THE CONSTRUCTION RECORD, as fact. The legal reading of it stays internal.
-- ---------------------------------------------------------------------------

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, confirmable)
select '6db92884-44b6-43e3-8518-218fb4260646', 'operation', v.label, v.value, v.src,
       (select coalesce(max(sort_order),0) from public.project_facts
         where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and section = 'operation') + v.n,
       'client_safe', true
  from (values
    ('When the site works were done',
     'The fit-out ran from March to July 2025. Your landlord approved the schedule of works on 27 March 2025, the structural drawing was issued for construction on 24 April 2025, and the structural compliance certificate was issued on 31 July 2025.',
     'Landlord meeting minutes of 27 March 2025, structural drawing 0530.18/01-04, and the structural compliance certificate — all received 18 August 2026', 1),
    ('Structural compliance certificate',
     'Held. Issued 31 July 2025 by Jan Andries Potgieter, Pr.Eng 202001174, of Virtual Consulting Engineers, covering the fire wall, LPG footing, press pit, beam saw footing and fire tank foundation.',
     'The certificate itself, received from Ruhan on 18 August 2026', 2),
    ('Storage silos',
     'Processed material is held in silos of roughly 150 cubic metres, about 40 tonnes.',
     'Confirmed by Ruhan on 18 August 2026', 3)
  ) as v(label, value, src, n)
 where not exists (select 1 from public.project_facts x
   where x.project_id = '6db92884-44b6-43e3-8518-218fb4260646' and x.label = v.label);

-- ---------------------------------------------------------------------------
-- 3. FIVE THINGS WE NEED AND WERE NOT ASKING FOR.
--
--    The first two matter most: the net tonnage stated in the application
--    depends on which load was rejected, and the two files the client has sent
--    us disagree about it.
-- ---------------------------------------------------------------------------

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, confirmable)
select '6db92884-44b6-43e3-8518-218fb4260646', 'outstanding', v.label, v.value, v.src,
       (select coalesce(max(sort_order),0) from public.project_facts
         where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and section = 'outstanding') + v.n,
       'client_safe', false
  from (values
    ('Which load was actually rejected?',
     'Your two feedstock files disagree and we do not want to guess. The 13 July ledger records one rejected load of 47 460 kg on 12 June 2026. The 2 August summary shows three ordinary deliveries on that same date totalling exactly 47 460 kg, none marked declined, and marks a different load as declined instead. Please confirm which is correct.',
     'The tonnage stated in the application is a net figure that depends on which load was rejected, so it has to be right', 1),
    ('Where did the rejected load go?',
     'Whichever load it was, it left the site. We need the receiving site and the transporter, and any disposal or weighbridge record for it.',
     'Part 4 of the Department form asks for the off-site route and contractor for material leaving the facility', 2),
    ('Was a boiler ever installed?',
     'Your landlord minutes of 27 March 2025 refer to a boiler being approved, to site preparation for mounting a boiler, and to piping from the boiler to the board press. Our current record, from the site visit and your confirmation, is that there is no boiler and that the press oil is heated by a thermic fluid heater. Please confirm which is correct, or whether the heater was called a boiler at the time.',
     'The heating equipment has to be described accurately in the air application, and a boiler and a thermic fluid heater are treated differently', 3),
    ('The council submission reference',
     'You mentioned revised plans going to the City of Tshwane for the alterations made to site. When it is lodged, please send the reference number and a copy of the drawing set, and let us know what it covers.',
     'You told us on 17 August 2026 that this was in progress', 4),
    ('The geotechnical report for the pit',
     'Your landlord minutes of 27 March 2025 record that a geotechnical analysis was to be carried out for the Bay 4 pit. Please send it if it was done.',
     'Ground conditions at the site are relevant to the application, and this is the one report likely to record them', 5)
  ) as v(label, value, src, n)
 where not exists (select 1 from public.project_facts x
   where x.project_id = '6db92884-44b6-43e3-8518-218fb4260646' and x.label = v.label);

-- ---------------------------------------------------------------------------
-- verification: counts, and no client-visible fact without provenance
-- ---------------------------------------------------------------------------
select p.sort_order as leg, f.section, count(*) as rows,
       count(*) filter (where f.sensitivity = 'client_safe'
                          and coalesce(f.source_note,'') = '') as missing_source_note
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where p.client_id = '7c782793-c84a-4001-a991-a6d41c391913'
 group by 1,2 order by 1,2;

commit;
