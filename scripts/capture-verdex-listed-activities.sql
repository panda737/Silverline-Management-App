-- Verdex Section 24G — capture the remaining GN 921 Category A activities.
--
-- Only A(6) was on the register, which read as though it were the only listed
-- activity screened. Wording is taken from 00 - FACTS.md §6F, which was read
-- off the consolidated notice (GN 921 in GG 37083 of 29 November 2013, as
-- amended by GN 332, GN R633, GN 1094 and GN 1757 of 11 February 2022) rather
-- than from a summary.
--
-- A(3) and A(5) are cited in the application but carry the internal-
-- manufacturing exclusion, which Verdex already argue in writing and which
-- Waldo has not settled — so they are 'tbc', not 'yes'. A(6) has no such
-- exclusion, which is why it is the one that bites.

update public.project_listed_activities set sort_order = 3
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646' and activity_number = 'A(6)';

insert into public.project_listed_activities
  (project_id, activity_number, category, description, waste_stream, threshold, project_capacity, triggered, notes, sort_order)
values
  ('6db92884-44b6-43e3-8518-218fb4260646', 'A(3)', 'Category A',
   'The recycling of general waste at a facility that has an operational area in excess of 500 m², excluding recycling that takes place as an integral part of an internal manufacturing process within the same premises.',
   'General waste',
   'Operational area in excess of 500 m²',
   'Operational area well in excess of 500 m² — erf 74 is 12 243 m² with roughly 7 342 m² covered',
   'tbc',
   'CITED in the application on the prudent basis. Turns entirely on the closing internal-manufacturing exclusion, which Verdex already argue in writing and which Waldo has not settled. Stands or falls with A(5). NOTE: even if the exclusion succeeds here it does not clear the file — the exclusion does not appear in A(6). Source: 00 - FACTS.md §6F and Waldo 8 August 2026.',
   1),

  ('6db92884-44b6-43e3-8518-218fb4260646', 'A(5)', 'Category A',
   'The recovery of waste including the refining, utilisation, or co-processing of waste in excess of 10 tons but less than 100 tons of general waste per day, excluding recovery that takes place as an integral part of an internal manufacturing process within the same premises.',
   'General waste',
   'More than 10 t/day, less than 100 t/day',
   'Design approx 30 t/day; press max approx 48 t/day',
   'tbc',
   'CITED in the application on the prudent basis. Applies on capacity unless the closing internal-manufacturing exclusion holds — the same argument as A(3), and unsettled for the same reason. Source: 00 - FACTS.md §6F and Waldo 8 August 2026.',
   2),

  ('6db92884-44b6-43e3-8518-218fb4260646', 'A(12)', 'Category A',
   'The construction of a facility for a waste management activity listed in Category A of this Schedule.',
   'General waste',
   'Applies where the facility constructed is for a Category A activity',
   'Installation programme ran September 2025 to February 2026',
   'tbc',
   '⚠️ CITED, and the one that can MOVE THE COMMENCEMENT DATE. If the press/facility installation was construction of a Category A facility, NEMA''s physical-implementation definition may make the first installation or site-work date the waste-side commencement — potentially September 2025 rather than the 13 March 2026 first hot operation. The exact first physical-work date is STILL REQUIRED and is in the Ruhan request. Source: 00 - FACTS.md §6F.',
   4),

  ('6db92884-44b6-43e3-8518-218fb4260646', 'A(13)', 'Category A',
   'The expansion of a waste management activity or facility where the applicable threshold may be reached or exceeded as a result of the expansion.',
   'General waste',
   'Where expansion reaches or exceeds the applicable threshold',
   'Twelve shredders, in three parallel trains of two primary and two secondary each',
   'no',
   '⛔ NOT CITED, on the basis that the twelve shredders were ONE installation rather than a later expansion — and THAT BASIS IS NOT YET EVIDENCED. Obtain the installation dates and the integrated rated bottleneck; do not simply add nameplates. If the build-out was staged, A(13) is engaged and the capacity position must be recomputed. Source: 00 - FACTS.md §6F.',
   5);

select activity_number, triggered, sort_order, left(notes, 60) as note_head
  from public.project_listed_activities
 where project_id = '6db92884-44b6-43e3-8518-218fb4260646'
 order by sort_order;
