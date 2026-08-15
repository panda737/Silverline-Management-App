-- Replace the register's wording with the verbatim gazette text, and correct the
-- two errors found on 15 August 2026 by reading GN 921 itself:
--   A(13) was recorded in words that appear nowhere in the instrument
--   A(12) had lost the parenthetical that stops it being a standalone trigger
-- Gazettes now held in "1. Documents/Legislation". Full working: FACTS card 6F.

update public.project_listed_activities set
  description = 'The recycling of general waste at a facility that has an operational area in excess of 500m2, excluding recycling that takes place as an integral part of an internal manufacturing process within the same premises.',
  notes = 'VERBATIM, GN 921 GG 37083 (primary, gov.za), unamended. Cited on the prudent basis but turns entirely on the closing internal-manufacturing exclusion, which Verdex already argue in writing and Waldo has not settled. Stands or falls with A(5). Even if the exclusion succeeds it does not clear the file, because it does not appear in A(6). Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(3)';

update public.project_listed_activities set
  description = 'The recovery of waste including the refining, utilisation, or co-processing of waste in excess of 10 tons but less than 100 tons of general waste per day or in excess of 500kg but less than 1 ton of hazardous waste per day, excluding recovery that takes place as an integral part of an internal manufacturing process within the same premises.',
  threshold = 'General waste: more than 10 t/day, less than 100 t/day (hazardous limb not applicable)',
  notes = 'VERBATIM, GN 921 GG 37083 (primary, gov.za), unamended. The hazardous-waste limb was missing from our earlier record; it does not apply, this is general waste. Same internal-manufacturing exclusion as A(3), unsettled for the same reason. Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(5)';

update public.project_listed_activities set
  description = 'The treatment of general waste using any form of treatment at a facility that has the capacity to process in excess of 10 tons but less than 100 tons per day calculated as a monthly average, excluding the treatment of organic waste using composting and any other organic waste treatment.',
  threshold = 'Capacity to process more than 10 t/day, less than 100 t/day, monthly average',
  notes = 'THE OPERATIVE ACTIVITY. Substituted by GN 1757 of 11 February 2022. WARNING: this wording comes from the CER consolidation - GN 1757 in GG 45907 is NOT HELD and must be read before lodgement. The test is CAPACITY TO PROCESS, not throughput, unlike B(3) which is a processes test. Carries NO internal-manufacturing exclusion, which is why that argument cannot clear the file. Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(6)';

update public.project_listed_activities set
  description = 'The construction of a facility for a waste management activity listed in Category A of this Schedule (not in isolation to associated waste management activity).',
  threshold = 'Construction of a facility for a Category A activity - not in isolation from it',
  notes = 'CORRECTED 15 August 2026: the parenthetical "(not in isolation to associated waste management activity)" was MISSING from our record. A(12) is NOT a standalone trigger - it rides on the associated activity. It can still move the commencement date to September 2025 IF the installation was construction FOR the Category A press activity, in which case the physical-implementation definition fixes the date at first site work rather than the 13 March 2026 first hot operation. The first physical-work date is still outstanding. VERBATIM, GN 921 GG 37083 (primary, gov.za), unamended. Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(12)';

update public.project_listed_activities set
  description = 'The expansion of a waste management activity listed in Category A or B of this Schedule which does not trigger an additional waste management activity in terms of this Schedule.',
  threshold = 'Expansion of a Category A or B activity that does not itself trigger a further activity',
  project_capacity = 'The Category A activity here is the press, A(6). The twelve shredders are Category C.',
  notes = 'OUR PREVIOUS WORDING WAS WRONG. We had recorded "expansion ... where the applicable threshold may be reached or exceeded", which appears NOWHERE in GN 921 - it reads like the NEMA EIA listing-notice formula, not the waste list. The real text is a RESIDUAL clause catching expansion of a Category A or B activity that does not already trigger something else. THIS CHANGES THE REASONING: the earlier basis for not citing it, that the twelve shredders were one installation rather than a later expansion, is BESIDE THE POINT - shredding is Category C, not A or B, so expanding the shredder line is not caught however it was staged. What A(13) DOES reach is the PRESS. Hold it open against any expansion of the press line, not against the shredder installation dates. VERBATIM, GN 921 GG 37083 (primary, gov.za), unamended. Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(13)';

update public.project_listed_activities set
  description = 'The recovery of waste including the refining, utilisation, or co-processing of the waste at a facility that processes in excess of 100 tons of general waste per day or in excess of 1 ton of hazardous waste per day, excluding recovery that takes place as an integral part of an internal manufacturing process within the same premises.',
  threshold = 'Processes more than 100 t/day of general waste',
  notes = 'NOT MET at 48 t/day - this is what keeps the file on BASIC ASSESSMENT rather than a full Scoping and EIR. Assert it positively in the application. NOTE THE ASYMMETRY our earlier abridgement had lost: B(3) says "PROCESSES" (actual throughput) while A(6) says "has the CAPACITY TO PROCESS". They are not the same test and must not be answered as though they were. Recompute against the INTEGRATED twelve-shredder line, not summed nameplates. VERBATIM, GN 921 GG 37083 (primary, gov.za), unamended. Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'B(3)';

update public.project_listed_activities set
  description = 'The storage of general waste at a facility that has the capacity to store in excess of 100m3 of general waste at any one time, excluding the storage of waste in lagoons or temporary storage of such waste.',
  notes = 'CATEGORY C - norms and standards plus REGISTRATION, not a licence, so not unlawful commencement and no fine attaches. Governed by the Norms and Standards for the Storage of Waste, GN R926 in GG 37088, named in the Category C chapeau. This is why the first bale of 5 August 2025 is not the waste-side commencement date. Whether the threshold is reached at all is UNKNOWN - the gazette is in cubic metres and we hold tonnage. VERBATIM from GN 1094 GG 41175 (primary, gov.za). Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'C(1)';

update public.project_listed_activities set
  notes = 'CATEGORY C - registration under GN 1094 in GG 41175, named in the Category C chapeau. CONFIRMED AGAINST THE AMENDING NOTICE ITSELF: GN 1094 of 11 October 2017 REPEALED this activity from Category A, where it was A(2), and inserted it into Category C as item (6). So until 11 October 2017 shredding above 1 000 m2 was licensable; since then it is a registration activity, and Verdex shred well after 2017. THIS IS THE SOURCE for "shredding on its own is not the licensable act - the heat is". GN 1094 also imposes a positive duty: register under paragraph 4(2) of the norms and comply within 90 days of registration, which is Leg 3 substance. Threshold taken as met on the 2003 plans (7 342 m2 covered); not marginal. VERBATIM from GN 1094 (primary, gov.za). Source: FACTS 6F.'
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'C(6)';

select activity_number, triggered, left(description, 50) as wording
  from public.project_listed_activities
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646'
 order by sort_order;
