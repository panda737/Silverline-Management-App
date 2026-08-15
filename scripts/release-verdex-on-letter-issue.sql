-- ===========================================================================
-- ⛔ DO NOT RUN THIS UNTIL THE DEWALD LETTER HAS ACTUALLY BEEN ISSUED.
--
-- Everything below was withheld on ONE condition, written into each item's
-- sensitivity_note when it was created: that the client hears the fine and the
-- cessation risk in a considered letter first, not as a row on a screen.
--
-- Running it before the letter goes does the precise harm the classification
-- exists to prevent. Running it after is simply keeping a promise.
--
-- It is idempotent: run it twice and nothing changes the second time.
--
-- WHAT IT RELEASES
--   6 facts        3 on the Section 24G leg, 3 on the Section 22A leg
--   2 clock events 1 on each of those legs
--   7 stages       4 fine stages on the s24G leg, 3 on the s22A leg
--
-- WHAT IT DELIBERATELY LEAVES ALONE
--   Every internal_only item. Those are our analysis and our assessment of the
--   client's exposure, and no letter changes that.
--
-- SEPARATE DECISION AT THE BOTTOM: the "Legal activity screening" stage.
-- ===========================================================================

begin;

-- --- 1. facts --------------------------------------------------------------
-- The note is REWRITTEN rather than left saying "withheld until", because a
-- note that contradicts its own flag is exactly the drift this column exists
-- to stop.

update public.project_facts f
   set sensitivity = 'client_safe',
       sensitivity_note = 'Released ' || to_char(current_date, 'DD Month YYYY')
         || ' on the Dewald letter being issued, which was the condition recorded when it was withheld. Original reason: '
         || coalesce(f.sensitivity_note, '(none recorded)')
 where f.sensitivity = 'withheld'
   and f.project_id in (
     select id from public.projects
      where client_id = (select client_id from public.projects
                          where id = '6db92884-44b6-43e3-8518-218fb4260646'));

-- --- 2. clock events -------------------------------------------------------

update public.project_clock_events c
   set sensitivity = 'client_safe',
       sensitivity_note = 'Released ' || to_char(current_date, 'DD Month YYYY')
         || ' on the Dewald letter being issued. Original reason: '
         || coalesce(c.sensitivity_note, '(none recorded)')
 where c.sensitivity = 'withheld'
   and c.project_id in (
     select id from public.projects
      where client_id = (select client_id from public.projects
                          where id = '6db92884-44b6-43e3-8518-218fb4260646'));

-- --- 3. the fine and cessation stages --------------------------------------
-- Named explicitly rather than by a wildcard. A wildcard here would one day
-- reveal a stage nobody decided to reveal.

update public.project_timeline_items t
   set client_visible = true
 where t.client_visible = false
   and t.stage_name in (
     'Administrative fine',
     'Payment of the fine',
     'Fine committee consideration',
     'Fine appeal window',
     'Cessation direction')
   and t.project_id in (
     select id from public.projects
      where client_id = (select client_id from public.projects
                          where id = '6db92884-44b6-43e3-8518-218fb4260646'));

commit;

-- ===========================================================================
-- ⚠️ A SEPARATE DECISION — NOT INCLUDED ABOVE
--
-- The Section 24G leg also hides a stage called "Legal activity screening",
-- marked completed. Its NAME discloses nothing. Its DESCRIPTION does:
--
--   "Listed activities that were commenced without authorisation identified
--    and confirmed."
--
-- That was the right call before the letter. AFTER the letter it is no longer
-- a disclosure - the letter says the same thing in the first paragraph - and
-- keeping it hidden costs something: the client's timeline reads 13 stages
-- when the real process has 18, and a completed piece of our work is invisible
-- to the person paying for it.
--
-- Juandre's call. Uncomment to release it too.
-- ---------------------------------------------------------------------------
-- update public.project_timeline_items
--    set client_visible = true
--  where stage_name = 'Legal activity screening'
--    and project_id = '6db92884-44b6-43e3-8518-218fb4260646';
-- ===========================================================================

-- --- verification: run this after, and read it before inviting anyone -------
select p.sort_order as leg, p.name,
       (select count(*) from public.project_facts f
         where f.project_id = p.id and f.sensitivity = 'withheld')        as still_withheld_facts,
       (select count(*) from public.project_clock_events c
         where c.project_id = p.id and c.sensitivity = 'withheld')        as still_withheld_clock,
       (select count(*) from public.project_facts f
         where f.project_id = p.id and f.sensitivity = 'client_safe')     as client_safe_facts,
       (select count(*) from public.project_timeline_items t
         where t.project_id = p.id and t.client_visible)                  as stages_visible,
       (select count(*) from public.project_facts f
         where f.project_id = p.id and f.sensitivity = 'internal_only')   as still_internal
  from public.projects p
 where p.client_id = (select client_id from public.projects
                       where id = '6db92884-44b6-43e3-8518-218fb4260646')
 order by p.sort_order;
