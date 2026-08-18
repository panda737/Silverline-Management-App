-- Verdex — apply Ruhan Rykaart's reply of 17 August 2026, 14:10, to the client
-- portal's "What we need" tab.
--
-- The rule being enforced: do not ask a client again for something he has
-- already given. Each item below is either closed (moved off the outstanding
-- tab into the operation record) or NARROWED to only the part still missing.
--
-- What is deliberately NOT closed: the two items Ruhan says were already
-- supplied. The repo holds no drawing carrying a storage volume, and the
-- 3 August plans went to Luaan alone and never reached the admin mailbox.
-- AGENTS.md section 3 rule 2 — never assert a document exists without seeing
-- it. Those are narrowed to ask WHICH document, not asked again from scratch.
--
-- Source for every change: Ruhan Rykaart to Luaan, 17 August 2026 14:10 SAST,
-- recorded verbatim at Verdex/00 - FACTS.md section 5F.

begin;

-- ---------------------------------------------------------------------------
-- 1. CLOSED — answered in full. Moves to the operation record as a known fact.
-- ---------------------------------------------------------------------------

-- Leg 3: where the press discharges. Answered definitively: it does not.
update public.project_facts set
  section      = 'operation',
  label        = 'Where the press discharges',
  value        = 'Nowhere. There is no extraction over the press, no stack, no vent and no defined discharge point. Confirmed by you on 17 August 2026, and consistent with the 14 August site visit.',
  source_note  = 'Confirmed by Ruhan on 17 August 2026, against our written record of the site visit',
  confirmable  = true,
  updated_at   = now()
 where id = '276df166-a5a7-4cf6-ac4e-64d449001295';

-- ---------------------------------------------------------------------------
-- 2. NARROWED — substantially answered, only the remainder still asked.
-- ---------------------------------------------------------------------------

-- Leg 1: gas installation. Vessel, certificate and permit received.
update public.project_facts set
  label       = 'Gas installation — three details still open',
  value       = 'Thank you — we have the 22,5 m3 vessel, the SAQCC Gas certificate 576126 of 16 January 2026 and the Tshwane permit. Three things are still needed: the normal fill limit, the separation distances to the boundary and to occupied buildings, and the rated gas input of the heater. The four-weekly refill interval tells us consumption but not rated input.',
  source_note = 'You supplied the vessel capacity, certificate and permit on 17 August 2026. These three remaining figures are what the application and the air assessment ask for',
  updated_at  = now()
 where id = '82f8fc07-b753-44ad-b5a4-eb8d22dc62ec';

-- Leg 3: same installation, air side.
update public.project_facts set
  label       = 'Gas installation — the figures the air assessment needs',
  value       = 'The vessel, certificate and municipal permit are received, with thanks. For the air side we still need the rated heat input of the thermic fluid heater and its fuel consumption at rated duty, together with the fill limit and separation distances.',
  source_note = 'You supplied the vessel capacity, certificate and permit on 17 August 2026. Rated input is what an emission source must be described by',
  updated_at  = now()
 where id = 'c1c1ddc7-b4b9-46e8-9404-74a94ebaac8c';

-- Leg 1: cooling circuit. Source, volume and treatment answered.
update public.project_facts set
  label       = 'The cooling circuit — what happens to the water afterwards',
  value       = 'Thank you — we have municipal supply, roughly 200 litres of evaporative loss, and softened water tested monthly. What is still needed: where blowdown or spent water goes, which treatment chemicals are dosed with their safety data sheets, and when the plant was installed.',
  source_note = 'You answered the source, usage and treatment on 17 August 2026. The discharge destination and chemicals are what the water and waste sections of the application ask for',
  updated_at  = now()
 where id = '9aef661a-474c-498e-b07a-ac610c6f2ad8';

-- Leg 1: site layout. He asked us whether a more detailed one is needed.
update public.project_facts set
  label       = 'A site layout — yes please, marked up',
  value       = 'You asked on 17 August whether a more detailed layout is needed. Yes, please. A marked-up as-built plan showing each machine, the indoor and outdoor storage extents, the offloading and loading areas, the LPG installation and the cooling plant would close more open items at once than any other single document — the storage volumes below included.',
  source_note = 'Answering your question of 17 August 2026. Part 4 of the Department''s section 24G form asks for the facility layout',
  updated_at  = now()
 where id = '6fa57bb0-5e9f-4efb-8adb-3e6a3ea47f4f';

-- Leg 1: storage volumes. He says it is on a plan already shared.
update public.project_facts set
  label       = 'Storage volumes — which drawing carries them?',
  value       = 'You noted on 17 August that this is on the layout already shared. We cannot find a volume on the drawings we hold — the process flow diagram and the 2003 base plans, which predate your fit-out. Please point us at the drawing, or give the approximate area and height for the outdoor pre-shred and indoor post-shred areas.',
  source_note = 'The storage threshold in the waste activities list is expressed in cubic metres and we hold tonnage. Your 17 August answer refers to a layout we do not appear to have',
  updated_at  = now()
 where id = '9a1aea6a-d7d7-4fd1-a5a2-354a4564c090';

-- Leg 2: same volume question, Category C threshold.
update public.project_facts set
  label       = 'Storage capacity in cubic metres — which drawing carries it?',
  value       = 'As on the section 24G leg: you noted this sits on the layout already shared, and we cannot find a volume on the drawings we hold. Category C(1) sets its threshold at 100 cubic metres, so this figure decides whether the registration is engaged at all.',
  source_note = 'Category C(1) of the waste activities list sets the threshold at 100 cubic metres, and we hold tonnage rather than volume',
  updated_at  = now()
 where id = '7ea670f3-f008-4fcd-946c-172aee3ad18f';

-- Leg 1: shredder installation records. He says already sent.
update public.project_facts set
  label       = 'Shredder installation records — which e-mail carried them?',
  value       = 'You noted on 17 August that these went across in an earlier e-mail. They have not reached our file — some earlier attachments went to Luaan directly and did not come through to the admin address. Please resend, or tell us the date of the e-mail and we will retrieve it.',
  source_note = 'When the line was first built bears on the date the activity is treated as having commenced',
  updated_at  = now()
 where id = '8fe19391-98b9-4858-9281-e1d4d31fcd15';

-- Leg 1: equipment list. Promised.
update public.project_facts set
  value       = 'One line per machine: make, model, rated throughput, installation date and first production date. Ruhan undertook on 17 August 2026 to send this, so treat it as in hand rather than as a fresh request.',
  updated_at  = now()
 where id = '321b15be-13dc-4e32-9a0b-4cf057dd44e5';

-- Leg 1: suppliers. Referred to Dewald.
update public.project_facts set
  value       = 'The main sources of incoming material, by company name. Ruhan referred this to Dewald on 17 August 2026.',
  updated_at  = now()
 where id = '29a6ed1f-3e0c-4d7e-b55a-ef4fb3b72547';

-- ---------------------------------------------------------------------------
-- verification
-- ---------------------------------------------------------------------------
select p.sort_order as leg, f.section, count(*)
  from public.project_facts f
  join public.projects p on p.id = f.project_id
 where p.client_id = '7c782793-c84a-4001-a991-a6d41c391913'
   and f.section in ('outstanding','operation')
 group by 1,2 order by 1,2;

commit;
