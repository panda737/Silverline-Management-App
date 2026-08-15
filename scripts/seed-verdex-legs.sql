-- Verdex: create Leg 2 (s22A + AEL) and Leg 3 (Norms & Standards).
-- Every fact carries a sensitivity and a reason. Default is internal_only.
-- Nothing naming a fine or a cessation direction is client_safe until the
-- Dewald letter has been issued.

do $$
declare
  v_client uuid;
  v_manager uuid;
  v_ael uuid;
  v_ns uuid;
begin
  select client_id, manager_id into v_client, v_manager
    from public.projects where id = '6db92884-44b6-43e3-8518-218fb4260646';

  -- ---------------------------------------------------------------- LEG 2 ---
  insert into public.projects
    (name, client_id, project_type, status, priority, manager_id, applicant,
     route, client_summary, description, current_legal_stage, current_step,
     next_action, risk_level, risk_reason, progress)
  values (
    'Verdex — Section 22A & Atmospheric Emission Licence',
    v_client, 'atmospheric_emission_licence', 'not_started', 'high', v_manager,
    'Verdex (Pty) Ltd — 2024/312113/07',
    null,  -- the route enum is waste-side only (category_a/b/c, section_24g); the air leg has no member and inventing one would be worse than null

    'The air-side application. The compression-moulding press applies heat to waste, which is a listed activity under the Air Quality Act, and it is licensed by the City of Tshwane rather than by the provincial department. This is a separate application from the Section 24G, to a different authority, on its own timetable.',
    'Air-side rectification under NEM:AQA s22A leading to an Atmospheric Emission Licence. Listed activity GN 893 Category 8 Subcategory 8.1 (treatment of waste by application of heat, all installations treating 10 kg/day). Licensing authority is the City of Tshwane metro, not GDARD. Technically unready until the discharge/release point is established.',
    'Scoped, not commenced',
    'Awaiting the gas installation particulars and the discharge/release point before the application can be built',
    'Establish where the press discharges. Subcategory 8.1 carries the full waste-incineration emission suite including dioxins and furans at 0,1 ng I-TEQ/Nm3, and compliance is demonstrated by measurement, not assertion — which cannot be done until there is a defined release point. If the press discharges inside the building this is a plant modification before it is a licensing problem. In parallel: confirm the 2019 consolidation of GN 893 against the Gazette, and settle with Juandre and Luaan whether the R240 000 mandate contemplated a stack test and an Atmospheric Impact Report.',
    'high',
    'Section 22A(3)(a) requires the authority to direct immediate cessation pending a decision, and no statutory period governs that decision. Rent is R420 000 a month. The GN 332 minimum fine rises by R200 000 on each completed 12-month cycle of unlicensed operation, the first of which falls on 13 March 2027.',
    0
  ) returning id into v_ael;

  insert into public.project_timeline_items (project_id, stage_name, status, client_visible, sort_order, description) values
    (v_ael, 'Air-side activity identified',        'completed',   true, 1, 'GN 893 Category 8, Subcategory 8.1 — treatment of waste by the application of heat.'),
    (v_ael, 'Licensing authority confirmed',       'completed',   true, 2, 'The City of Tshwane, as the metropolitan municipality, and not the provincial department.'),
    (v_ael, 'Discharge point established',         'in_progress', true, 3, 'Where the press discharges, and whether there is a defined release point.'),
    (v_ael, 'Emission measurement scoped',         'pending',     true, 4, 'What must be measured, by whom, and over what period.'),
    (v_ael, 'Atmospheric Impact Report',           'pending',     true, 5, null),
    (v_ael, 'Application prepared',                'pending',     true, 6, null),
    (v_ael, 'Application submitted',               'pending',     true, 7, null),
    (v_ael, 'Authority response',                  'pending',     true, 8, null),
    (v_ael, 'Decision on the licence',             'pending',     true, 9, null),
    -- withheld pending the Dewald letter
    (v_ael, 'Administrative fine determined',      'pending',    false, 10, 'WITHHELD: names a fine. Release when the Dewald letter has been issued.'),
    (v_ael, 'Fine paid',                           'pending',    false, 11, 'WITHHELD: names a fine.'),
    (v_ael, 'Cessation direction considered',      'pending',    false, 12, 'WITHHELD: s22A(3)(a). The client must hear this in a letter, not as a portal row.');

  insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
    (v_ael, 'team',      'Environmental Assessment Practitioner', 'Mpanyana Lucas Mahlangu — EAPASA registration 2021/4461', 'our record', 1, false, 'client_safe', 'The EAP of record. His own information.'),
    (v_ael, 'team',      'Project manager', 'Luaan Rentzke, Silverline (Pty) Ltd', 'our record', 2, false, 'client_safe', 'Who to contact.'),
    (v_ael, 'operation', 'Licensing authority', 'City of Tshwane Metropolitan Municipality', 'NEM:AQA — the metro is the licensing authority', 1, true, 'client_safe', 'He needs to know this is a different authority from the Section 24G. The Dewald letter says the same.'),
    (v_ael, 'operation', 'Listed activity', 'GN 893, Category 8, Subcategory 8.1 — facilities where general and hazardous waste are treated by the application of heat', 'the gazette, read 5 August 2026', 2, true, 'client_safe', 'The activity, from the primary source. Plain fact about his own operation.'),
    (v_ael, 'operation', 'Threshold', 'All installations treating 10 kg per day', 'GN 893 as consolidated to the 2019 amendment', 3, true, 'client_safe', 'Factual. Note: per day, not per hour.'),
    (v_ael, 'operation', 'First hot press operation', '13 March 2026', 'answered by Ruhan, 7 August 2026', 4, true, 'client_safe', 'His own date, given to us by his own engineer.'),
    (v_ael, 'outstanding', 'Where the press discharges', 'We need to know whether the press vents to a stack, to a duct, or into the building — and if there is a stack, where it is and what its dimensions are.', null, 1, false, 'client_safe', 'We are asking him for it. Question 9 of the Ruhan form.'),
    (v_ael, 'outstanding', 'The gas installation particulars', 'Vessel count, capacity, data plates, fill limit and separation distances for the LPG installation serving the press.', null, 2, false, 'client_safe', 'Requested from Ruhan.'),
    (v_ael, 'outstanding', 'The fire clearance certificate, in full', 'We hold it but have not read it in full, and we need to know whether the gas installation was separately approved.', null, 3, false, 'client_safe', 'His own document.'),
    -- internal / withheld
    (v_ael, 'operation', 'Administrative fine — minimum', 'GN 332, GG 39833: minimum R200 000, plus R200 000 for each completed 12-month cycle of unlicensed operation, maximum R10 million, plus R1 million if in a declared Priority Area.', 'GN 332 of 18 March 2016', 20, false, 'withheld', 'WITHHELD. A fine reaches a client in a considered letter, never as a line item. Release condition: the Dewald letter has been issued and Lucas has approved it.'),
    (v_ael, 'operation', 'First completed 12-month cycle', '13 March 2027, running from the first evidenced hot press operation on 13 March 2026.', 'GN 332 read against the 13 March 2026 date', 21, false, 'withheld', 'WITHHELD. Meaningless to the client without the fine it attaches to, and discloses it by implication. Same release condition.'),
    (v_ael, 'operation', 'Cessation risk', 'Section 22A(3)(a) says the licensing authority MUST direct the applicant to immediately cease the activity pending a decision, and no statutory period governs that decision.', 'NEM:AQA s22A, read off the Act 7 August 2026', 22, false, 'withheld', 'WITHHELD. The client must hear this in a letter and be able to ask questions, not read it on a screen while planning 24-hour operation. Same release condition.'),
    (v_ael, 'operation', 'Commercial exposure of a cessation direction', 'Rent is R420 000 a month. This is the governing commercial fact of the engagement.', 'the lease', 23, false, 'internal_only', 'Our assessment of his exposure, not his information.'),
    (v_ael, 'operation', 'Emission standards exposure', 'Subcategory 8.1 carries the full waste-incineration suite including dioxins and furans at 0,1 ng I-TEQ/Nm3. Few SA laboratories are accredited for dioxin sampling. Abatement may be required.', 'GN 893', 24, false, 'internal_only', 'Cost and strategy. Goes to the client once scoped and priced, with a fee position — not before.');

  insert into public.project_clock_events (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note) values
    (v_ael, '2026-03-13', 'First hot press operation', 'The first evidenced operation of the compression-moulding press.', 'answered by Ruhan, 7 August 2026', 'done', 1, 'client_safe', 'His own date.'),
    (v_ael, '2026-08-05', 'Air-side listed activity identified', 'Category 8, Subcategory 8.1 read off the gazette.', 'our record', 'done', 2, 'client_safe', 'What we did, and when.'),
    (v_ael, '2026-08-07', 'Rectification route settled', 'Section 22A of the Air Quality Act, read off the Act.', 'our record', 'done', 3, 'client_safe', 'What we did, and when.'),
    (v_ael, null, 'Discharge point established', 'Waiting on the site information.', null, 'now', 4, 'client_safe', 'Where we are.'),
    (v_ael, null, 'Emission measurement', 'Scope, appoint and complete the testing.', null, 'expected', 5, 'client_safe', 'What comes next.'),
    (v_ael, null, 'Application submitted to the City of Tshwane', null, null, 'expected', 6, 'client_safe', 'What comes next.'),
    (v_ael, '2027-03-13', 'First completed 12-month cycle', 'The point at which the GN 332 minimum fine increases.', 'GN 332', 'expected', 7, 'withheld', 'WITHHELD: discloses the fine. Release when the Dewald letter has been issued.');

  -- ---------------------------------------------------------------- LEG 3 ---
  insert into public.projects
    (name, client_id, project_type, status, priority, manager_id, applicant,
     route, client_summary, description, current_legal_stage, current_step,
     next_action, risk_level, risk_reason, progress)
  values (
    'Verdex — Norms & Standards Registration',
    v_client, 'norms_and_standards', 'not_started', 'medium', v_manager,
    'Verdex (Pty) Ltd — 2024/312113/07',
    'category_c',
    'The storage and shredding parts of the operation. These are not licensed — they are registered, and run against published national standards. Because they are Category C, they are not part of the Section 24G, and no fine attaches to them.',
    'Category C activities: C(1) storage of general waste over 100 m3 (Norms and Standards for the Storage of Waste, GN R926 GG 37088) and C(6) sorting/shredding over 1 000 m2 operational area (GN 1094, GG 41175). Registration and compliance, not a licence. This leg is what keeps storage and baling out of the s24G — the first bale of 5 August 2025 is not a waste-side commencement date.',
    'Scoped, not commenced',
    'Storage volume in cubic metres still required to confirm whether C(1) is triggered at all',
    'Obtain the storage capacity in cubic metres. The density figure now makes this calculable from the 300-500 t figure, but it has not been calculated. Then read GN R926 and GN 1094 in their current consolidated form and establish with whom the registration is lodged — that has NOT been established and must not be asserted until it is read off the norms themselves.',
    'low',
    'No fine attaches to Category C. The risk here is not enforcement but mischaracterisation: if storage or shredding were wrongly pulled into the s24G, the waste-side commencement date would move back to the first bale on 5 August 2025.',
    0
  ) returning id into v_ns;

  insert into public.project_timeline_items (project_id, stage_name, status, client_visible, sort_order, description) values
    (v_ns, 'Category C activities identified', 'completed',   true, 1, 'C(1) storage and C(6) shredding, read off GN 921.'),
    (v_ns, 'Storage volume established',       'in_progress', true, 2, 'Whether the 100 m3 threshold in C(1) is reached at all.'),
    (v_ns, 'Norms read in current form',       'pending',     true, 3, 'GN R926 and GN 1094, checked against the amendment trail.'),
    (v_ns, 'Registration authority confirmed', 'pending',     true, 4, 'With whom the registration is lodged.'),
    (v_ns, 'Compliance gap assessment',        'pending',     true, 5, 'What the site already meets, and what it does not.'),
    (v_ns, 'Registration submitted',           'pending',     true, 6, null),
    (v_ns, 'Registration confirmed',           'pending',     true, 7, null);

  insert into public.project_facts (project_id, section, label, value, source_note, sort_order, confirmable, sensitivity, sensitivity_note) values
    (v_ns, 'team',      'Environmental Assessment Practitioner', 'Mpanyana Lucas Mahlangu — EAPASA registration 2021/4461', 'our record', 1, false, 'client_safe', 'The EAP of record.'),
    (v_ns, 'team',      'Project manager', 'Luaan Rentzke, Silverline (Pty) Ltd', 'our record', 2, false, 'client_safe', 'Who to contact.'),
    (v_ns, 'operation', 'What this is', 'Registration and compliance with published national norms — not a licence, and not part of the Section 24G.', 'GN 921, Category C', 1, true, 'client_safe', 'Genuinely good news and plainly his own information. Worth him understanding.'),
    (v_ns, 'operation', 'Storage — C(1)', 'Storage of general waste at a facility with capacity to store in excess of 100 cubic metres at any one time. Governed by the Norms and Standards for the Storage of Waste, GN R926 in GG 37088.', 'GN 921 read off the gazette, 8 August 2026', 2, true, 'client_safe', 'The activity and its instrument, from the primary source.'),
    (v_ns, 'operation', 'Shredding — C(6)', 'Sorting, shredding, grinding, crushing, screening or baling of general waste at a facility with an operational area of 1 000 square metres or more. Governed by GN 1094 in GG 41175.', 'GN 921 read off the gazette, 8 August 2026', 3, true, 'client_safe', 'As above.'),
    (v_ns, 'operation', 'Registration authority', 'Not yet established. We will not name it until it has been read off the norms themselves.', null, 4, false, 'client_safe', 'A declared gap is professional. Saying so is better than guessing.'),
    (v_ns, 'outstanding', 'Storage capacity in cubic metres', 'We hold the tonnage — 300 to 500 tonnes across the indoor and outdoor areas — but the threshold in C(1) is expressed in cubic metres. We need the volume, or the dimensions of the storage areas and stack heights.', null, 1, false, 'client_safe', 'We are asking him for it.'),
    (v_ns, 'operation', 'Why this leg matters to the s24G', 'Category C activities are not unlawful commencement, so storage and baling are not what triggered the Section 24G. The first bale of 5 August 2025 is therefore not the waste-side commencement date. Shredding on its own is not the licensable act — the heat is.', 'GN 921 Category A vs Category C', 20, false, 'internal_only', 'Our legal argument on the commencement date. It is strategy, and it touches the fine on the other leg. Goes to him in the letter, not here.');

  insert into public.project_clock_events (project_id, event_date, label, detail, source_note, kind, sort_order, sensitivity, sensitivity_note) values
    (v_ns, '2026-08-08', 'Category C activities identified', 'C(1) and C(6) read off GN 921 as amended to GN 1757.', 'our record', 'done', 1, 'client_safe', 'What we did, and when.'),
    (v_ns, null, 'Storage volume established', 'Waiting on the storage capacity in cubic metres.', null, 'now', 2, 'client_safe', 'Where we are.'),
    (v_ns, null, 'Norms read in their current consolidated form', null, null, 'expected', 3, 'client_safe', 'What comes next.'),
    (v_ns, null, 'Registration submitted', null, null, 'expected', 4, 'client_safe', 'What comes next.');

  raise notice 'LEG2=% LEG3=%', v_ael, v_ns;
end $$;

select id, name, project_type, status, priority
  from public.projects
 where client_id = (select client_id from public.projects where id='6db92884-44b6-43e3-8518-218fb4260646')
 order by name;
