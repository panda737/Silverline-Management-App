-- ===========================================================================
-- Dilex Inland WML — facts and statutory clock for the client portal.
--
-- Every row below is taken from the classification already filed at
--   Elandsfontein EIA Dialex/Dilex Inland WML/Workings/01_Drafts/
--   CLIENT PORTAL - build plan and fact classification - 15 August 2026.md
-- sections 4 and 5. Nothing here is a fresh judgement about what may cross.
--
-- Idempotent: deletes and reloads this project's rows.
-- ===========================================================================

begin;

delete from public.project_facts        where project_id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5';
delete from public.project_clock_events where project_id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5';

-- --- TEAM ------------------------------------------------------------------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','team','Environmental Assessment Practitioner','Mpanyana Lucas Mahlangu — EAPASA registration 2021/4461, valid to 31 March 2027','the EAPASA register',1,false,'client_safe','The EAP of record.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','team','Competent authority','DFFE, Directorate: Licensing',null,2,false,'client_safe','Who decides the application.');

-- --- OPERATION: the application, the property, the plant, the scope --------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','DFFE reference','12/9/11/L260513113929/3/N','the acceptance letter, 16 July 2026',1,true,'client_safe','His own reference number.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Process','Scoping and Environmental Impact Reporting — NEMA EIA Regulations 2014, Part 3',null,2,false,'client_safe','What route the application follows.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Applicant','Dilex Inland (Pty) Ltd — registration 2026/215196/07','your CIPC certificate (COR14.3)',3,true,'client_safe','His own company details.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Property','Portion 45 (of Portion 11) of the Farm Elandsfontein No. 412, Registration Division JR','title deed T29725/2004',4,true,'client_safe','From the deeds record.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Extent','8,5654 hectares (85 654 square metres)','the Deeds Office record, 1 August 2026',5,true,'client_safe','The verified extent. He should see the figure the application will carry.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Address','45 Riverview Drive, Elandsfontein AH, Ekurhuleni 1601',null,6,true,'client_safe','His own address.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Municipality','City of Ekurhuleni Metropolitan — Ward 25','the zoning certificate on file',7,true,'client_safe','Plain fact about the property.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Zoning','Agriculture, with consent use "C — Timber Country". Outside the urban development boundary. Coverage 5%, height two storeys','the zoning certificate on file (unsigned and undated — a fresh certificate is being obtained)',8,true,'client_safe','The zoning position, with the honest caveat that the certificate is unsigned.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Coverage','Allowance 4 283 square metres. The roofed buildings are an estimated 2 200–3 000 square metres, so 2,6–3,5 per cent — inside the primary right','computed off the registered extent; the roofed area is an estimate, not a measurement',9,true,'client_safe','Good news and clearly caveated as an estimate.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Water rights','No water rights attach to Portion 45 — title condition III','title deed',10,false,'client_safe','From his own title deed.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Right of way','A 15,74 m public right of way runs along line A–D in favour of the general public — title condition IV, Notarial Deed 713/1948','title deed',11,false,'client_safe','From his own title deed.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Development footprint','Zone A, the existing operational yard — approximately 8 960 square metres. Zone B, the open ground to the north, is not developed','a trace on satellite imagery, not a survey',12,true,'client_safe','CONFIRMABLE and important: three specialist studies rely on this and written confirmation is outstanding.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Surfaces','Concrete at the warehouse floors, door aprons and bund floors. The yard itself is compacted earth and unsealed','your site photographs of 29 May 2026',13,true,'client_safe','From his own photographs.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Tank inventory','Eight tanks of 42 000 litres in two bunds, signed 120 000 litres each','your site photographs of 29 May 2026',14,true,'client_safe','From his own photographs.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Site responsible person','Vernon van der Berg — 069 490 6150','the gate signage',15,true,'client_safe','His own staff member, from his own signage.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','What is applied for','Reception, classification and storage; used oil re-refining by vacuum distillation; filtration and clean oil manufacture; oil–water separation and effluent treatment; used oil filter and container recovery; chemical re-use and blending; waste petrol and diesel dewatering','the accepted Final Scoping Report',16,true,'client_safe','The scope. He should check it describes what he actually does.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','What is NOT applied for','No thermal treatment of any kind. Tyre pyrolysis, thermal destruction of residues and thermal cracking are all outside this application','the scope decision of 2 August 2026',17,true,'client_safe','The scope decision. Worth him confirming explicitly.');

-- --- EVIDENCE --------------------------------------------------------------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','evidence','Storage registration','12/9/11/ST559/3 — 26 May 2026','the registration certificate',1,false,'client_safe','Held on file.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','evidence','Site photographs','Received 29 May 2026','from you',2,false,'client_safe','Received from him.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','evidence','Zoning certificate','Held — unsigned and undated; a fresh certificate is being obtained','from you',3,false,'client_safe','Held, with the gap stated honestly.');

-- --- OUTSTANDING -----------------------------------------------------------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','The lease, or the written instrument you occupy Portion 45 under','Whatever written agreement records Dilex''s right to occupy the property.',null,1,false,'client_safe','We are asking him for it. Never previously requested.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Waste streams, with SAWIS codes and tonnages','Exactly which streams the facility receives, their SAWIS codes and the tonnages.',null,2,false,'client_safe','Acceptance condition 2 requires the draft EIAR to specify these.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Written confirmation that the plant sits on Zone A','A line confirming the operational footprint is the existing yard.',null,3,false,'client_safe','Three specialist studies cite it.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Vacuum distillation specification','Make, model, rated throughput and operating temperatures.',null,4,false,'client_safe','Also decides the air-licence question.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Residue destinations','Where the residues go, and to whom.',null,5,false,'client_safe','Needed for the EIAR.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','A scaled site layout','A drawing showing the plant, tanks, bunds and storage areas to scale.',null,6,false,'client_safe','Needed for the EIAR.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','When the existing tanks were built, and under what authorisation','The construction date of the inherited tanks, and any approval held for them.',null,7,false,'client_safe','Only he can answer it, and it decides how the existing storage is treated.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Six site photographs','The electricity meter, the DB board, the pit outlet and the plant nameplate.',null,8,false,'client_safe','Closes the last gaps in the site record.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','outstanding','Your contact details for the municipal form','Identity number, and postal, physical, email and telephone details.',null,9,false,'client_safe','Needed for municipal Form CU-1 section 4.');

-- --- INTERNAL ONLY — the findings that never cross -------------------------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The applicant''s interest in the land is not established','Shares in the registered owner are not a right in the land. A 51% shareholding cannot ground a power of attorney.','our analysis',50,false,'internal_only','A finding that the client''s own statement was wrong. Goes to him in the letter, framed, not as a portal row.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','No lease has ever been produced','How Dilex occupies Portion 45 rests on the client''s account alone.','our analysis',51,false,'internal_only','A finding about him rather than for him.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The accepted FSR carried the extent as 4,5 ha','Wrong by 89% against the deeds record of 8,5654 ha, in a report the Department has accepted.','the deeds search, 1 August 2026',52,false,'internal_only','A finding that his record was wrong, and a correction going to a regulator.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The fire risk assessment does not exist','The FSR states it was completed. It does not exist.','our audit of the record',53,false,'internal_only','A finding that his record was wrong.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The site sensitivity verification did not exist','Cited six times as available when it did not exist.','our audit of the record',54,false,'internal_only','A finding that his record was wrong.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The "acquired at auction" statement contradicts the deeds record','Stated in the 13 June 2026 section 31L response.','the deeds record',55,false,'internal_only','A finding that his own signed statement was wrong. See the build plan section 7.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The NEMA listing-notice gap','LN1-51, LN2-4 and the LN3 limbs, and whether the inherited 600 m³ is Dilex''s own unlawful development.','Waldo, 7 August 2026',56,false,'internal_only','A possible contravention he has not been told about. The gravest item on the file.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Residual risk on acceptance condition 3','DFFE may not treat condition 3 as discharged by a consent use rather than a rezoning.','our analysis',57,false,'internal_only','Our strategy and our assessment of the risk.');

-- --- WITHHELD — released on the letter to Hamish ---------------------------
insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The extent in the accepted FSR is being corrected to DFFE','The Final Scoping Report the Department accepted carried the property extent incorrectly. We are correcting it.','the deeds search',60,false,'withheld','WITHHELD until the letter to Hamish has been issued. He must hear this framed, not as a line on a screen.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','The consent-use application needs a Power of Attorney from the registered owner','Your own signature cannot supply it, because the applicant is not the registered owner of the land.','our analysis',61,false,'withheld','WITHHELD until the letter to Hamish has been issued. Same condition.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','operation','Acceptance condition 3 speaks of rezoning','Our instrument is a consent use. The wording of the condition and the route we are taking are not the same word.','the acceptance letter, 16 July 2026',62,false,'withheld','WITHHELD until the letter to Hamish has been issued. Same condition.');

-- --- THE STATUTORY CLOCK ---------------------------------------------------
insert into public.project_clock_events (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note) values
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-04-06','Screening report generated',null,'the national Screening Tool','done',1,'client_safe','What happened, and when.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-04-21','Application fee paid','R10 000.','the receipt on file','done',2,'client_safe','Deliberately does not say who paid it — that is commercial.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-05-13','Application lodged with DFFE',null,'our record','done',3,'client_safe','What happened, and when.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-05-18','DFFE reference assigned','12/9/11/L260513113929/3/N','DFFE','done',4,'client_safe','His own reference.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-06-03','Scoping Report and Plan of Study submitted','Regulation 21(1) allowed 44 days. It went in 21 days early.','our record','done',5,'client_safe','Worth him seeing.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-07-16','DFFE accepted the Final Scoping Report','With seven conditions to be addressed in the next phase. Regulation 22, on the last day of its 43-day window.','the acceptance letter','done',6,'client_safe','The key milestone.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-07-17','Acceptance letter received','Regulation 4(1).','our record','done',7,'client_safe','Receipt, as distinct from the decision date.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-08-02','Screening Tool re-run with the development footprint',null,'our record','done',8,'client_safe','What we did, and when.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5',null,'Draft EIAR and EMPr, and the specialist studies','In preparation, ahead of a 30-day public participation round.',null,'now',9,'client_safe','Where we are.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5','2026-11-02','EIAR and EMPr due to DFFE','Regulation 23(1) allows 106 days.','our arithmetic under Regulation 3, not a date given by the Department','expected',10,'client_safe','The deadline, explicitly labelled as ours.'),
('e8e6c132-5b0b-451f-8912-043af66d1ec5',null,'DFFE decision','Regulation 24(1) allows 107 days.','not yet computed under Regulation 3','expected',11,'withheld','WITHHELD until the Regulation 3 arithmetic is worked and recorded on the FACTS card. A date here now would be invented.');

commit;

select 'facts' as kind, sensitivity, count(*) from public.project_facts where project_id='e8e6c132-5b0b-451f-8912-043af66d1ec5' group by sensitivity
union all
select 'clock', sensitivity, count(*) from public.project_clock_events where project_id='e8e6c132-5b0b-451f-8912-043af66d1ec5' group by sensitivity
order by 1, 2;
