-- ---------------------------------------------------------------------------
-- Dilex Inland WML — bring the portal record back onto the repository record.
--
-- Written 15 August 2026. The project row had not been touched since
-- 1 August 2026 11:50, which is before the scope decision, the deeds search,
-- the deadline recomputation under Reg 3, the consent-use route decision and
-- the EAP's direction of 6 August. Two of the stale statements were on the
-- CLIENT's side of the wall, and the client user (hamish@mcandt.co.za) last
-- signed in on 5 August 2026.
--
-- AGENTS.md §6A: the repository is the source, the portal renders it. When the
-- portal disagrees with `00 - FACTS.md`, the portal is wrong. Fixed here, not
-- there.
--
-- Source for every value below:
--   Elandsfontein EIA Dialex\Dilex Inland WML\00 - FACTS.md  §5, §6, §7, §10
--   Elandsfontein EIA Dialex\Dilex Inland WML\00 - PROJECT TIMELINE.md  §2
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. THE CLIENT-FACING SUMMARY — two errors
--
--    (a) "accepted ... on 17 July 2026". The letter is signed M. Phaladi and
--        dated 16/07/2026 in manuscript, read against the paper on 2 August
--        2026. 17 July is the date of RECEIPT under Reg 4(1), not acceptance.
--
--    (b) "due ... by the end of October 2026". FACTS §5 states in terms:
--        "~30 October is wrong and must not be used." 106 days from 17 July
--        is 30 October; Reg 3(5) adds the two public holidays falling inside
--        the period (10 Aug Women's Day observed, 24 Sep Heritage Day) giving
--        1 November; 1 November 2026 is a Sunday, so Reg 3(1) rolls it to
--        Monday 2 November 2026.
-- ===========================================================================

update public.projects set
  client_summary =
    'DFFE accepted the Final Scoping Report on 16 July 2026, with seven conditions to be '
    'addressed in the next phase. The project is now in the environmental impact reporting '
    'phase: the draft EIAR and EMPr are being prepared and the specialist studies completed, '
    'ahead of a 30-day public participation round. The final EIAR is due to DFFE by '
    'Monday 2 November 2026.',

  -- Internal side. Not exposed by portal_projects, so this is the staff answer.
  due_date = '2026-11-02',

  current_step =
    'Draft EIAR and EMPr preparation, and the specialist route, which is gated on the Site '
    'Sensitivity Verification',

  next_action =
    'Capture the SSV A5 inspection record from Lucas for the 23 April 2026 site visit — the '
    'single blocking item on the whole specialist programme. In parallel, and needing nobody '
    'outside Silverline: start the section 33(1) organ-of-state notices (60-day minimum, not '
    'started, the longest lead item on the file), and send the Baloyi corrections letter (ten '
    'items, drafted 26 July 2026, unsent).',

  risk_reason =
    'The 106-day EIAR submission window closes Monday 2 November 2026 — Reg 23(1) read with '
    'Reg 3(1) and 3(5). That is OUR arithmetic; DFFE has stated no date, and asking it to '
    'confirm arithmetic we can both do was deliberately dropped from the corrections letter on '
    '10 August 2026. The window must contain the 30-day public participation round with the '
    'draft EIAR going to the Department inside it (condition 6), so the working gate is '
    'mid-September, not November. The Reg 23(1)(b) 156-day route (≈11 January 2027) exists and '
    'has an arguable basis; decide by mid-September. Acceptance condition 3 reads "the site '
    'cannot be used for waste management activities prior to the rezoning of the site"; the '
    'route decided on 2 August 2026 is special consent use under section 58 of the COEMM SPLUM '
    'By-law 2019, on the EAP''s direction of 6 August 2026 that zoning is the municipality''s '
    'competence and DFFE need not be asked. The gap between the condition''s wording and our '
    'instrument is a recorded residual risk, not a resolved point. The consent application is '
    'blocked on a Special Power of Attorney from a director of Spring Romance Properties 38 '
    '(Pty) Ltd, the registered owner.'
where id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5';

-- ===========================================================================
-- 2. THE DEADLINE ROW
--
-- The note asked to "confirm the period with the case officer". That item was
-- removed from the corrections letter on 10 August 2026 on Juandre's
-- direction: we compute the date from the regulations, the Department can
-- compute it too, and asking an authority to confirm arithmetic signals an
-- uncertainty we do not have. The date is used as settled.
-- ===========================================================================

update public.project_deadlines set
  due_date = '2026-11-02',
  notes =
    '106 days from acceptance under Reg 23(1), GN R982. Acceptance letter signed 16 July 2026, '
    'received 17 July 2026. 106 days from 17 July = 30 October; Reg 3(5) extends by the two '
    'public holidays inside the period (10 August, Women''s Day observed; 24 September, '
    'Heritage Day) = 1 November; 1 November 2026 is a Sunday, so Reg 3(1) rolls it to Monday '
    '2 November 2026. OUR arithmetic — the acceptance letter states no date. Do not use '
    '30 October; see 00 - FACTS.md §5.'
where project_id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5'
  and name = 'Final EIR / EMPr due';

-- ---------------------------------------------------------------------------
-- The three rows downstream of it were all triggered off 30 October. Move the
-- trigger, but do NOT silently recompute their own due dates: FACTS §5 carries
-- the decision only as "≈ mid-Feb 2027" and has never shown the Reg 3 working
-- for it. Inventing a precise date here would put a number on the record that
-- no primary source supports — which is the failure this whole exercise is
-- about. Flagged instead, and left for the timeline to settle.
-- ---------------------------------------------------------------------------

update public.project_deadlines set
  trigger_date = '2026-11-02',
  notes = coalesce(notes || ' ', '') ||
    'UNVERIFIED DERIVED DATE. Trigger moved to 2 November 2026 with the EIR deadline, but this '
    'row''s own due date has never been computed under Reg 3 (public holidays; the 15 December '
    '– 5 January exclusion in Reg 3(2)). 00 - FACTS.md §5 carries the Reg 24(1) decision only '
    'as "≈ mid-Feb 2027". Do not quote this date to anyone until it is worked and recorded on '
    'the FACTS card.'
where project_id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5'
  and name = 'Authority final decision after EIR';

update public.project_deadlines set
  notes = coalesce(notes || ' ', '') ||
    'UNVERIFIED DERIVED DATE — cascades off the decision date above, which has not been '
    'computed under Reg 3. Not to be quoted.'
where project_id = 'e8e6c132-5b0b-451f-8912-043af66d1ec5'
  and name in ('Decision notification', 'Appeal window');
