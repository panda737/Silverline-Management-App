-- ===========================================================================
-- Dilex — facts and clock for the other two projects.
--
-- ⚠️ DELIBERATELY THIN. Neither project has a FACTS card in the repository,
-- so everything below is sourced only from what is actually recorded: the
-- project descriptions, the timeline stages with real completion dates, the
-- documents on file, and the two references to the storage registration in the
-- Elandsfontein FACTS card.
--
-- Nothing is inferred. Where a date or a detail is not known it is either left
-- out or stated as unknown. A padded fact put to a client for confirmation is
-- worse than no fact at all.
--
-- Idempotent: deletes and reloads these two projects' rows.
-- ===========================================================================

begin;

delete from public.project_facts        where project_id in ('c526bae2-dd9e-4a14-a966-164369408aa5','01106702-cb38-451f-886e-a2a82d679356');
delete from public.project_clock_events where project_id in ('c526bae2-dd9e-4a14-a966-164369408aa5','01106702-cb38-451f-886e-a2a82d679356');

-- ======================= DILEX RANDFONTEIN — NORMS & STANDARDS =============
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('c526bae2-dd9e-4a14-a966-164369408aa5','team','Competent authority','DFFE, Directorate: Licensing',null,1,false,'client_safe','Who the registration went to.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','operation','What this is','A Norms and Standards registration for the Randfontein facility. It is a registration against published national standards, not a licence application.',null,1,true,'client_safe','What the matter is. Worth him confirming we have the right facility in mind.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','operation','Separate from Elandsfontein','This registration is for the Randfontein site and is distinct from the Elandsfontein waste management licence application.',null,2,true,'client_safe','The distinction matters and is easy to conflate.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','operation','Submitted','To DFFE Licensing in May 2026, with the zoning certificate and the building plans','our record',3,true,'client_safe','What was lodged and roughly when.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','operation','Where it stands','Awaiting DFFE feedback. A DFFE site visit and a final decision follow.',null,4,false,'client_safe','Where it is now.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','evidence','Norms and Standards application','Held on file','from you',1,false,'client_safe','Held.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','evidence','Randfontein zoning certificate','Held on file','from you',2,false,'client_safe','Held.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','outstanding','The exact submission date','We hold the month but not the day. If you have the submission email or the DFFE acknowledgement, it would close the record.',null,1,false,'client_safe','A real gap and he may be able to close it in a minute.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','outstanding','The Randfontein property description','The erf or portion description, the extent and the street address, so the file carries the property properly.',null,2,false,'client_safe','We genuinely do not hold this.'),
-- internal
('c526bae2-dd9e-4a14-a966-164369408aa5','operation','No FACTS card exists for this project','The repository holds no verified fact file for Randfontein — only the portal record and two documents. Nothing here has been checked against a primary source beyond those.','our own audit, 15 August 2026',50,false,'internal_only','Our own record-keeping gap, not his information. AGENTS.md §4: a folder existing is not the same as a file being verified.');

insert into public.project_clock_events (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note) values
('c526bae2-dd9e-4a14-a966-164369408aa5',null,'Client information received',null,'our record','done',1,'client_safe','What happened.'),
('c526bae2-dd9e-4a14-a966-164369408aa5',null,'Site assessment',null,'our record','done',2,'client_safe','What happened.'),
('c526bae2-dd9e-4a14-a966-164369408aa5','2026-05-01','Application submitted to DFFE','With the zoning certificate and the building plans. ⚠️ We hold the month, not the exact day.','our record — month only','done',3,'client_safe','Dated only to the month, and says so.'),
('c526bae2-dd9e-4a14-a966-164369408aa5',null,'Awaiting DFFE feedback',null,null,'now',4,'client_safe','Where we are.'),
('c526bae2-dd9e-4a14-a966-164369408aa5',null,'DFFE site visit',null,null,'expected',5,'client_safe','What comes next.'),
('c526bae2-dd9e-4a14-a966-164369408aa5',null,'Final decision and registration',null,null,'expected',6,'client_safe','What comes next.');

-- ======================= DILEX PURIFICATION — SECTION 31L ==================
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('01106702-cb38-451f-886e-a2a82d679356','team','Competent authority','DFFE — the matter was handled by B. Perumal',null,1,false,'client_safe','Who ran it.'),
('01106702-cb38-451f-886e-a2a82d679356','operation','What this was','A response to a DFFE pre-compliance notice issued under section 31L of NEMA, concerning the Dilex Purification plant.',null,1,true,'client_safe','What the matter was.'),
('01106702-cb38-451f-886e-a2a82d679356','operation','Outcome','✅ Closed. DFFE confirmed the matter is resolved.','our record',2,true,'client_safe','The outcome, and it is good news.'),
('01106702-cb38-451f-886e-a2a82d679356','operation','Storage registration','12/9/11/ST559/3, dated 26 May 2026 — registered in the name of Dilex Purification','the registration certificate',3,true,'client_safe','His own registration. Note it is in Purification''s name, which he should be aware of.'),
('01106702-cb38-451f-886e-a2a82d679356','evidence','The pre-compliance notice','Held on file','DFFE',1,false,'client_safe','Held.'),
('01106702-cb38-451f-886e-a2a82d679356','evidence','Our response of 13 June 2026','Held on file','our record',2,false,'client_safe','Held. He was party to it.'),
('01106702-cb38-451f-886e-a2a82d679356','evidence','Storage application and supporting documents','Held on file','from you',3,false,'client_safe','Held.'),
-- internal
('01106702-cb38-451f-886e-a2a82d679356','operation','Date conflict on the acknowledgement','The project record says DFFE acknowledged receipt on 12 June 2026, but our response document is dated 13 June 2026. An acknowledgement cannot predate the thing it acknowledges. Not yet reconciled against the primary correspondence.','our own audit, 15 August 2026',50,false,'internal_only','An unreconciled conflict in our own record. Do not put a date to the client until it is settled.'),
('01106702-cb38-451f-886e-a2a82d679356','operation','The storage registration is not in the applicant''s name','It is registered to Dilex Purification, not to the Elandsfontein WML applicant. Bears on the applicant-identity question across the file.','Elandsfontein FACTS card',51,false,'internal_only','Part of the identity analysis. Goes to him framed, in the letter.');

insert into public.project_clock_events (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note) values
('01106702-cb38-451f-886e-a2a82d679356',null,'Pre-compliance notice received','Issued by DFFE under section 31L of NEMA.','DFFE','done',1,'client_safe','What happened. ⚠️ We do not hold the notice date.'),
('01106702-cb38-451f-886e-a2a82d679356',null,'Information gathered',null,'our record','done',2,'client_safe','What happened.'),
('01106702-cb38-451f-886e-a2a82d679356','2026-06-13','Response submitted to DFFE',null,'our response document','done',3,'client_safe','Dated from the document itself.'),
('01106702-cb38-451f-886e-a2a82d679356','2026-06-12','DFFE review','Receipt acknowledged.','our record','done',4,'withheld','WITHHELD: our record dates this the day BEFORE the response it acknowledges. Do not show a date to the client until the conflict is reconciled against the primary correspondence.'),
('01106702-cb38-451f-886e-a2a82d679356','2026-07-13','Matter closed','DFFE confirmed the matter is resolved.','our record','done',5,'client_safe','The outcome.');

commit;

select p.name,
       (select count(*) from public.project_facts f where f.project_id=p.id and f.sensitivity='client_safe') as safe,
       (select count(*) from public.project_facts f where f.project_id=p.id and f.sensitivity='internal_only') as internal,
       (select count(*) from public.project_clock_events c where c.project_id=p.id and c.sensitivity='client_safe') as clock,
       (select count(*) from public.project_clock_events c where c.project_id=p.id and c.sensitivity='withheld') as clock_withheld
  from public.projects p
 where p.id in ('c526bae2-dd9e-4a14-a966-164369408aa5','01106702-cb38-451f-886e-a2a82d679356')
 order by p.name;
