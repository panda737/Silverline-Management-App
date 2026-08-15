-- Stage names were written as completion claims ("Site information received"),
-- so the CURRENT STAGE box read as though the stage were already achieved when
-- it was in fact in progress. The status indicator already carries the state;
-- the name only needs to carry the subject.
do $$
declare
  s24g uuid := '6db92884-44b6-43e3-8518-218fb4260646';
  ns   uuid := '7117f7c6-e983-4582-9a8e-3174bace12de';
  ael  uuid := '80b38fdc-431b-4fb7-96e0-be1e2b2a052e';
begin
  -- Leg 1 — Section 24G + WML
  update public.project_timeline_items set stage_name='EAP appointment'                where project_id=s24g and sort_order=2;
  update public.project_timeline_items set stage_name='Site information'               where project_id=s24g and sort_order=4;
  update public.project_timeline_items set stage_name='Commencement dates'             where project_id=s24g and sort_order=5;
  update public.project_timeline_items set stage_name='Pre-application advertisement'  where project_id=s24g and sort_order=6;
  update public.project_timeline_items set stage_name='Section 24G application'        where project_id=s24g and sort_order=8;
  update public.project_timeline_items set stage_name='Authority directive'            where project_id=s24g and sort_order=9;
  update public.project_timeline_items set stage_name='Directed reports'               where project_id=s24g and sort_order=10;
  update public.project_timeline_items set stage_name='Administrative fine'            where project_id=s24g and sort_order=12;
  update public.project_timeline_items set stage_name='Payment of the fine'            where project_id=s24g and sort_order=14;
  update public.project_timeline_items set stage_name='Decision on the authorisation'  where project_id=s24g and sort_order=15;
  update public.project_timeline_items set stage_name='Licence conditions'             where project_id=s24g and sort_order=17;

  -- Leg 2 — Norms & Standards
  update public.project_timeline_items set stage_name='Category C activities'          where project_id=ns and sort_order=1;
  update public.project_timeline_items set stage_name='Storage volume'                 where project_id=ns and sort_order=2;
  update public.project_timeline_items set stage_name='The norms in their current form' where project_id=ns and sort_order=3;
  update public.project_timeline_items set stage_name='Registration authority'         where project_id=ns and sort_order=4;
  update public.project_timeline_items set stage_name='Registration submission'        where project_id=ns and sort_order=6;
  update public.project_timeline_items set stage_name='Registration confirmation'      where project_id=ns and sort_order=7;

  -- Leg 3 — Section 22A + AEL
  update public.project_timeline_items set stage_name='Air-side listed activity'       where project_id=ael and sort_order=1;
  update public.project_timeline_items set stage_name='Licensing authority'            where project_id=ael and sort_order=2;
  update public.project_timeline_items set stage_name='Discharge point'                where project_id=ael and sort_order=3;
  update public.project_timeline_items set stage_name='Emission measurement'           where project_id=ael and sort_order=4;
  update public.project_timeline_items set stage_name='Application preparation'        where project_id=ael and sort_order=6;
  update public.project_timeline_items set stage_name='Submission to the City of Tshwane' where project_id=ael and sort_order=7;
  update public.project_timeline_items set stage_name='Administrative fine'            where project_id=ael and sort_order=10;
  update public.project_timeline_items set stage_name='Payment of the fine'            where project_id=ael and sort_order=11;
  update public.project_timeline_items set stage_name='Cessation direction'            where project_id=ael and sort_order=12;
end $$;

select p.sort_order as leg, t.sort_order as n, t.stage_name, t.status, t.client_visible
  from public.project_timeline_items t join public.projects p on p.id=t.project_id
 where p.client_id=(select client_id from public.projects where id='6db92884-44b6-43e3-8518-218fb4260646')
 order by p.sort_order, t.sort_order;
