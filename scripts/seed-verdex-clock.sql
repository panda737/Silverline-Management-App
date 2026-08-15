-- Verdex — the statutory clock as the client sees it.
-- Every event anchored to what establishes it. Nothing about the fine,
-- cessation, coverage or the site's previous use appears here.

delete from public.project_clock_events
where project_id = '6db92884-44b6-43e3-8518-218fb4260646';

insert into public.project_clock_events
  (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note)
values
('6db92884-44b6-43e3-8518-218fb4260646','2026-07-15','Non-disclosure agreement signed',
 'Signed by both parties before any information changed hands.',
 'the signed NDA of 15 July 2026','done',10,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-07-23','Quotation issued',
 'QUO0000794 — the environmental compliance scope, in three phases.',
 'our quotation of 23 July 2026','done',20,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-07-27','Mandate accepted and work commenced',
 'Signed quotation returned and the first phase settled, so the file opened.',
 'your payment of 27 July 2026','done',30,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-07-30','First document set received',
 'CIPC registration certificate, the lease, the zoning certificate and the fire document.',
 'your email of 30 July 2026','done',40,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-03','Architectural plans received',
 'Approved building plan 1655/03, being the building as it stood when Verdex took occupation.',
 'Ruhan''s email of 3 August 2026','done',50,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-05','Property description settled',
 'Erf 74 Waltloo confirmed at 12 243 m², with the title deed, boundaries and services established.',
 'the Deeds Office record','done',60,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-06','Competent authority confirmed',
 'The waste side goes to the Gauteng Department of Agriculture and Rural Development. The air side is a separate application to the City of Tshwane.',
 'our reading of the Department''s own form','done',70,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-06','Environmental Assessment Practitioner appointed',
 'Lucas Mahlangu, EAPASA registration 2021/4461. An application of this kind has to be prepared under a registered practitioner, and he signs what an EAP must sign.',
 'his EAPASA certificate, valid to 31 March 2027','done',80,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-07','Technical answers received',
 'Commissioning dates, the operating pattern and the emissions position.',
 'Ruhan''s email of 7 August 2026','done',90,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-11','Process flow diagram received',
 'Drawing VER_PFD_PFS_001 Rev A — the first document describing the plant as Verdex actually runs it.',
 'Ruhan''s email of 11 August 2026','done',100,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-14','Site visit',
 'Full walk-through of the process, from the incoming material through the shredding lines to the press and the finishing end. Several questions that had been open for weeks closed on the day.',
 'the site visit of 14 August 2026','done',110,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646','2026-08-15','Drafting the Section 24G application',
 'The application is being built on the Department''s current form, S24GAF/04/2018. Most of the property, company and process information is in. What is still needed from you is on the "What we need" tab.',
 null,'now',120,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646',null,'Specialist assessments',
 'Four are needed before the application can be lodged: fire risk, air quality and emission control design, a contaminated land baseline, and occupational hygiene. We will put quotations to you before anything is appointed.',
 null,'expected',130,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646',null,'Landowner consent',
 'Because Verdex leases rather than owns, the Department requires the registered owner''s written consent as an appendix. We will send you the wording and agree how best to approach Everly.',
 null,'expected',140,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646',null,'Practitioner review and approval',
 'The EAP reviews and approves the application, and gives his own recommendation, before anything is lodged.',
 null,'expected',150,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646',null,'Public participation',
 'Notice to interested and affected parties, and to every organ of state with jurisdiction, with a comment period.',
 null,'expected',160,'client_safe',null),

('6db92884-44b6-43e3-8518-218fb4260646',null,'Application lodged',
 'Lodgement follows your instruction. We will not lodge until the plant can demonstrate what a licence requires and you have decided how you want to proceed.',
 null,'expected',170,'client_safe',null),

-- Withheld: belongs on the clock, but not before the letter has gone.
('6db92884-44b6-43e3-8518-218fb4260646',null,'Authority directive and administrative fine',
 'The steps that follow lodgement on a rectification.',
 null,'expected',180,'withheld',
 'Withheld until draft 18 has gone. The client has been told a fine is likely, but not what lodgement triggers. This is the same judgement as the three hidden timeline stages — release together with them.');
