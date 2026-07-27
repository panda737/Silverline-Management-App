/**
 * ClinX — Section 31L Enforcement Mission Control.
 *
 * Built 27 July 2026 from the primary record: the DFFE correspondence in the
 * admin@slco.co.za and juandrepeter@gmail.com mailboxes, the scanned s31L notice
 * (`PCN Clinx 2025.pdf`), the 30 June information request (`EDMS 274535`), both
 * versions of the 22 May external audit, and the 30 June action plan workbook.
 *
 * Unlike the Dilex file this is not a licensing application — it is a live
 * enforcement matter against an already-issued licence, so the shape is
 * different: a notice, representations, an action plan, a standing monthly
 * reporting obligation, and an audit whose findings the Department is now
 * asking us to put dates against.
 *
 * Static fixture. Every figure below is traceable to a document or an email;
 * nothing is inferred without being labelled as such.
 */

export const CLINX_AS_AT = "2026-07-27";

export const PROJECT = {
  client: "ClinX Medical Waste Management",
  facility: "ClinX Waste Management Facility, Wadeville",
  address: "330 Dame Street, Wadeville Extension 3, Germiston, Gauteng",
  licence: "12/9/11/L211109153440/3/R",
  licenceDated: "2022-07-04",
  licenceScope: "Health Care Risk Waste Storage and Treatment Facility",
  plant: "2 incinerators + 1 steam autoclave (Celitron MWC-1000X6)",
  autoclaveDaily: "20 tons/day",
  autoclaveHourly: "850 kg/hour",
  authority: "DFFE — Enforcement: Environmental Impact and Pollution",
  routeLabel: "Section 31L — Reactive Enforcement",
  refs: ["EDMS 268095 (Action Plan)", "EDMS 274535 (30 June request)"],
} as const;

/** Who is actually on this file, and in what capacity. */
export const PARTIES = [
  { name: "Franz Scheepers", org: "DFFE", role: "Environmental Control Officer & Grade 2 EMI, Reactive Enforcement — ran the file from Dec 2025", email: "FSCHEEPERS@dffe.gov.za" },
  { name: "Grant Walters", org: "DFFE", role: "Director: Enforcement — Environmental Impact and Pollution, Grade 1 EMI. Signed the 30 June request", email: "GWALTERS@dffe.gov.za" },
  { name: "Ernest Botha", org: "ClinX", role: "Addressee of the notice and the information request", email: "ernest@clinx.co.za" },
  { name: "Willie Welman", org: "ClinX", role: "General Manager", email: "operations@clinx.co.za" },
  { name: "Adele Kriel", org: "ClinX", role: "Manager — supplies the monthly evidence", email: "adele@clinx.co.za" },
  { name: "Lucas Mahlangu", org: "Inyathi Consulting", role: "Director. Named as submitter on the 30 June action plan", email: "info@inyathiconsult.co.za" },
  { name: "Waldo Jansen van Rensburg", org: "Green Law / Enviroreg", role: "Drafts the responses. Operates from three addresses", email: "waldo@greenlawconsult.co.za" },
  { name: "Luaan Rentzke", org: "Silverline", role: "External auditor — signed the 22 May compliance audit", email: "luaan@slco.co.za" },
] as const;

export type ClockKind = "notice" | "submitted" | "ack" | "due" | "open";

export type ClockEvent = {
  date: string;
  kind: ClockKind;
  label: string;
  detail: string;
};

/** The enforcement chain, verified against the emails and the notice itself. */
export const TIMELINE: ClockEvent[] = [
  {
    date: "2025-09-30",
    kind: "open",
    label: "An earlier s31L action plan report exists",
    detail:
      "`S31L Action Plan Report 30 September 2025.docx` sits on disk and predates the December notice by two months. Unexplained — it may indicate an earlier enforcement round that nobody has reconciled with this one.",
  },
  {
    date: "2025-12-04",
    kind: "notice",
    label: "Notice of Intention to issue a Compliance Notice (s31L NEMA)",
    detail:
      "Non-compliances with the conditions of the issued WML. Emailed by Franz Scheepers on 5 December to Ernest Botha and Operations, cc Grant Walters, with the PCN and the licence attached. DFFE asked for the notice to be acknowledged by signing page 11.",
  },
  {
    date: "2025-12-17",
    kind: "submitted",
    label: "Response to the Notice of Intention submitted",
    detail:
      "Sent from admin@slco.co.za to Scheepers. Accepts that compliance and housekeeping must improve, gives context on waste quality and pharmaceutical waste routed to EnviroServ, and sets out immediate corrective and longer-term preventative measures. Addressed to \"Ms Craige\" — see the findings.",
  },
  {
    date: "2026-01-07",
    kind: "notice",
    label: "Further information request; acknowledgement signed and returned",
    detail:
      "Scheepers issued a further request and asked for acknowledgement by signing page 4. Willie Welman returned it the same day; Scheepers confirmed receipt on 8 January.",
  },
  {
    date: "2026-01-20",
    kind: "submitted",
    label: "Action Plan (Measures and Timeframes) submitted — EDMS 268095",
    detail:
      "Commits to monthly progress reports supported by verifiable evidence, first report 01 March 2026, and thereafter until full compliance is achieved. This is the obligation that still governs the file.",
  },
  {
    date: "2026-02-28",
    kind: "submitted",
    label: "February monthly progress report",
    detail: "Submitted two days ahead of the committed 01 March start.",
  },
  { date: "2026-03-31", kind: "submitted", label: "March monthly progress report", detail: "Submitted on time." },
  {
    date: "2026-05-01",
    kind: "ack",
    label: "April monthly progress report — receipt acknowledged",
    detail: "Scheepers replied the same day: \"Thank you, the report has been received.\"",
  },
  { date: "2026-06-01", kind: "submitted", label: "May monthly progress report", detail: "Submitted on time." },
  {
    date: "2026-05-08",
    kind: "open",
    label: "Ekurhuleni air-quality meeting confirms the AEL has lapsed",
    detail:
      "Meeting with Arthur Ramoshaba. The licence covers two incinerators, which cannot lawfully run without an AEL — so treatment capacity rests entirely on the single 20 t/day autoclave.",
  },
  {
    date: "2026-05-22",
    kind: "submitted",
    label: "External compliance audit against the licence",
    detail:
      "Auditor Luaan Rentzke. 75 requirements assessed, 56 excluded as not applicable. Exists in two versions with different conclusions — see the findings.",
  },
  {
    date: "2026-06-20",
    kind: "submitted",
    label: "Audit submission to DFFE fails on size",
    detail:
      "Sent to licensing@dffe.gov.za, Scheepers, Walters and Ekurhuleni. The pack was too large and did not arrive.",
  },
  {
    date: "2026-06-30",
    kind: "submitted",
    label: "External audit re-sent and delivered",
    detail:
      "\"Please accept our sincere apologies, it seems the file was too large with all the other attachments.\" Delivered the same day Walters signed the information request, which cites it.",
  },
  {
    date: "2026-06-30",
    kind: "notice",
    label: "Information request from the Director — EDMS 274535",
    detail:
      "Signed by Grant Walters, Director: Enforcement, Grade 1 EMI — an escalation from Scheepers, who is a Control Officer. Asks three questions and restates that monthly reports continue until the Department says otherwise.",
  },
  {
    date: "2026-07-03",
    kind: "submitted",
    label: "June monthly progress report",
    detail:
      "With the 30 June action plan workbook and supporting documents attached. Answers the Director's question 2.2 in substance; does not reach 2.1 or 2.3.",
  },
  {
    date: "2026-08-01",
    kind: "due",
    label: "July monthly progress report due",
    detail:
      "On the established rhythm. The natural vehicle for the outstanding answers if they have not gone separately by then.",
  },
];

/** The three questions in the 30 June letter, and where each stands. */
export type QuestionState = "answered" | "open";

export const DIRECTOR_QUESTIONS: {
  ref: string;
  question: string;
  state: QuestionState;
  position: string;
}[] = [
  {
    ref: "2.1",
    question:
      "Whether the External Auditor is of the view that the facility is in full compliance with the specific non-compliances stipulated in Table 1 of the s31L NOI.",
    state: "open",
    position:
      "Nothing on record gives this opinion. It is addressed to Silverline as the external auditor, not to the client — it cannot be answered by forwarding a client document.",
  },
  {
    ref: "2.2",
    question:
      "Your view as to whether the provisions of the Action Plan have been fully met and the non-compliances identified in the NOI have been resolved.",
    state: "answered",
    position:
      "Answered in substance by the 30 June action plan submitted on 3 July: eleven measures, each signed off by the General Manager on 30 June, all recorded as ongoing and maintained.",
  },
  {
    ref: "2.3",
    question:
      "The date by when the 4 identified non-compliances (including 'partial compliances') identified in the External Audit Report will be resolved.",
    state: "open",
    position:
      "No dates have been given. The four audit non-conformances are a different list from the eleven action-plan measures and appear in no submission to date.",
  },
];

/** Non-conformances from the 22 May external audit — the version DFFE holds. */
export type NcrStatus = "partial" | "non_compliant";

export const NCRS: {
  ref: string;
  condition: string;
  requirement: string;
  observation: string;
  status: NcrStatus;
  due: string;
  note: string;
}[] = [
  {
    ref: "NCR-001",
    condition: "2.3.1",
    requirement:
      "A Waste Management Control Officer must be designated in writing to monitor and ensure compliance with the licence and standard operating procedures. Proof of designation must be kept by the Licence Holder.",
    observation: "New WMCO must be appointed. Previous WMCO left the company.",
    status: "partial",
    due: "30 days",
    note:
      "Chased on 25 May and again on 29 May — \"You will still have to appoint a WMCO... The letter must have the details of the WMCO and must be signed.\" Still open at audit date. This is the one that should already have a date against it.",
  },
  {
    ref: "NCR-002",
    condition: "5.1.6",
    requirement:
      "The Licence Holder must prevent spillages on site; where they occur, ensure effective and safe cleaning in accordance with the emergency preparedness plan.",
    observation: "Spills listed in the Emergency Preparedness Plan. Spill kit needed on site.",
    status: "partial",
    due: "—",
    note: "Install and mark a spill kit in each designated work area, and keep them restocked.",
  },
  {
    ref: "NCR-003",
    condition: "6.2.4",
    requirement:
      "Treatment processes must be tested monthly by an independent and competent microbiologist against Geobacillus stearothermophilus spores to confirm the microbial inactivation standard in condition 6.1.1.",
    observation: "Efficacy testing not being repeated at the required monthly frequency.",
    status: "non_compliant",
    due: "—",
    note:
      "This is a recurring obligation, not a one-off fix. A resolution date has to be the date the monthly cycle starts and holds, not a single test.",
  },
  {
    ref: "NCR-004",
    condition: "11.1",
    requirement:
      "The Licence Holder must establish, maintain and ensure the continued functioning of the Monitoring Committee for the operative lifetime of the site.",
    observation: "Monitoring Committee not done for the previous external audit either. No committee functioning.",
    status: "non_compliant",
    due: "—",
    note:
      "A Monitoring Committee invoice went to Bulldog Hauliers on 20 June, so the work is commissioned — that gives a defensible date.",
  },
];

/** The disputed fifth item — present in one version of the audit, not the other. */
export const DISPUTED_NCR = {
  condition: "5.2.13",
  requirement:
    "The Licence Holder must register the storage of waste on Site in terms of the National Norms and Standards for the Storage of Waste, GN 926, dated 29 November 2013.",
  observation: "Norms and Standards can be applied for. Storage is currently in WML.",
  inVersion: "ClinX_Waste_Management_License_ComplianceAudit_2026-05-22 Complete.pdf (17 pages)",
  absentFrom: "ClinX Waste Management License - External Audit_2026-05-22.pdf (15 pages)",
} as const;

/** The monthly reporting obligation and its actual record. */
export const REPORTING = {
  committedFrom: "2026-03-01",
  commitment:
    "Monthly progress reports supported by verifiable evidence, until full compliance is achieved — restated by the Director on 30 June as continuing until the Department advises otherwise.",
  submitted: [
    { sent: "2026-02-28", covers: "February 2026", ack: "" },
    { sent: "2026-03-31", covers: "March 2026", ack: "" },
    { sent: "2026-05-01", covers: "April 2026", ack: "Receipt acknowledged by Scheepers the same day" },
    { sent: "2026-06-01", covers: "May 2026", ack: "" },
    { sent: "2026-07-03", covers: "June 2026", ack: "" },
  ],
  next: "2026-08-01",
} as const;

/** The eleven action-plan measures, all GM-signed 30 June 2026. */
export const ACTION_PLAN = {
  period: "01 May 2026 – 30 June 2026",
  submittedBy: "Lucas Mahlangu / Waldo Jansen van Rensburg — Director, Inyathi Consulting",
  signedOff: "2026-06-30",
  measures: [
    "Accurate weighing and tonnage reporting",
    "72-hour storage control for infectious waste",
    "FIFO enforcement system",
    "Capacity gating and backlog prevention",
    "Housekeeping and storage discipline",
    "Segregation controls at receiving",
    "Non-conforming waste isolation area",
    "Pharmaceutical waste control",
    "Record standardisation and auditability",
    "Internal verification and stabilisation",
    "Monthly reporting pack readiness",
  ],
} as const;

export type ClinxFinding = {
  agent: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  action: string;
  evidence: { source: string; locator: string; quote: string }[];
};

export const FINDINGS: ClinxFinding[] = [
  {
    agent: "doc-completeness",
    severity: "critical",
    title: "The 22 May external audit exists in two versions with different conclusions",
    detail:
      "Two files, both dated 22 May 2026, both compliance audits of the same licence by the same auditor. The 15-page version records 69 compliant, 2 partially compliant and 2 non-compliant — four non-conformances. The 17-page version records 68, 3 and 2 — five. The difference is condition 5.2.13, registration of waste storage under GN 926, which appears as NCR-003 in the longer version and is absent entirely from the shorter one. The Department's 30 June letter asks for the date by which \"the 4\" will be resolved, so DFFE is working from the shorter version. Silverline is the external auditor here, which is what makes this more than a version-control nuisance.",
    action:
      "Establish which version is authoritative before answering question 2.3. If the five-item version is correct, DFFE is holding an understated compliance picture supplied by us and must be told before any resolution dates are given. If storage genuinely is authorised under the WML — which the observation itself suggests — withdraw the longer version from internal circulation so it cannot be quoted later.",
    evidence: [
      { source: "ClinX Waste Management License - External Audit_2026-05-22.pdf", locator: "15 pages", quote: "Compliant (69) Partially compliant (2) Non-compliant (2)" },
      { source: "ClinX_Waste_Management_License_ComplianceAudit_2026-05-22 Complete.pdf", locator: "17 pages", quote: "Compliant (68) Partially compliant (3) Non-compliant (2)" },
      { source: "DFFE information request", locator: "EDMS 274535, para 2.3", quote: "The date by when the 4 identified non-compliances (including 'partial compliances') identified the External Audit Report will be resolved." },
    ],
  },
  {
    agent: "statutory-clock",
    severity: "critical",
    title: "Two of the Director's three questions have no answer on record",
    detail:
      "The 30 June letter asks three things. Question 2.2 — whether the Action Plan provisions have been met — is answered in substance by the 30 June action plan submitted on 3 July. Questions 2.1 and 2.3 are not. Both concern the external audit rather than the action plan, and the eleven action-plan measures are a different list from the four audit non-conformances. Silverline's own internal note of 10 July reads \"We still need to respond to the S31L letter here..\", seven days after the June report went in.",
    action:
      "Answer 2.1 and 2.3 in a single letter quoting both EDMS references, with a date against each of the four non-conformances. Question 2.1 asks the external auditor for a professional opinion and cannot be discharged by forwarding a client document.",
    evidence: [
      { source: "DFFE information request", locator: "EDMS 274535, 30 June 2026", quote: "As to whether the External Auditor is of the view that the facility under consideration is in full compliance with the specific non-compliances stipulated in Table 1 of NEMA Section 31L NOI" },
      { source: "admin@slco.co.za, internal forward", locator: "10 July 2026", quote: "We still need to respond to the S31L letter here.." },
      { source: "June monthly report", locator: "3 July 2026", quote: "Please find attached the June 2026 Monthly Progress Report … in line with the approved Action Plan under reference EDMS 268095." },
    ],
  },
  {
    agent: "obligation-register",
    severity: "high",
    title: "The autoclave overloading finding and the lapsed AEL are the same problem",
    detail:
      "Table 1 of the notice opens on condition 1.2.1: the licensed plant is two incinerators and one autoclave, and the autoclave is specified at 20 tons per day and 850 kg per hour. DFFE found from log sheets and waste inventory records that it has been overloaded, evidenced by photographs 24 to 73 and the April–October 2025 inventory. Separately, the AEL has lapsed, so the two incinerators cannot lawfully operate and the entire licensed throughput rests on that one machine. The two are being run as separate workstreams — the incinerator evidence pack was requested from ClinX on 8 June, the overloading sits with the enforcement response.",
    action:
      "Answer them together. A capacity response that does not address why all throughput is on one machine invites the obvious follow-up, and an AEL restart case that ignores the overloading finding is arguing against the Department's own evidence.",
    evidence: [
      { source: "PCN Clinx 2025.pdf", locator: "Table 1, condition 1.2.1", quote: "Based on the records received from the facility including log sheets (randomly sampled) and inventory records, it appears that the autoclave machine has been overloaded." },
      { source: "PCN Clinx 2025.pdf", locator: "Autoclave specification", quote: "Maximum daily treatment capacity 20 tons per day · Hourly treatment capacity 850 kg/hour" },
      { source: "admin@slco.co.za to ClinX", locator: "8 June 2026", quote: "Incinerator operating-hour logs from 2019 to date." },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "Our external audit misquotes the licence number it audits against",
    detail:
      "The notice, the 30 June letter and the licence itself all read 12/9/11/L211109153440/3/R. The 22 May external audit reads 12/9/11/L21109153440/3/R — one digit short. The 30 June action plan quotes it correctly, which isolates the error to the audit report alone: the one document in the set that Silverline authored and put its name to as external auditor.",
    action:
      "Correct it in the audit report and note the correction in the next submission, rather than leaving a misquoted licence number in a document the Department is relying on.",
    evidence: [
      { source: "DFFE information request", locator: "EDMS 274535", quote: "NON-COMPLIANCES WITH THE CONDITIONS OF AN ISSUED WASTE MANAGEMENT LICENCE (12/9/11/L211109153440/3/R)" },
      { source: "External audit report", locator: "22 May 2026, cover", quote: "LICENCE NUMBER 12/9/11/L21109153440/3/R" },
      { source: "Action Plan ClinX 30 June 2026.xlsx", locator: "header", quote: "WML No: 12/9/11/L211109153440/3/R" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "medium",
    title: "The formal s31L response was addressed to a name that appears nowhere else",
    detail:
      "The response of 17 December 2025, and Waldo's draft behind it, are addressed to \"Ms F. Craige, Environmental Management Inspector\". Every piece of DFFE correspondence on this file is from Franz Scheepers or Grant Walters. Craige may be whoever signed the notice itself — the signature page has not been checked — but if not, the representations that opened this matter were misaddressed and that sits on the enforcement record.",
    action:
      "Check the signature block on the PCN. If Craige is not an official on this file, correct the addressee in the next letter without drawing attention to it, and use Walters and Scheepers by name from here.",
    evidence: [
      { source: "admin@slco.co.za to Scheepers", locator: "17 December 2025", quote: "Dear Ms Craige," },
      { source: "DFFE correspondence throughout", locator: "Dec 2025 – Jun 2026", quote: "Franz Scheepers, Environmental Control Officer & Grade 2 EMI · Grant Walters, Director: Enforcement" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "None of this file is in the portal",
    detail:
      "The ClinX project record holds five timeline items and zero deadlines, zero documents, zero tasks and zero document requirements. Meanwhile more than forty ClinX documents sit unfiled on a local machine — the licence, both audits, every action plan, the AEL reports, the autoclave validation, the Ekurhuleni packs. The enforcement matter that has run since December 2025 is invisible to anyone who opens the project.",
    action:
      "File the pack into the project, then create the deadlines the record implies: the monthly report cycle, and a date against each of the four non-conformances. Until then the portal actively misleads anyone who checks it.",
    evidence: [
      { source: "Portal — projects.ClinX", locator: "27 July 2026", quote: "deadlines: 0 · documents: 0 · tasks: 0 · document requirements: 0" },
      { source: "Local Downloads folder", locator: "27 July 2026", quote: "40+ ClinX documents including the WML, both external audits, the action plans and the AEL reports" },
    ],
  },
  {
    agent: "statutory-clock",
    severity: "info",
    title: "Monthly reporting is complete and current — no gaps",
    detail:
      "February through June have all been submitted, and February went in two days ahead of the committed start. Scheepers acknowledged the April report the same day it was sent. This is the part of the file that is working, and it is worth saying so: the Director's reminder that reports must continue is a restatement of the obligation, not a complaint about performance.",
    action:
      "Keep the cycle. Use the July report, due around 1 August, to carry the outstanding answers to 2.1 and 2.3 if they have not gone separately by then.",
    evidence: [
      { source: "Sent Items, admin@slco.co.za", locator: "28 Feb, 31 Mar, 1 May, 1 Jun, 3 Jul 2026", quote: "Monthly Progress Report … submitted in line with the approved Action Plan under reference EDMS 268095" },
      { source: "Franz Scheepers", locator: "1 May 2026", quote: "Thank you, the report has been received." },
    ],
  },
];

/** Documents held on disk but not filed into the portal. */
export const UNFILED_DOCUMENTS = [
  { name: "PCN Clinx 2025.pdf", note: "The s31L notice itself — 45 pages, scanned" },
  { name: "WML.pdf / ClinX Reviewed Waste Management License 2023.pdf", note: "The licence being enforced" },
  { name: "ClinX Waste Management License - External Audit_2026-05-22.pdf", note: "The 4-NCR version — the one DFFE holds" },
  { name: "ClinX_Waste_Management_License_ComplianceAudit_2026-05-22 Complete.pdf", note: "The 5-NCR version" },
  { name: "EDMS 274535 ClinX infromation request.pdf", note: "The 30 June Director request" },
  { name: "Action Plan ClinX 30 June 2026.xlsx", note: "Current action plan, GM-signed" },
  { name: "S31L Action Plan Report 30 September 2025.docx", note: "Predates the notice — unexplained" },
  { name: "Clinx Annual AEL Report 2024.pdf", note: "AEL material for the lapse" },
  { name: "ClinX Autoclave Validation Report September 2023.pdf", note: "Bears on the overloading finding" },
  { name: "ClinX Internal Audit Report Autoclave 29.04.2026.pdf", note: "Internal autoclave audit" },
  { name: "Annexure A - Audit Findings and Recommendations.pdf", note: "Audit annexure" },
  { name: "Site Inspection Fieldsheet Report - ClinX.pdf", note: "Inspection record" },
];
