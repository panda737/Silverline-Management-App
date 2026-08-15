-- ---------------------------------------------------------------------------
-- Verdex — Section 24G Mission Control, client-facing facts.
--
-- Every row carries a sensitivity and, where it is not client_safe, a reason.
-- The reason matters more than the flag: a future reader must see the judgement,
-- not just its result.
--
-- The test applied to each row: is this the applicant's own information, put
-- back to him so he can check it? If instead it is our analysis, our exposure,
-- or a finding about him rather than for him, it does not cross.
-- ---------------------------------------------------------------------------

delete from public.project_facts
where project_id = '6db92884-44b6-43e3-8518-218fb4260646';

insert into public.project_facts
  (project_id, section, label, value, source_note, sort_order, sensitivity, sensitivity_note, confirmable)
values

-- ===== OPERATION — client_safe ============================================
-- The applicant's own plant, materials and numbers. All of it goes into the
-- application, so all of it has to be right.

('6db92884-44b6-43e3-8518-218fb4260646','operation','Applicant',
 'Verdex (Pty) Ltd, registration 2024/312113/07',
 'the CIPC certificate you sent us on 30 July 2026', 10,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Property',
 'Erf 74, Waltloo — 325 Mundt Street, Pretoria. Extent 12 243 m²',
 'the Deeds Office record', 20,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Materials accepted',
 'MLP, PP, HDPE, LDPE, woven PP and BOPP',
 'your technical answers of 30 July 2026', 30,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Materials not accepted',
 'PVC and other chlorinated plastics. Flame-retardant plastics are not intentionally accepted',
 'your technical answers of 30 July 2026', 40,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Input streams',
 'Two — soft plastics and ruffia — kept separate through shredding and blended at the loading silos',
 'your process flow diagram VER_PFD_PFS_001, 11 August 2026', 50,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Shredders',
 'Twelve, in three parallel trains of two primary and two secondary each',
 'your process flow diagram VER_PFD_PFS_001', 60,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Silos',
 'Eight buffer silos and six loading silos',
 'your process flow diagram VER_PFD_PFS_001', 70,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','How the press is heated',
 'LPG. There is no boiler on site',
 'the site visit of 14 August 2026', 80,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Extraction over the press',
 'None fitted at present. We understand you are looking at installing it, together with dust extraction on the shredders',
 'the site visit of 14 August 2026', 90,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Design capacity',
 'Approximately 30 tonnes per day',
 'your technical answers of 30 July 2026', 100,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Press maximum',
 'Approximately 2 tonnes per hour',
 'your technical answers of 30 July 2026', 110,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Actual throughput',
 '10 to 15 tonnes per week',
 'your technical answers of 30 July 2026', 120,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Maximum material on site',
 'Approximately 300 to 500 tonnes across both storage areas',
 'your technical answers, and what the team saw on 14 August 2026', 130,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Where material is stored',
 'Incoming material outside at the rear, on the concrete apron, uncovered. Shredded material inside, in the silos and in bulk bags',
 'the site visit of 14 August 2026', 140,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Operating hours',
 '06:00 to 22:00 on weekdays and 06:00 to 15:00 on Saturdays, with the press running roughly 45 minutes in each hour',
 'your answers of 7 August 2026', 150,
 'client_safe',
 'Client-safe, and we already doubt it — the site visit suggested there is no fixed shift pattern. Putting it up for confirmation is the cleanest way to settle it.',
 true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Cooling plant',
 'A cooling tower, plate heat exchanger, circulating pump and water tank, in the roofed area alongside the building',
 'the site visit of 14 August 2026', 160,
 'client_safe', null, true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Weighbridge',
 'We have not been able to establish whether there is a weighbridge in use. The 2003 building plans show one on the property',
 'approved building plan 1655/03, and the site visit of 14 August 2026', 170,
 'client_safe',
 'A genuine open question and the client is the only one who can settle it. Every tonnage in the application depends on the answer.',
 true),

-- ===== WHAT WE NEED — client_safe =========================================

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Equipment list',
 'One line per machine: make, model, rated throughput, installed motor power, and the dates it was installed and first ran',
 null, 10, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','A site layout',
 'A plan showing where each machine sits, where material is stored inside and outside, the LPG installation and the cooling plant. A marked-up copy of the architectural plan is fine',
 null, 20, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Gas installation particulars',
 'Vessel count and capacity, photographs of the data plates, the fill limit, separation distances, and the installation certificate',
 null, 30, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Storage volumes',
 'Approximate area and volume for each storage area, split between pre-shred and post-shred',
 null, 40, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Main suppliers',
 'The main sources of incoming material, by company name. The handful that make up the bulk is enough',
 null, 50, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','What happens to the fines',
 'Your process returns trimmings, rejects and screenings to the front of the line. Fines collection is the one stream that leaves — what is it, how much a month, and where does it go?',
 null, 60, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','What ruffia is',
 'The polymer, and where it comes from — and whether the two streams are separated on arrival or on the floor',
 null, 70, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','The cooling circuit',
 'Where the water comes from and roughly how much you use, where the tower blowdown goes, what is dosed into it with the safety data sheets, and when it was installed',
 null, 80, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Shredder installation records',
 'Delivery notes, invoices or commissioning records for the original installation of the twelve shredders',
 null, 90, 'client_safe', null, false),

('6db92884-44b6-43e3-8518-218fb4260646','outstanding','Incident history',
 'Written confirmation of any environmental incident at the site, or that there has been none',
 null, 100, 'client_safe', null, false),

-- ===== DOCUMENTS HELD — client_safe =======================================

('6db92884-44b6-43e3-8518-218fb4260646','evidence','Lease', 'Received', 'you, 30 July 2026', 10, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','CIPC registration certificate', 'Received', 'you, 30 July 2026', 20, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','Zoning certificate', 'Received', 'you, 30 July 2026', 30, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','Approved building plans 1655/03', 'Received — four sheets', 'Ruhan, 3 August 2026', 40, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','Feedstock ledger', 'Received — 38 deliveries to 13 July 2026', 'you, 13 July 2026', 50, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','Process flow diagram VER_PFD_PFS_001', 'Received', 'Ruhan, 11 August 2026', 60, 'client_safe', null, false),
('6db92884-44b6-43e3-8518-218fb4260646','evidence','Signed quotation, invoice and proof of payment', 'Received — Phase 1 settled 27 July 2026', 'you', 70, 'client_safe', null, false),

-- ===== WITHHELD — client-safe in principle, held back for now ==============

('6db92884-44b6-43e3-8518-218fb4260646','commencement','Commencement dates',
 'The dates on which each activity began',
 'your answers of 7 August 2026 and the feedstock ledger', 10,
 'withheld',
 'WITHHELD ON JUANDRE''S INSTRUCTION, 15 August 2026. These dates drive the fine. The applicant should not be asked to confirm them until the cessation-and-fine position has been put to him properly in writing — that letter is draft 18 and is with Waldo and Lucas. Release once it has gone.',
 true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Building coverage',
 'The property stands at 59,97% coverage against a permitted 60%',
 'approved building plan 1655/03', 900,
 'withheld',
 'Withheld until draft 18 has gone. The letter explains this in context and withdraws the roofing help we offered on site. Arriving here first, with no explanation, would be worse than useless.',
 true),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Previous use of the site',
 'The property was previously occupied by a hot-dip galvanising works',
 'approved building plan 1655/03, titled for Galvadip (Pty) Ltd', 910,
 'withheld',
 'Withheld until draft 18 has gone. The letter frames why the baseline protects the applicant rather than exposing him. Unframed, it reads as an accusation.',
 true),

-- ===== INTERNAL ONLY — never crosses ======================================

('6db92884-44b6-43e3-8518-218fb4260646','operation','Listed activities cited',
 'A(3), A(5), A(6) and A(12). A(13) not cited',
 'GN 921 as amended', 950,
 'internal_only',
 'Our legal analysis, not the applicant''s information. Which activities we cite is a judgement we make and defend; it is not a fact for him to confirm, and putting it up for confirmation would invite him to argue it.',
 false),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Waste classification reasoning',
 'General waste. Classification is determined at the generator, not the user',
 'Waldo 8 August, refined by Lucas 10 August 2026', 960,
 'internal_only',
 'Our position and our reasoning. The conclusion is explained to the client in the letter, in his own terms. The reasoning behind it stays ours.',
 false),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Cessation risk on lodgement',
 'Both rectification routes oblige the authority to direct that the activity cease',
 'NEMA s24G(1)(aa)(A) and NEM:AQA s22A(3)(a)', 970,
 'internal_only',
 'NEVER a portal row. This is the single most consequential thing the client has to be told, and it is being told to him in a letter that has been drafted, reviewed and sequenced. It must not reach him as a line item.',
 false),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Fine exposure',
 'Discretionary under GN R698, capped by NEMA s24G(4)',
 'GN R698 and NEMLAA 2 of 2022', 980,
 'internal_only',
 'NEVER a portal row. What the client is told about the fine is a considered communication with Waldo''s wording, not something he finds on a screen.',
 false),

('6db92884-44b6-43e3-8518-218fb4260646','operation','Accuracy of earlier client answers',
 'The extraction answer of 22 July 2026 was not correct',
 'the site visit of 14 August 2026', 990,
 'internal_only',
 'NEVER crosses. True, necessary for our own file, and not something to publish back to the person who said it. The corrected position is what appears on the client side, without the comparison.',
 false);
