-- Give every client-visible fact a source note.
--
-- The outstanding items had none, on the reasoning that they are requests
-- rather than assertions so there is nothing to source. That was too quick.
-- "Why we need this" IS provenance, and it is the half most likely to get the
-- thing actually sent: a client who can see that Part 4 of the Department's
-- form asks for it behaves differently from one reading a bare shopping list.
--
-- Each note below traces to the form, the gazette, the site visit or the
-- client's own process flow diagram.
--
-- NOTE on two of them: the gas particulars deliberately do NOT name the
-- major-hazard regime. The Dewald letter withholds that name on purpose until
-- the inventory is known, and a portal row must not get there first.

update public.project_facts set source_note = 'our record'
 where id = '14a2ce80-1fd2-4e4a-8ed9-02dca3625ad2';

-- --- Leg 1, Section 24G ----------------------------------------------------

update public.project_facts set source_note = 'Part 4 of the Department''s section 24G form asks for the facility''s processing capacity, machine by machine. Requested from Ruhan on 14 August 2026'
 where id = '321b15be-13dc-4e32-9a0b-4cf057dd44e5';

update public.project_facts set source_note = 'The application must describe the facility as it is, and four specialist assessments need the layout to work from. Requested from Ruhan on 14 August 2026'
 where id = '6fa57bb0-5e9f-4efb-8adb-3e6a3ea47f4f';

update public.project_facts set source_note = 'The site visit of 14 August established that the press is heated with LPG and that there is no boiler. How much gas is on site decides whether further obligations apply'
 where id = '82f8fc07-b753-44ad-b5a4-eb8d22dc62ec';

update public.project_facts set source_note = 'The storage threshold in the waste activities list is expressed in cubic metres, and we hold tonnage rather than volume'
 where id = '9a1aea6a-d7d7-4fd1-a5a2-354a4564c090';

update public.project_facts set source_note = 'The section 24G form asks us to name your main suppliers by company name'
 where id = '29a6ed1f-3e0c-4d7e-b55a-ef4fb3b72547';

update public.project_facts set source_note = 'Your process flow diagram VER_PFD_PFS_001 shows fines collection as the one stream that leaves the process'
 where id = 'a02a8ce2-686e-499d-88d6-1c3107ecef80';

update public.project_facts set source_note = 'Your process flow diagram VER_PFD_PFS_001 splits the input into soft plastics and ruffia, kept apart through shredding'
 where id = '5166a94d-90ff-4db5-8f36-ada5c11c6775';

update public.project_facts set source_note = 'The site visit of 14 August found a cooling tower, heat exchanger, pump and water tank outside the building'
 where id = '9aef661a-474c-498e-b07a-ac610c6f2ad8';

-- Corrected reason. The earlier note said these records could remove a listed
-- activity. Reading GN 921 on 16 August showed that is wrong: A(13) only
-- catches expansion of a Category A or B activity, and shredding is Category C.
-- The records still matter, but for A(12) and the commencement date.
update public.project_facts set source_note = 'When the line was first built bears on the date the activity is treated as having commenced'
 where id = '8fe19391-98b9-4858-9281-e1d4d31fcd15';

update public.project_facts set source_note = 'The section 24G form asks about incidents. One line from you closes four separate questions on it'
 where id = 'cdb2dad9-04a8-48cd-9520-814122b6708d';

-- --- Leg 2, Norms and Standards --------------------------------------------

update public.project_facts set source_note = 'Category C(1) of the waste activities list sets the threshold at 100 cubic metres, and we hold tonnage rather than volume'
 where id = '7ea670f3-f008-4fcd-946c-172aee3ad18f';

-- --- Leg 3, Section 22A and the AEL ----------------------------------------

update public.project_facts set source_note = 'Emissions have to be capable of being measured at a defined release point before the air application can be built. Question 9 of the technical request of 14 August 2026'
 where id = '276df166-a5a7-4cf6-ac4e-64d449001295';

update public.project_facts set source_note = 'The press is LPG-fired, so the installation forms part of the emission source description. How much gas is on site also decides whether further obligations apply'
 where id = 'c1c1ddc7-b4b9-46e8-9404-74a94ebaac8c';

update public.project_facts set source_note = 'We hold the certificate on file but have not read it in full'
 where id = 'ab49da32-5bbb-4464-a32d-f001845e4914';

-- --- verification ----------------------------------------------------------

select p.sort_order as leg,
       count(*) filter (where coalesce(f.source_note,'') = '') as still_missing,
       count(*) as client_safe_facts
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where f.sensitivity = 'client_safe'
   and p.client_id = (select client_id from public.projects
                       where id = '6db92884-44b6-43e3-8518-218fb4260646')
 group by p.sort_order order by p.sort_order;
