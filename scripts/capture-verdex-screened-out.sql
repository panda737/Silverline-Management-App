-- Verdex Section 24G — complete the GN 921 screening record with the activities
-- that were tested and NOT pulled into the rectification.
--
-- A register showing only triggered activities reads as though nobody tested
-- the negatives. These three are the negatives, and two of them are load-
-- bearing: B(3) is what keeps the file on Basic Assessment rather than a full
-- Scoping and EIR, and C(1)/C(6) are what keep storage and baling out of the
-- unlawful commencement — which is why the first bale of 5 August 2025 is not
-- the waste-side commencement date.
--
-- C(1) and C(6) are recorded HERE, on the Section 24G register, because this is
-- the GN 921 screening record for the rectification and the whole point is that
-- they fall outside it. The Norms & Standards leg
-- (7117f7c6-e983-4582-9a8e-3174bace12de) carries them as its own subject; the
-- listed-activity table only renders on WML projects in any case.
--
-- ⚠️ Wording below is as recorded on 00 - FACTS.md §6F, which abridges B(3) and
-- C(1). Both must be quoted in full off the gazette before lodgement — see
-- _PLAYBOOK/LEGISLATION REGISTER.md and AGENTS.md §8C.

insert into public.project_listed_activities
  (project_id, activity_number, category, description, waste_stream, threshold, project_capacity, triggered, notes, sort_order)
values
  ('6db92884-44b6-43e3-8518-218fb4260646', 'B(3)', 'Category B',
   'The recovery of waste including the refining, utilisation, or co-processing of waste in excess of 100 tons of general waste per day. [ABRIDGED on the FACTS card — quote in full off the gazette before lodgement.]',
   'General waste',
   'In excess of 100 t/day',
   'Design approx 30 t/day; press max approx 48 t/day',
   'no',
   '⭐ THRESHOLD NOT MET, and this is the most valuable negative on the register — it is what keeps the file on BASIC ASSESSMENT + WML rather than a full Scoping and EIR. Say so positively in the application rather than leaving it to be inferred. ⚠️ Recompute against the INTEGRATED twelve-shredder line, not summed nameplates: if capacity is found to exceed 100 t/day the entire route changes. Source: 00 - FACTS.md §6F.',
   6),

  ('6db92884-44b6-43e3-8518-218fb4260646', 'C(1)', 'Category C',
   'The storage of general waste at a facility that has the capacity to store in excess of 100 m³ of general waste at any one time. [ABRIDGED on the FACTS card — quote in full off the gazette before lodgement.]',
   'General waste',
   'Capacity to store in excess of 100 m³ at any one time',
   'Storage 300–500 t across indoor and outdoor areas; VOLUME IN m³ NOT YET ESTABLISHED',
   'tbc',
   'CATEGORY C — norms and standards plus REGISTRATION, not a licence, so this is NOT an unlawful commencement and no fine attaches. Governed by the Norms and Standards for the Storage of Waste, GN R926 in GG 37088. ⭐ THIS IS WHY the first bale of 5 August 2025 is not the waste-side commencement date. Recorded on this register as part of the screening; the subject belongs to the Norms & Standards leg. ⛔ Whether the 100 m³ threshold is reached at all is unknown — we hold tonnage, the gazette is in cubic metres. Source: 00 - FACTS.md §6F.',
   7),

  ('6db92884-44b6-43e3-8518-218fb4260646', 'C(6)', 'Category C',
   'The sorting, shredding, grinding, crushing, screening or baling of general waste at a waste facility that has an operational area that is 1 000 m² and more.',
   'General waste',
   'Operational area of 1 000 m² and more',
   'Operational area comfortably over 1 000 m² — 7 342 m² covered on erf 74 of 12 243 m²',
   'yes',
   'CATEGORY C — norms and standards plus registration under GN 1094 in GG 41175, NOT a licence, so shredding and baling are not unlawful commencement. ⭐ SHREDDING ON ITS OWN IS NOT THE LICENSABLE ACT — THE HEAT IS. That distinction is what confines the rectification to the press. Recorded here as part of the screening; the subject belongs to the Norms & Standards leg. ⚠️ Threshold taken as met on the 2003 building plans (7 342 m² covered); the waste facility''s operational area has not been separately measured, and it is not marginal. Source: 00 - FACTS.md §6F.',
   8);

select activity_number, category, triggered, sort_order
  from public.project_listed_activities
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646'
 order by sort_order;
