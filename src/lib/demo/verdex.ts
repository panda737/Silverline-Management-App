/**
 * Verdex — Section 24G Rectification + WML Mission Control.
 *
 * Built 27 July 2026 from the S24G agent package prepared for this file, then
 * verified line by line against the admin@slco.co.za mailbox — received and
 * sent. Where the package and the mailbox differ, the mailbox wins and the
 * difference is recorded as a finding.
 *
 * This is a third shape again. Dilex is a licence application running to a
 * statutory clock. ClinX is enforcement against a licence already issued.
 * Verdex is a rectification: the activity started first and the authorisation
 * is being sought afterwards, which means the question is not "when is it due"
 * but "what exactly was done, when, and does it need a licence at all".
 */

export const VERDEX_AS_AT = "2026-07-27";

export const PROJECT = {
  client: "Verdex (Pty) Ltd",
  registration: "2024/312113/07",
  facility: "Composite plastic board manufacturing facility, Waltloo",
  address: "325 Mundt Street, Waltloo, Pretoria, Gauteng, 0184",
  product: "Composite plastic boards, primarily construction formwork",
  process:
    "Receipt → weighing → inspection → shredding → blending → heating → compression moulding → QC → storage → dispatch",
  routeLabel: "Section 24G rectification + WML",
  authority: "UNCONFIRMED — DFFE or GDARD",
  consultant: "Silverline Compliance (Pty) Ltd, reg 2025/816742/07",
} as const;

/** Capacity is the figure that matters, not throughput — GN 921 thresholds are
 *  written against what a facility *can* process, not what it did. */
export const CAPACITY = [
  { label: "Current throughput", value: "10–15 tonnes per week", note: "As reported 22 July" },
  { label: "Design capacity", value: "~30 tonnes per day", note: "Above the 10 t/day threshold" },
  { label: "Absolute press maximum", value: "~2 t/hour ≈ 48 tonnes per day", note: "Also above" },
  { label: "Processed to date", value: "~100 tonnes by 22 July 2026", note: "Since first board pressed" },
  { label: "Stock on floor", value: "~120 tonnes on 14 July 2026", note: "" },
  { label: "Maximum storage", value: "~300–500 tonnes", note: "Indoor and outdoor on hardstanding" },
] as const;

export const FEEDSTOCK = {
  period: "5 August 2025 – 13 July 2026",
  entries: 38,
  gross: "365,960 kg",
  rejected: "47,460 kg (one full load, 12 June 2026)",
  net: "318,500 kg",
  types: "MLP, PP, HDPE, LDPE, woven PP, BOPP",
  excluded: "PVC and other chlorinated plastics not accepted; flame-retardant plastics not intentionally accepted",
  gaps:
    "The ledger carries date and quantity only — no supplier names, no finished-product output, and no destination record for the rejected load.",
} as const;

export type ClockKind = "commenced" | "submitted" | "received" | "open" | "due";

export type ClockEvent = {
  date: string;
  kind: ClockKind;
  label: string;
  detail: string;
};

/** Two clocks run here: when the activity commenced (the s24G trigger) and
 *  where the engagement has got to. */
export const TIMELINE: ClockEvent[] = [
  {
    date: "2025-08-05",
    kind: "commenced",
    label: "First recorded feedstock receipt",
    detail:
      "The earliest dated entry in the feedstock ledger. Receiving and storing material is itself capable of being a listed activity, so this date may matter as much as the processing dates.",
  },
  {
    date: "2026-01",
    kind: "commenced",
    label: "Shredding commenced",
    detail:
      "Month confirmed by Dewald; the exact date is outstanding and is one of the few facts a Section 24G application cannot be vague about.",
  },
  {
    date: "2026-03",
    kind: "commenced",
    label: "First board pressed",
    detail:
      "Month confirmed. The exact date, and the installation and commissioning dates of the main equipment, remain outstanding.",
  },
  {
    date: "2026-07-10",
    kind: "received",
    label: "First contact — meeting confirmed",
    detail: "Luaan Rentzke confirmed a 13 July meeting to discuss the WML requirement.",
  },
  {
    date: "2026-07-13",
    kind: "received",
    label: "Verdex supplies process, feedstock, throughput and storage summary",
    detail: "Dewald Muller, CFO. All substantive technical information on this file has come from him.",
  },
  {
    date: "2026-07-14",
    kind: "received",
    label: "Feedstock ledger supplied",
    detail:
      "Gross and net figures, stock estimate, January shredding commencement and the feedstock workbook — still the only technical data attachment received.",
  },
  {
    date: "2026-07-15",
    kind: "submitted",
    label: "NDA signed and returned",
    detail: "Silverline Compliance (Pty) Ltd. Not a Section 24G information gap.",
  },
  {
    date: "2026-07-16",
    kind: "submitted",
    label: "Regulatory assessment and proposed compliance scope issued",
    detail:
      "Preliminary outcome recorded WML, storage norms, atmospheric emissions and a possible Section 24G.",
  },
  {
    date: "2026-07-20",
    kind: "submitted",
    label: "Thermal-process and capacity questions put to the client",
    detail:
      "Specifically to determine whether the press triggers an Atmospheric Emission Licence. Dewald forwarded them to Ruhan.",
  },
  {
    date: "2026-07-22",
    kind: "received",
    label: "Technical answers returned — by Dewald, not Ruhan",
    detail:
      "Temperature, fumes, extraction, capacity, feedstock exclusions, commencement month and processed quantity. Ruhan was out of office.",
  },
  {
    date: "2026-07-23",
    kind: "submitted",
    label: "Section 24G confirmed as part of the WML mandate · quotation and Phase 1 invoice issued",
    detail: "QUO0000794 — R240,000 excluding VAT in three equal phases of R80,000.",
  },
  {
    date: "2026-07-26",
    kind: "submitted",
    label: "Outstanding information request sent to the client",
    detail: "\"Verdex – Outstanding Information and Documents Required for Environmental Applications\", to Dewald and Ruhan.",
  },
  {
    date: "2026-07-27",
    kind: "received",
    label: "Signed quotation and proof of Phase 1 payment received",
    detail:
      "Dewald returned the signed quotation, Luaan sent the bank confirmation letter, and Dewald supplied proof of the R80,000 payment and requested urgent commencement. The commercial gate is cleared and the mandate is live.",
  },
  {
    date: "2026-07-27",
    kind: "submitted",
    label: "Refined information checklist sent to Dewald and Ruhan",
    detail:
      "Sent by Luaan at 16:24, thirteen minutes after an internal draft circulated under the subject \"DRAFT VERDEX DETAILS\". The client-facing request is out and awaiting a response.",
  },
  {
    date: "2026-08-03",
    kind: "due",
    label: "Reasonable point to chase the checklist",
    detail:
      "No deadline has been set with the client. Phase 1 is paid and the client asked for urgent commencement, so a week is the outside limit before the absence of a reply becomes the project's own delay.",
  },
];

/** The questions that decide whether there is a matter at all. */
export type LegalState = "blocking" | "open";

export const LEGAL_QUESTIONS: {
  question: string;
  state: LegalState;
  why: string;
}[] = [
  {
    question: "Does the incoming sorted and baled plastic remain \"waste\" under NEM:WA?",
    state: "blocking",
    why:
      "Suppliers sort, separate and bale the material before delivery and Verdex buys it as a defined manufacturing feedstock. If it is a commodity rather than waste, there is no listed waste activity, no WML and no Section 24G — and two thirds of the mandate falls away. Everything else on this file is downstream of this answer.",
  },
  {
    question: "Which listed waste-management activities and thresholds apply?",
    state: "blocking",
    why:
      "Turns on capacity, not throughput. Design capacity is ~30 t/day and the press maximum ~48 t/day, both comfortably above the 10 t/day general-waste treatment threshold and below 100 t/day.",
  },
  {
    question: "Is DFFE or GDARD the competent authority?",
    state: "blocking",
    why:
      "Determines the form, the fee, the pre-application procedure and who the Section 24G representations are addressed to. Unconfirmed.",
  },
  {
    question: "Does the 200–220 °C open-press process trigger an atmospheric emission requirement?",
    state: "open",
    why:
      "The process is designed to melt and consolidate, not to decompose or combust, and produces no intentional oil, condensate, ash or char. But extraction specifications, airflow, discharge configuration and monitoring records have not been supplied, so the question cannot be closed.",
  },
  {
    question: "Do the general-waste storage norms or a registration apply?",
    state: "open",
    why:
      "Maximum storage was reported at ~300–500 tonnes across indoor and outdoor hardstanding. Volume in cubic metres and the pre-shred/post-shred split have not been provided.",
  },
  {
    question: "Which Section 24G form does the authority actually require?",
    state: "open",
    why:
      "The DFFE RCSM page still links the 2016 form, which the working draft uses. DFFE published a consultation notice on 15 May 2026 proposing amendments to the fine regulations and Annexure A — a consultation, not final law. A Gauteng-specific or updated version may be required.",
  },
  {
    question: "May one combined Section 24G application cover all identified activities?",
    state: "open",
    why: "Affects whether this is one submission or several, and the fine calculation.",
  },
];

/** What the client still owes, as sent to Dewald and Ruhan on 27 July. */
export const OUTSTANDING: { section: string; item: string }[] = [
  { section: "Company", item: "Registered applicant confirmation, current CIPC documents and directors" },
  { section: "Company", item: "Authorised application signatory and the resolution giving that authority" },
  { section: "Property", item: "Title deed or lease, landowner details and written consent" },
  { section: "Property", item: "Erf/farm/portion, SG code, zoning, and building, occupancy and fire approvals" },
  { section: "Dates", item: "Exact date shredding commenced" },
  { section: "Dates", item: "Exact date the first board was pressed" },
  { section: "Dates", item: "Installation and commissioning dates of the main equipment" },
  { section: "Site", item: "Equipment schedule or specification sheets" },
  { section: "Site", item: "Site plan, operational footprint, storage volume in m³ and recent photographs" },
  { section: "Records", item: "Supplier names linked to the existing feedstock ledger" },
  { section: "Records", item: "Monthly quantities processed and boards produced" },
  { section: "Records", item: "Delivery, rejection, waste-disposal and recycling records" },
  { section: "Utilities", item: "Waste contractors, additional waste streams, water/effluent, electricity and generator details" },
  { section: "Compliance", item: "Previous applications, inspections, notices, complaints or incidents — or written confirmation of none" },
  { section: "Section 24G", item: "Why environmental approval was not obtained before commencement" },
  { section: "Business", item: "Facility value, employee numbers, employment value and principal benefits" },
  { section: "Coordination", item: "Site-visit and records-access contact" },
];

/** Silverline's own workstream — deliberately not asked of the client. */
export const EAP_TASKS = [
  "Confirm the competent authority",
  "Confirm the current authority-approved form",
  "Listed-activity and licence classification",
  "Site and receiving-environment assessment",
  "Maps and Screening Tool report",
  "Impact assessment and mitigation",
  "Alternatives report",
  "Public participation",
  "EMPr and specialist studies where required",
  "Final declarations and submission assembly",
];

export type VerdexFinding = {
  agent: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  action: string;
  evidence: { source: string; locator: string; quote: string }[];
};

export const FINDINGS: VerdexFinding[] = [
  {
    agent: "legal-classification",
    severity: "critical",
    title: "Whether the feedstock is \"waste\" decides whether there is a matter at all",
    detail:
      "Suppliers sort, separate and bale the material before it arrives, and Verdex purchases it as a defined manufacturing feedstock. If that material is a commodity rather than waste under NEM:WA, there is no listed waste activity, no waste management licence, and therefore no Section 24G to rectify. If it is waste, the capacity figures put the facility squarely inside the licensing band. The entire R240,000 mandate, and the client's exposure to a Section 24G fine, rest on this one classification — and it is recorded as unresolved.",
    action:
      "Get a documented legal opinion on the waste-versus-commodity question before any further work is billed against Phases 2 and 3. It is the cheapest task on the file and the only one that can make the others unnecessary.",
    evidence: [
      { source: "S24G package — Confirmed Facts", locator: "Feedstock", quote: "Whether all incoming material remains \"waste\" under NEMWA is unresolved." },
      { source: "S24G package — Legal research", locator: "Unresolved legal questions", quote: "Whether the incoming sorted and baled plastic remains \"waste\" under NEMWA." },
      { source: "Dewald Muller", locator: "13 July 2026", quote: "Suppliers sort, separate and bale material before delivery." },
    ],
  },
  {
    agent: "legal-classification",
    severity: "critical",
    title: "Capacity, not throughput, is the test — and capacity is above the threshold",
    detail:
      "Actual throughput is 10–15 tonnes per week, which averages a little over a tonne a day and reads as comfortably small. That is the wrong measure. GN 921 thresholds are written against the capacity a facility has to process, and Verdex reports a design capacity of about 30 tonnes per day with an absolute press maximum near 48 tonnes per day. Both sit above the 10 t/day general-waste treatment threshold and below 100 t/day. Reasoning from the ledger totals instead — 318.5 tonnes over eleven months — produces the opposite answer and it would be wrong.",
    action:
      "Document the relationship between design capacity and the theoretical press maximum, and classify against capacity. If the classification is argued on throughput it will not survive the authority's first question.",
    evidence: [
      { source: "S24G package — Confirmed Facts", locator: "Throughput and Capacity", quote: "Design capacity: approximately 30 tonnes per day. Absolute press maximum: approximately 2 tonnes per hour or 48 tonnes per day." },
      { source: "S24G package — Confirmed Facts", locator: "Throughput and Capacity", quote: "The relationship between design capacity and theoretical press maximum must be documented." },
    ],
  },
  {
    agent: "statutory-clock",
    severity: "high",
    title: "The commencement dates are approximate, and a Section 24G cannot be vague about them",
    detail:
      "Feedstock receipt began 5 August 2025, shredding in January 2026 and the first board was pressed in March 2026 — all months, no dates. A Section 24G application turns on exactly when the unlawful activity commenced: it frames the rectification, it is what the authority tests the representations against, and it bears on the fine. Equipment installation and commissioning dates are also outstanding. Three of these sit in the checklist already with the client.",
    action:
      "Treat the three commencement dates as the highest-priority items in the outstanding-information request rather than as line items among seventeen. They are the only ones that cannot be reconstructed later from records Silverline holds.",
    evidence: [
      { source: "S24G package — Confirmed Facts", locator: "Commencement", quote: "Exact shredding and pressing dates remain outstanding. Equipment installation and commissioning dates remain outstanding." },
      { source: "Feedstock ledger", locator: "5 Aug 2025 – 13 Jul 2026", quote: "38 dated receipt entries, 365,960 kg gross, 318,500 kg net" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "The competent authority is unconfirmed, and it changes the form",
    detail:
      "Whether DFFE or GDARD holds the combined matter is recorded as an open legal question. It determines the application form, the fee, the pre-application procedure and who the representations are addressed to. Separately, the working draft uses the 2016 Section 24G form still linked from the DFFE RCSM page, while DFFE published a consultation notice on 15 May 2026 proposing amendments to the fine regulations and Annexure A. That notice is a consultation and not final law, so the 2016 form remains defensible — but only until the authority says otherwise.",
    action:
      "Confirm the authority in writing before the draft is populated any further, and ask that authority which form and pre-application procedure it requires. Do not treat the proposed 2026 amendments as law without a final gazette.",
    evidence: [
      { source: "S24G package — Legal research", locator: "Unresolved legal questions", quote: "Whether GDARD/Gauteng or DFFE is the competent authority for the combined matter." },
      { source: "S24G package — Legal research", locator: "2026 proposed amendments", quote: "The notice is explicitly a consultation on intended amendments. Do not treat the proposed form or fine text as final legislation unless a final gazette is located and verified." },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "The AEL question cannot be closed on the information supplied",
    detail:
      "The press runs at 200–220 °C in an open heated configuration, with plastic expected to sit slightly below plate temperature. The process is designed to melt and consolidate rather than decompose or combust, and no intentional oil, condensate, ash or char is produced — which points away from a thermal-treatment characterisation. But local extraction is installed above the presses and no extraction specification, airflow figure, discharge configuration or monitoring record has been supplied, so the question stays open on the evidence rather than on the argument.",
    action:
      "Get the extraction specification and discharge configuration from Ruhan directly. This is the one technical question where the client's own COO is the right source and has not yet answered.",
    evidence: [
      { source: "S24G package — Confirmed Facts", locator: "Thermal Process and Emissions", quote: "Extraction specifications, airflow, discharge configuration and monitoring records have not been supplied." },
      { source: "Luaan Rentzke to Dewald", locator: "20 July 2026", quote: "we require a few additional technical details to confirm whether the thermal process triggers an Atmospheric Emission Licence" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "medium",
    title: "Every technical fact on this file came from the CFO, not the technical contact",
    detail:
      "Ruhan Rykaart is Verdex's Chief Operating Officer and was identified on 24 July as the right person for machine and process questions. He has been copied throughout and has never sent a technical response — Dewald, the CFO, answered the temperature, extraction, capacity and commencement questions while Ruhan was out of office. That is workable for a scoping conversation and not workable for a Section 24G application, where the process description is signed and the authority may test it on site.",
    action:
      "Get Ruhan's answers directly and on the record before the process description is finalised, rather than attributing a CFO's summary to the COO in a signed application.",
    evidence: [
      { source: "S24G package — Correspondence register", locator: "Conclusions", quote: "Ruhan was copied and identified as technical contact but did not send a separate technical response." },
      { source: "Dewald Muller", locator: "24 July 2026", quote: "Confirmed Ruhan is Chief Operating Officer and supplied his contact details." },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "medium",
    title: "One technical attachment on a file that needs a submission pack",
    detail:
      "The feedstock workbook is the only technical data attachment ever received. No equipment manuals, site plans, photographs, production logs, waste records or property documents have been supplied. The ledger itself carries date and quantity only — no supplier names, no finished-product output, and no destination record for the 47,460 kg load rejected on 12 June. A Section 24G application is largely an evidence pack, and there is currently one spreadsheet in it.",
    action:
      "Sequence the checklist rather than waiting on all seventeen items: the property pack and the commencement dates block the application, the photographs and equipment schedule block the site description, and the records can follow.",
    evidence: [
      { source: "S24G package — Correspondence register", locator: "Conclusions", quote: "No equipment manuals, site plans, photographs, production logs, waste records or property documents were attached." },
      { source: "S24G package — Confirmed Facts", locator: "Feedstock Ledger", quote: "It does not identify suppliers or record finished-product output." },
    ],
  },
  {
    agent: "statutory-clock",
    severity: "info",
    title: "The mandate is live and the client has asked to move",
    detail:
      "Verdex returned the signed quotation on 27 July, Luaan issued the bank confirmation letter the same morning, and Dewald supplied proof of the R80,000 Phase 1 payment and asked for urgent commencement. The refined information checklist went to Dewald and Ruhan at 16:24 that afternoon. The commercial gate that governed this file since 23 July is cleared, and the delay from here is Silverline's to own.",
    action:
      "Set a date to chase the checklist. Nothing was given to the client, and on a file where the client has just paid and asked for urgency, an unanswered request drifts quietly.",
    evidence: [
      { source: "Dewald Muller", locator: "27 July 2026, 06:15", quote: "Supplied proof of R80,000 payment and requested urgent commencement." },
      { source: "Luaan Rentzke to Dewald and Ruhan", locator: "27 July 2026, 16:24", quote: "Verdex Environmental Approval and Waste Management Licence Information Checklist" },
    ],
  },
];

/**
 * What is actually on file, verified against the package's evidence folder.
 *
 * The Phase 1 proof of payment is deliberately NOT listed. This view is headed
 * for the client's own eyes, and showing Verdex their own payment back to them —
 * amount in the filename — is not evidence they need from us.
 */
export const EVIDENCE_HELD = [
  { name: "Quotation_-_QUO0000794 - signed.pdf", note: "Signed by Verdex, 27 July" },
  { name: "Invoice - INV0000969.pdf", note: "Phase 1 invoice" },
  { name: "NDA - Waste Management - Completed and Signed.pdf", note: "Signed 15 July" },
  { name: "Feedstock per date 260713.xlsx", note: "The only technical data attachment received" },
  { name: "S24G_applicationform2016_blank.doc", note: "The form the working draft uses" },
  { name: "Verdex_S24G_Application_Working_Draft.docx / .pdf", note: "Populated working draft" },
];
