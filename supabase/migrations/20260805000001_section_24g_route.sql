-- Section 24G rectification route.
--
-- A s24G is not a fourth licensing category. It is a rectification process under
-- section 24G of NEMA for an activity that has already commenced, and it wraps
-- around whichever licensing route would otherwise have applied. It carries two
-- things the A/B/C routes do not:
--
--   1. Public participation BEFORE lodgement. Regulation 8 of GN R698 of
--      20 July 2017 requires a preliminary advertisement in a local newspaper and
--      on the applicant's website before the application is submitted, an I&AP
--      register attached to the application, and a minimum 20-day comment period.
--      Non-compliance is an offence.
--
--   2. An administrative fine. The fine committee recommends, the competent
--      authority determines, and if the fine is not paid within the period
--      specified THE APPLICATION LAPSES and partial payments are not refunded.
--      The fine decision is separately appealable within 30 days.
--
-- Widening the check constraint rather than converting to an enum keeps this
-- consistent with how the column was originally defined.

alter table public.projects
  drop constraint if exists projects_route_check;

alter table public.projects
  add constraint projects_route_check
  check (route in ('category_a', 'category_b', 'category_c', 'section_24g'));
