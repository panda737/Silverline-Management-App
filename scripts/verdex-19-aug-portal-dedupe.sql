-- Verdex client portal — deduplication pass, 19 August 2026.
--
-- Applied to production; this file is the record. Idempotent by label.
--
-- Juandre's instruction: "We shouldn't ask dumb questions, and we shouldn't
-- ask things we know already... make sure that we don't ask the same question
-- twice."
--
-- A review of all 19 outstanding items found four faults:
--
--   1. The site-layout item asked about the boiler and the diesel tank. Both
--      already had their own dedicated items. Asked twice.
--   2. The gas item asked for the LPG fill limit, which Ruhan gave on
--      18 August — roughly 90 per cent of capacity. Asking for what we were
--      told. It also asked for the rated input, which the air leg asks for.
--   3. The weighbridge item was not a request at all. It was our answer to
--      his question about the 80-plus slips, sitting on his to-do list.
--   4. Where the rejected load went was asked in TWO items — once in its own
--      right and once inside the suppliers item.
--
-- Result: 19 asks down to 16, none duplicated, none already answered.

begin;

-- 1. The layout is read and its two questions have their own items.
update public.project_facts set
  section     = 'operation',
  label       = 'Site layout',
  value       = 'Your layout of 6 August 2026 is on our file and has been read. It gives the equipment positions, the LPG installation, the cooling plant, the weighbridge, the offloading and storage areas and every storage volume. Nothing further is needed from it.',
  source_note = 'Verdex Plant Layout, Distribute Version, VCE, 6 August 2026, read on 19 August 2026',
  confirmable = true, updated_at = now()
 where id = '6fa57bb0-5e9f-4efb-8adb-3e6a3ea47f4f';

-- 2. Fill limit already given; rated input belongs to the air leg.
update public.project_facts set
  label       = 'Gas installation — separation distances',
  value       = 'One thing left on this. We have the 22,5 m3 vessel, certificate 576126, the Tshwane permit, and your note that the vessel is filled to about 90 per cent. What we still need are the separation distances from the vessel to the site boundary and to occupied buildings. The burner rating is asked separately on the air licence.',
  source_note = 'Separation distances are what the installation description and the hazard screening turn on. The fill limit you gave on 18 August 2026 is recorded',
  updated_at  = now()
 where id = '82f8fc07-b753-44ad-b5a4-eb8d22dc62ec';

-- 3. Our answer, not his task.
update public.project_facts set
  section     = 'operation',
  label       = 'How the tonnages are measured',
  value       = 'All quantities come from the weighbridge on site, confirmed by you on 18 August 2026. You asked whether we need all 80-plus slips: no. A representative sample and the running total is what the application carries, and we will tell you which period to pull once the reporting dates are fixed.',
  source_note = 'Confirmed by Dewald on 18 August 2026. Part 4 of the Department form asks how waste quantities are measured',
  confirmable = true, updated_at = now()
 where label in ('Weighbridge slips — we need a sample, not all 80+', 'How the tonnages are measured');

-- 4a. One load, one question.
update public.project_facts set
  label = 'The rejected load — which one, and where it went',
  value = 'Two things about the same load. First, your two feedstock files disagree: the 13 July ledger records one rejected load of 47 460 kg on 12 June 2026, while the 2 August summary shows three ordinary deliveries on that date totalling exactly 47 460 kg and marks a different load as declined. Please confirm which is correct. Second, whichever it was, it left the site — we need the receiving site, the transporter, and any disposal or weighbridge record.',
  source_note = 'The tonnage in the application is a net figure that depends on which load was rejected, and Part 4 asks for the off-site route and contractor for material leaving the facility',
  updated_at = now()
 where label in ('Which load was actually rejected?', 'The rejected load — which one, and where it went');

delete from public.project_facts where label = 'Where did the rejected load go?';

-- 4b. Strip the duplicate ask out of the suppliers item.
update public.project_facts set
  label = 'Your acceptance and rejection criteria',
  value = 'Correction from us: your summary of 2 August 2026 does carry supplier names, product type and the declined load, exactly as you said. We had been reading an older version, and the supplier question is closed. One thing still needed from it: your acceptance and rejection criteria for incoming material — what you will and will not take.',
  source_note = 'The section 24G form asks for the specifications material is accepted against, not only the record of what was rejected',
  updated_at = now()
 where label in ('Suppliers — found it, thank you', 'Your acceptance and rejection criteria');

-- verification
select p.sort_order as leg, f.section, count(*) as rows,
       count(*) filter (where f.sensitivity = 'client_safe'
                          and coalesce(f.source_note,'') = '') as missing_source_note
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where p.client_id = '7c782793-c84a-4001-a991-a6d41c391913'
 group by 1,2 order by 1,2;

commit;
