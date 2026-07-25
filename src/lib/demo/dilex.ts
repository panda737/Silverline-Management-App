/**
 * Demo dataset — Dilex Inland Elandsfontein WML & S&EIR.
 *
 * Every figure, date, reference and condition below was read out of the actual
 * submission pack in
 *   OneDrive\Projects\Silverline\Elandsfontein EIA Dialex\Dilex Inland WML
 * so the Demo section shows the tool working on a real file rather than on
 * invented data. Nothing here is estimated unless it is explicitly marked
 * `derived` or `toConfirm`.
 *
 * It is a static fixture on purpose: the Demo section must render for anyone
 * who logs in, without seeding a database and without touching live client
 * projects. When the tool graduates out of Demo it reads the same shapes from
 * Supabase.
 */

export const DILEX_AS_AT = "2026-07-25";

// --- The file itself --------------------------------------------------------

export const PROJECT = {
  name: "Dilex Inland WML Application",
  facility: "Elandsfontein Waste Treatment Facility",
  description:
    "Hazardous waste treatment, recovery, recycling and transfer facility",
  applicant: "Dilex Inland (Pty) Ltd",
  applicantContact: "Hamish Miller (also the registered landowner)",
  eap: "Mpanyana Lucas Mahlangu — EAPASA 2021/4461, expires 31 March 2027",
  eapFirm: "Silverline (Pty) Ltd",
  authority: "DFFE — Directorate: Licensing",
  caseOfficer: "Cynthia Baloyi · CYBaloyi@dffe.gov.za · 012 399 9523",
  director: "Matjelele Phaladi, Director: Licensing",
  dffeRef: "12/9/11/L260513113929/3/N",
  storageRegistrationRef: "12/9/11/ST559/3 (GN 926 storage registration, 26 May 2026)",
  property: "Portion 45 of the Farm Elandsfontein 412 JR",
  sgCode: "T0JR00000000041200045 · SG Diagram 4301/48",
  municipality: "City of Ekurhuleni Metropolitan Municipality · Ward 25",
  zoning: "AGRICULTURE — outside the Urban Development Boundary",
  extent: "4.5 ha",
  route: "category_b" as const,
  routeLabel: "Category B — Scoping and EIR",
  stage: "EIA / EIR phase",
  fee: "R10 000.00, paid 21 April 2026",
};

export const CAPACITY = [
  { label: "Throughput", value: "100 t/day · 2 500 t/month", note: "~25 operating days/month; treatment and recovery are not additive" },
  { label: "Storage", value: "±600 000 L", note: "At least 6 × 42 000 L above-ground tanks; series SC1–SC8, RT1–RT6, DW1–DW4" },
  { label: "Bunding", value: "120 000 L external · 35 000 L internal", note: "From site signage; engineering verification outstanding" },
  { label: "Traffic", value: "≤10 tankers/day", note: "Payloads 1–32 t; 24-hour operational availability" },
  { label: "Footprint", value: "9 000 m² vs 11 945 m²", note: "UNRECONCILED — stated footprint vs Bunds A–F on drawing DE1", flag: true },
  { label: "Employment", value: "~20 direct · ~20 indirect", note: "Applicant to confirm; report warns against overstating" },
];

// --- Listed activities ------------------------------------------------------

export const LISTED_ACTIVITIES = [
  {
    ref: "Category B, Activity 2",
    notice: "GN 921 of 29 November 2013, as amended",
    text:
      "The reuse or recycling of hazardous waste in excess of 1 ton per day, excluding reuse or recycling that takes place as an integral part of an internal manufacturing process within the same premises.",
    triggered: "yes" as const,
  },
  {
    ref: "Category B, Activity 3",
    notice: "GN 921 of 29 November 2013, as amended",
    text:
      "The recovery of waste including refining, utilisation or co-processing at a facility that processes in excess of 100 tons of general waste per day or in excess of 1 ton of hazardous waste per day, excluding recovery that takes place as an integral part of an internal manufacturing process within the same premises.",
    triggered: "yes" as const,
  },
  {
    ref: "Category B, Activity 4",
    notice: "GN 921 of 29 November 2013, as amended",
    text:
      "The treatment of hazardous waste in excess of 1 ton per day calculated as a monthly average, using any form of treatment excluding the treatment of effluent, wastewater or sewage.",
    triggered: "yes" as const,
  },
  {
    ref: "Category B, Activity 10",
    notice: "GN 921 of 29 November 2013, as amended",
    text:
      "The construction of a facility for a waste management activity listed in Category B of this Schedule.",
    triggered: "yes" as const,
  },
  {
    ref: "NEMA EIA Listing Notices 1, 2 and 3",
    notice: "GN R983 / R984 / R985 of 2014, as amended",
    text:
      "No NEMA Listing Notice activity is cited anywhere in the Final Scoping Report, the Draft Scoping Report or the Screening Report. With ±600 000 L of hazardous liquid stored on site, LN1 Activity 14 (bulk storage of a dangerous good exceeding 80 m³) warrants an express screening decision either way.",
    triggered: "tbc" as const,
  },
];

// --- The regulatory clock ---------------------------------------------------

export type ClockEvent = {
  date: string;
  label: string;
  detail: string;
  source: string;
  kind: "done" | "now" | "due";
};

export const TIMELINE: ClockEvent[] = [
  { date: "2026-03-06", label: "EAP appointed", detail: "Silverline Compliance appoints Lucas Mahlangu; accepted 7 March 2026.", source: "Appointment Letter", kind: "done" },
  { date: "2026-04-20", label: "Application signed", detail: "Applicant, landowner and EAP declarations commissioned before a Commissioner of Oaths.", source: "WML application form", kind: "done" },
  { date: "2026-04-21", label: "Application lodged", detail: "DFFE confirms receipt of the WML application form. R10 000 fee paid the same day.", source: "DFFE acknowledgement 18/05/2026", kind: "done" },
  { date: "2026-05-08", label: "Newspaper notice", detail: "Advertisement placed in the Germiston City News.", source: "Germiston City News", kind: "done" },
  { date: "2026-05-18", label: "Reference number assigned", detail: "DFFE acknowledges the application and assigns 12/9/11/L260513113929/3/N.", source: "DFFE acknowledgement", kind: "done" },
  { date: "2026-06-03", label: "Final Scoping Report submitted", detail: "FSR and Plan of Study for EIA submitted; I&AP register of the same date filed with it.", source: "DFFE acknowledgement 08/06/2026", kind: "done" },
  { date: "2026-06-08", label: "FSR receipt acknowledged", detail: "Department undertakes to comment within 30 days of receipt.", source: "DFFE acknowledgement", kind: "done" },
  { date: "2026-07-16", label: "FSR ACCEPTED — with 7 conditions", detail: "Department satisfied the FSR meets Appendix 2. Authorises the EIA process per the accepted Plan of Study. Took 43 days against its own stated 30.", source: "Acceptance letter, signed M. Phaladi", kind: "done" },
  { date: "2026-10-30", label: "Draft + Final EIAR due", detail: "DERIVED, NOT STATED BY DFFE: Regulation 23 of GN R982 allows 106 days from acceptance of the Scoping Report to submit the EIR. Measured from 16 July 2026 that falls on 30 October 2026. The acceptance letter sets no date of its own — confirm the applicable period with the case officer rather than relying on this.", source: "Regulation 23, GN R982 — derived", kind: "due" },
];

/** Whole days between two ISO dates. */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

// --- The seven acceptance conditions ---------------------------------------

export const ACCEPTANCE_CONDITIONS = [
  {
    n: 1,
    title: "Align the project title across every document",
    quote:
      "The Department recommends that project titles on both application form and the reports must not be different. Because inconsistent project titles may create uncertainty regarding whether all documents provided relate to the same proposed development.",
    status: "open" as const,
    note:
      "At least five different titles are in the official record, including two used by DFFE itself.",
  },
  {
    n: 2,
    title: "Specify exactly which waste streams will be received",
    quote:
      "The draft Environmental Impact Assessment Report (EIAR) must clearly specify exactly which waste streams will be received for processing on the proposed site. Because waste streams such as compatible waste types and containerized waste streams are not sufficient to make an informed decision.",
    status: "open" as const,
    note:
      "No SAWIS or waste classification codes appear anywhere in the technical pack.",
  },
  {
    n: 3,
    title: "Rezone the site before any waste management use",
    quote:
      "The applicant must note that the site cannot be used for waste management activities prior to the rezoning of the site.",
    status: "blocker" as const,
    note:
      "The site is zoned AGRICULTURE. Registration under the storage Norms and Standards does not change that. This is the longest-lead item on the file and it sits with the municipality, not the Department.",
  },
  {
    n: 4,
    title: "Identify and assess alternatives per Appendix 2",
    quote:
      "The Department recommends that alternatives be identified and assessed in accordance with appendix 2.",
    status: "open" as const,
    note:
      "No alternative site was provided in the FSR; a reasoned motivation is required if none is assessed.",
  },
  {
    n: 5,
    title: "Include the public participation records in the draft EIAR",
    quote:
      "The department recommends that the draft EIAR must include the public participation records.",
    status: "open" as const,
    note:
      "Appendix C of the FSR was filed with placeholder text while a populated register and a comments-and-responses report existed separately.",
  },
  {
    n: 6,
    title: "Circulate the draft EIAR to the Department during the 30-day PPP",
    quote:
      "Prior to the submission of the final EIAR, the draft EIAR must be submitted to the Department for comments as part of the 30-day public participation process.",
    status: "open" as const,
    note:
      "This puts the Department inside the participation window — the draft must be ready meaningfully before the submission date.",
  },
  {
    n: 7,
    title: "Include a draft EMPr complying with Appendix 4",
    quote:
      "The EIAR must include the draft Environmental Management Programme (EMPr). The draft EMPr to be developed must comply with Appendix 4 of Government Notice R 982 of the EIA Regulations 2014 (as amended).",
    status: "open" as const,
    note: "",
  },
];

// --- Specialist studies -----------------------------------------------------

export type StudyState = "committed" | "available" | "gap";

export const SPECIALIST_STUDIES: {
  name: string;
  state: StudyState;
  route: string;
  note: string;
}[] = [
  { name: "Site sensitivity verification", state: "available", route: "Attach; basis for specialist routing", note: "Must carry photographic evidence and professional sign-off; also has to correct the missing development footprint." },
  { name: "DFFE Screening Report", state: "available", route: "Attach and summarise", note: "Records \"No development footprint(s) specified\" — the sensitivity outputs are property-wide, not footprint-specific." },
  { name: "Fire Risk Assessment", state: "available", route: "Update against final inventory", note: "Already completed; needs realignment to the final hazardous inventory." },
  { name: "Final project description and footprint", state: "committed", route: "Technical", note: "Must reconcile 9 000 m² against 11 945 m²." },
  { name: "Air quality / odour", state: "committed", route: "Focused assessment or screening", note: "VOCs, tank vents, solvent blending, petrol/diesel dewatering, loading and offloading." },
  { name: "MHI screening", state: "committed", route: "Competent-person screening", note: "Against the dangerous-substance inventory, per the MHI Regulations 2022." },
  { name: "Process safety review / HAZOP", state: "committed", route: "Specialist / engineering", note: "Pumps, tanks, isolation, emergency shutdown, commissioning." },
  { name: "Stormwater and contaminated water plan", state: "committed", route: "Engineering plan", note: "Clean/dirty separation, bund pits and separators, firewater containment, no-discharge controls." },
  { name: "DWS water use trigger assessment", state: "committed", route: "Legal / technical screening", note: "Determines whether a water use licence is required." },
  { name: "Waste acceptance and classification note", state: "committed", route: "Technical note / EMPr input", note: "Produces the Waste Acceptance Criteria register — also answers acceptance condition 2." },
  { name: "Traffic and access statement", state: "committed", route: "Traffic statement", note: "Moonlight Road, Apollo weighbridge, ≤10 tankers/day, after-hours access." },
  { name: "Noise, lighting and visual", state: "committed", route: "Focused statement", note: "Driven by 24-hour operation." },
  { name: "Agriculture / terrestrial biodiversity / plant / animal species", state: "committed", route: "Compliance statement or focused assessment", note: "Agriculture and terrestrial biodiversity both screened VERY HIGH." },
  { name: "Palaeontology and heritage", state: "committed", route: "Desktop / compliance statement", note: "Palaeontology screened HIGH; chance-find protocol required." },
  { name: "Civil aviation and defence", state: "committed", route: "Desktop compatibility note", note: "Within 8 km of an aerodrome; a Military and Defence Site is flagged." },
  { name: "Hydrology assessment", state: "gap", route: "—", note: "On the Screening Tool's mandatory list. Not carried into the Plan of Study and not motivated out." },
  { name: "Geohydrology / groundwater", state: "gap", route: "—", note: "No groundwater specialist is named anywhere, for a hazardous liquid facility on agricultural land. §9.5 defers monitoring to the EIR without assigning a discipline." },
  { name: "Geotechnical assessment", state: "gap", route: "—", note: "On the Screening Tool's mandatory list. Absent from the Plan of Study." },
  { name: "Health impact assessment", state: "gap", route: "—", note: "On the Screening Tool's mandatory list. Absent from the Plan of Study." },
  { name: "Socio-economic assessment", state: "gap", route: "—", note: "On the Screening Tool's mandatory list. Handled only descriptively, not as a study." },
  { name: "Aquatic biodiversity", state: "gap", route: "—", note: "Screened Low, but the FSR still requires a DWS trigger assessment for contaminated water. No aquatic study scoped and no motivation recorded." },
];

// --- Screening sensitivities ------------------------------------------------

export const SENSITIVITIES = [
  { theme: "Agriculture", level: "Very High" },
  { theme: "Terrestrial biodiversity", level: "Very High" },
  { theme: "Animal species", level: "High" },
  { theme: "Civil aviation", level: "High" },
  { theme: "Palaeontology", level: "High" },
  { theme: "Defence", level: "Medium" },
  { theme: "Aquatic biodiversity", level: "Low" },
  { theme: "Archaeological & cultural heritage", level: "Low" },
  { theme: "Plant species", level: "Low" },
];

// --- What the agent fleet would surface today -------------------------------

export type DemoFinding = {
  agent: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  action: string;
  evidence: { source: string; locator: string; quote: string }[];
};

export const FINDINGS: DemoFinding[] = [
  {
    agent: "statutory-clock",
    severity: "critical",
    title: "The EIR submission period is running and no date is recorded on the file",
    detail:
      "The Department accepted the Final Scoping Report on 16 July 2026 and authorised the EIA process, but its letter sets no submission date. Regulation 23 of GN R982 allows 106 days from acceptance, which would fall on 30 October 2026 — 97 days from today. No deadline is currently anchored on the project record, so nothing is counting down. Every remaining specialist study, the draft EIAR, a 30-day public participation round and the Department's own review inside that round all have to fit inside that window.",
    action:
      "Confirm the applicable period in writing with Cynthia Baloyi, then anchor the deadline to 16 July 2026 and work the draft EIAR date backwards from the 30-day participation window rather than from the final submission date.",
    evidence: [
      { source: "FSR Acceptance Letter", locator: "16 July 2026", quote: "You may proceed with the Environmental Impact Assessment process in accordance with the tasks contemplated in the Plan of Study" },
      { source: "Acceptance letter, condition 6", locator: "", quote: "Prior to the submission of the final EIAR, the draft EIAR must be submitted to the Department for comments as part of the 30-day public participation process." },
    ],
  },
  {
    agent: "statutory-clock",
    severity: "critical",
    title: "Rezoning is a precondition to use and sits outside the EIA programme entirely",
    detail:
      "Acceptance condition 3 states the site cannot be used for waste management activities prior to rezoning. The site is zoned AGRICULTURE and lies outside the Urban Development Boundary. A rezoning through the City of Ekurhuleni runs on its own statutory timeline — routinely longer than the EIA phase — and it is not on the project programme at all. A licence granted over an unrezoned site cannot be exercised.",
    action:
      "Open the rezoning as a parallel workstream with its own deadline and owner now, and get the town planning timeline from Kempton Park CCC so the two programmes can be compared honestly.",
    evidence: [
      { source: "FSR Acceptance Letter", locator: "Condition 3", quote: "The applicant must note that the site cannot be used for waste management activities prior to the rezoning of the site." },
      { source: "Zoning Certificate", locator: "City of Ekurhuleni Land Use Scheme 2021", quote: "Zoning: AGRICULTURE" },
    ],
  },
  {
    agent: "specialist-studies",
    severity: "high",
    title: "Six Screening-Tool studies are neither scoped nor motivated out",
    detail:
      "The DFFE Screening Tool identified fifteen specialist assessments. Hydrology, geotechnical, health, socio-economic and aquatic biodiversity are absent from the Plan of Study, and no groundwater or geohydrology specialist is named anywhere — for a facility storing roughly 600 000 L of hazardous liquid on agricultural land. The Screening Report places the burden expressly on the practitioner to motivate every omission, with photographic evidence. No such motivation exists, so these currently read as oversights rather than decisions.",
    action:
      "For each of the six, decide now: commission it, or write the motivation with site verification and photographs. Groundwater is the one to resolve first — an authority query on it late in the EIR phase would be very expensive.",
    evidence: [
      { source: "Screening Report", locator: "Specialist assessments", quote: "It is the responsibility of the EAP to confirm this list and to motivate in the assessment report, the reason for not including any of the identified specialist study including the provision of photographic evidence of the site situation." },
      { source: "Final Scoping Report", locator: "§18.5 specialist ToR table", quote: "" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "The whole technical procedure pack describes the Durban site, not Elandsfontein",
    detail:
      "Every site-specific reference in the operating procedures points to New Germany Industrial Park, Pinetown. The effluent work instruction authorises discharge under an eThekwini Municipality trade effluent permit; the emergency procedure cites the eThekwini Wastewater By-laws, eThekwini Fire & Rescue and Pinetown Metro Police; all emergency numbers are 031 codes. The emergency plan is also written against Conditions 2.4.1, 2.5 and 6.3 of an existing Durban licence whose numbering will not map to an Elandsfontein licence. These documents were filed as annexures to the application.",
    action:
      "Re-issue every procedure as Elandsfontein-specific before the EMPr is compiled: substitute City of Ekurhuleni throughout, replace the trade effluent permit reference, rewrite the emergency contact list, and strip the inherited licence condition numbers.",
    evidence: [
      { source: "WI-EAD-001 Effluent Acceptance & Discharge", locator: "§1.1.1", quote: "the discharge requirements of the Ethekwini Municipality Trade Effluent permit" },
      { source: "PROMI-0012025 Procedure for Inspecting Materials", locator: "§11", quote: "The Dilex site is located in New Germany Industrial Park, Pinetown, Durban." },
      { source: "PROERP-0012025 Emergency Preparedness", locator: "§12", quote: "Pinetown Metro Police" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "Pyrolysis was removed from the Scoping Report but is still in the filed procedures",
    detail:
      "The Draft Scoping Report included pyrolysis and thermal treatment. The Final Scoping Report removed every trace of it. But SOP-TCW001, filed as a technical annexure, still routes out-of-specification waste to a pyrolysis plant and describes excess gas being scrubbed and expelled to atmosphere. Nothing in the application authorises a thermal process, and no NEM:AQA listed activity or Atmospheric Emission Licence is referenced. An authority reading the annexures will see a combustion process the application does not cover.",
    action:
      "Decide whether pyrolysis is in scope. If it is out, remove it from SOP-TCW001 before the EIAR annexures are compiled. If it is in, it needs its own listed-activity screening and an AEL pathway — which connects directly to the AEL already in progress.",
    evidence: [
      { source: "SOP-TCW001", locator: "PF1 step 7", quote: "are treated and processed in the pyrolysis plant for complete destruction" },
      { source: "SOP-TCW001", locator: "PF1P step 7", quote: "excess gas channelled through a four stage scrubber and expelled" },
      { source: "Final Scoping Report", locator: "whole document", quote: "" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "high",
    title: "Three different legal entities appear as the applicant across the record",
    detail:
      "The Screening Report names Miller Consulting and Trading (Pty) Ltd. The Draft Scoping Report names Dilex Inland (Pty) Ltd. The Final Scoping Report names DILEX INLAND, reg. 2026/215196/07. The application form names the natural person Hamish Miller as project applicant with Dilex Inland as a trading name, and the contact address is hamish@mcandt.co.za. The R10 000 fee was paid by Silverline (Pty) Ltd, not the applicant. Who is applying, and who will hold the licence, is not unambiguous on the current record.",
    action:
      "Fix one applicant entity, correct the screening report and the application form to match, and file proof of the fee having been on-charged.",
    evidence: [
      { source: "Screening Report", locator: "Applicant", quote: "Miller Consulting and Trading (Pty) Ltd" },
      { source: "Final Scoping Report", locator: "Applicant details", quote: "DILEX INLAND, reg. 2026/215196/07" },
      { source: "Proof of payment", locator: "21/04/2026", quote: "SILVERLINE (PTY) LTD" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "critical",
    title: "The Final Scoping Report was submitted before the comment period closed",
    detail:
      "The site notice and stakeholder letters are dated 6 May 2026 and both state a thirty-day comment period; the newspaper advertisement ran on 8 May. Those windows close on 5 and 7 June respectively. The Final Scoping Report went to DFFE on 3 June 2026 — two days before the earlier window closed and four before the later one. All eight second-batch response letters carry the same 3 June date. An objector has already pleaded defective public participation under Regulations 39–44 and asked for the process to be recommenced; this is the fact that would support him.",
    action:
      "Get this assessed properly before the EIR participation round opens, and design that round so the window demonstrably closes before anything is submitted. If the scoping round has to be cured, it is far cheaper to do it now than after a decision is appealed.",
    evidence: [
      { source: "Site Notice", locator: "6 May 2026", quote: "Thirty (30) days from the placement of this site notice" },
      { source: "Silverline cover letter to DFFE", locator: "3 June 2026", quote: "" },
      { source: "Dirk Poley objection", locator: "29 May 2026", quote: "recommence public participation for 30 days per Reg. 41(2)" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "critical",
    title: "No organ of state was notified, and the cover letter told DFFE otherwise",
    detail:
      "The register records 21 I&APs and zero organs of state: no City of Ekurhuleni department, no DWS, no provincial environmental authority, no heritage authority, no ward councillor. The Final Scoping Report itself lists all of them as parties requiring written notice. Meanwhile the submission cover letter states that comments from \"authorities and organs of state have been recorded, considered and responded to\". No such comments exist. Two objectors also addressed their objections to a provincial department rather than to DFFE, and were not redirected, so those objections are only on the DFFE record via the responses register.",
    action:
      "Notify every organ of state properly in the EIR round with retained proof of service, and correct the representation made in the cover letter rather than leaving it standing on the record.",
    evidence: [
      { source: "I&AP Register, 3 June 2026", locator: "Category column", quote: "Government Department: 0 · Municipality: 0" },
      { source: "Silverline cover letter to DFFE", locator: "§1", quote: "Comments received from Interested and Affected Parties, authorities and organs of state have been recorded, considered and responded to in the Comments and Responses Register." },
      { source: "Final Scoping Report", locator: "§11.3", quote: "Notice to councillor and municipal environmental, planning, roads, fire and waste departments" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "high",
    title: "An active DFFE compliance investigation into this site is not on the project file",
    detail:
      "Erika Taljaard's submission cites a DFFE letter dated 30 March 2026 recording that a complaint of alleged unlawful oil storage on Portion 45 was formally investigated, that Environmental Management Inspectors conducted a joint inspection with the City of Ekurhuleni, that compliance concerns were identified, and that the matter remains under assessment with enforcement action still possible. Four other objectors independently allege an unlicensed operation running three years and four SAPS visits. That letter is not in the project folder, and the response treated the whole matter as outside the scope of participation.",
    action:
      "Obtain the 30 March 2026 letter from DFFE directly and establish the status of the enforcement matter. Compliance history bears on need and desirability and on baseline contamination, and an authority that already holds this letter will expect the EIAR to deal with it.",
    evidence: [
      { source: "Erika Taljaard comment", locator: "12 May 2026", quote: "the matter remains under assessment with regulatory and/or enforcement action still possible" },
      { source: "Project document folder", locator: "", quote: "" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "high",
    title: "Not one registration acknowledgement is evidenced, and eleven parties have an open next action",
    detail:
      "The Date Acknowledged column is empty for all 21 registered parties, and eleven still carry an open Next Action — nine of them \"Send acknowledgement confirming registration\". Among them is Sanet Basson, who chairs the Fly Inn Homeowners Association, an organised community body that was registered and then never engaged. A registered party who was never acknowledged is the cleanest possible procedural complaint.",
    action:
      "Acknowledge all 21 in writing now, retain proof, and close every open Next Action before the EIR round opens.",
    evidence: [
      { source: "I&AP Register, 3 June 2026", locator: "Column R, Date Acknowledged", quote: "" },
      { source: "I&AP Register, 3 June 2026", locator: "Column U, Next Action", quote: "Send acknowledgement confirming registration" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "medium",
    title: "The site notice names the wrong contact person",
    detail:
      "The site notice — the primary public-facing document, physically placed at the gate and on the fence — names Luaan Rentzke as contact person. Every other document in the pack, including the footer of that same page, names Lucas Mahlangu as the EAP. Anyone who tried to register by following the notice was given a name that appears nowhere else in the process.",
    action:
      "Correct it for the EIR round and check whether anyone attempted contact through the wrong route during scoping.",
    evidence: [
      { source: "Site Notice", locator: "Competent Authority / EAP block", quote: "Contact person: Luaan Rentzke" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "medium",
    title: "One I&AP was emailed without consent to electronic communication",
    detail:
      "Melisa van der Merwe's registration form has the electronic-communication consent box unticked, and the register records her consent as \"No\" — the only No among 21 rows. Her preferred communication is nonetheless recorded as email and she was corresponded with by email. That is a POPIA exposure on a file where the participation record is the defence document.",
    action:
      "Obtain written consent or switch her to a consented channel, and add a consent check to the notification workflow so it cannot happen again.",
    evidence: [
      { source: "I&AP Register, 3 June 2026", locator: "Row 20, Consent to Electronic Communication", quote: "No" },
    ],
  },
  {
    agent: "ppp-registrar",
    severity: "high",
    title: "The Department has already noticed the empty comments register",
    detail:
      "Appendix C of the Final Scoping Report was submitted carrying placeholder text — \"No comment recorded in this version\" — while a populated I&AP register dated 3 June 2026 and a separate comments-and-responses report existed in the same submission folder. The Department flagged exactly this as acceptance condition 5. A formal request for non-acceptance of the FSR was also lodged directly with DFFE on 27 May 2026 and the report's own register shows no response to it.",
    action:
      "Rebuild the register from the actual correspondence, confirm every registered party has a logged response, and make sure the escalation lodged on 27 May carries a recorded reply before the EIR participation round opens.",
    evidence: [
      { source: "Final Scoping Report", locator: "Appendix C", quote: "No comment recorded in this version. Register to be populated during statutory PPP and carried into the Final Scoping Report / EIR." },
      { source: "FSR Acceptance Letter", locator: "Condition 5", quote: "The department recommends that the draft EIAR must include the public participation records." },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "medium",
    title: "The cover letter went to the Department with unfilled placeholders",
    detail:
      "The submission cover letter reads \"for a minimum 30-day public review and comment period from [insert start date] to [insert closing date]\". It was sent as-is. On a file where the participation record is the defence document, an unfilled date field in the covering correspondence is exactly the sort of detail an objector's representative will point at.",
    action:
      "Re-issue the cover letter with the actual dates and file the corrected version, so the record shows the period that was genuinely run.",
    evidence: [
      { source: "Silverline Dilex Inland Cover Letter", locator: "§5", quote: "for a minimum 30-day public review and comment period from [insert start date] to [insert closing date]" },
    ],
  },
  {
    agent: "obligation-register",
    severity: "medium",
    title: "No instrument in the compliance chain has a calibration interval",
    detail:
      "The inspection procedure relies on a viscometer, flash point tester, Karl Fischer moisture analyser, pH meter and SCADA; the emergency procedure relies on a handheld PID detector; collections rely on drum gauges. Not one calibration or verification interval is specified anywhere, and no accredited-laboratory requirement is stated for any analysis. Compliance data from an uncalibrated instrument is not evidence, so this quietly undermines every monitoring obligation the licence will impose.",
    action:
      "Add a calibration schedule to the EMPr with intervals per instrument and a SANAS requirement for analyses relied on for compliance.",
    evidence: [
      { source: "PROMI-0012025", locator: "§8 Tools and equipment", quote: "" },
      { source: "PROERP-0012025", locator: "§7.1", quote: "activate handheld PID detector to measure VOC ppm" },
    ],
  },
  {
    agent: "obligation-register",
    severity: "medium",
    title: "Stormwater ingress is listed as an emergency scenario with no response protocol",
    detail:
      "The emergency plan lists nine scenarios and states each will have a dedicated protocol in Section 7. Section 7 provides eight. Stormwater ingress and flooding is the missing one — on a flat, open, largely unsurfaced rural site where contaminated stormwater is one of the principal identified risks.",
    action:
      "Write the missing protocol before the EMPr is compiled, and add routine stormwater quality monitoring — the current plan samples only reactively, when impact is already suspected.",
    evidence: [
      { source: "PROERP-0012025", locator: "§6 vs §7", quote: "Each emergency type will have a dedicated response protocol, listed in Section 7" },
    ],
  },
  {
    agent: "doc-completeness",
    severity: "low",
    title: "Document control defects across the annexure pack",
    detail:
      "Two live revisions of SOP-TH001 (Rev 00 and Rev B) sit in the same folder with no supersession marker. WI 08 appears twice, byte-identical. The work instruction numbering runs 01, 02, 05, 06, 08, 12 — six instructions referenced by the scheme are absent. The five process flow diagrams used as submission annexures carry no reference number, no revision, no author and no approval. There is no work instruction for vacuum distillation, which the process flow makes the terminal recovery step.",
    action:
      "Run a document control pass over the annexure pack before the EIAR: one revision per procedure, a controlled document register, and a work instruction for the distillation plant.",
    evidence: [
      { source: "SOP-TH001", locator: "Rev 00 and Rev B", quote: "" },
      { source: "Process flow diagrams", locator: "07 August 2023", quote: "" },
    ],
  },
];

// --- Public participation ---------------------------------------------------

export const PPP = {
  siteNoticeDate: "2026-05-06",
  stakeholderLetterDate: "2026-05-06",
  newspaper: "Germiston City News, Friday 8 May 2026, page 6 (legal notices)",
  newspaperDate: "2026-05-08",
  windowCloses: "2026-06-05 (site notice) · 2026-06-07 (newspaper)",
  fsrSubmitted: "2026-06-03",
  registered: 21,
  commented: 10,
  acknowledged: 0,
  neverResponded: 11,
  organsOfState: 0,
};

export const IAP_CATEGORIES = [
  { category: "Affected Landowner", count: 9 },
  { category: "Other", count: 6 },
  { category: "Nearby Resident", count: 2 },
  { category: "Business / Industry", count: 2 },
  { category: "Community Representative", count: 1 },
  { category: "Ward Committee", count: 1 },
  { category: "Government Department", count: 0 },
  { category: "Municipality", count: 0 },
  { category: "NGO / Environmental Group", count: 0 },
];

export const COMMENT_THEMES = [
  { theme: "Land-use incompatibility / zoning / SPLUMA", count: 7 },
  { theme: "Air quality, odour, dust, emissions", count: 7 },
  { theme: "Groundwater, borehole and soil contamination", count: 6 },
  { theme: "Scoping report materially deficient", count: 6 },
  { theme: "Alleged existing unlawful operation", count: 6 },
  { theme: "Human health and breathing", count: 6 },
  { theme: "Livestock, flora, fauna, conservation", count: 6 },
  { theme: "Traffic — heavy vehicles on gravel roads", count: 5 },
  { theme: "Defective public participation (Reg. 39–44)", count: 4 },
  { theme: "Property value, stigma, loss of rural character", count: 4 },
  { theme: "Noise, including night-time", count: 3 },
  { theme: "Cumulative impacts", count: 3 },
  { theme: "Fire, explosion, OHS and emergency response", count: 2 },
];

export const ESCALATIONS = [
  {
    who: "DLX Properties (Pty) Ltd — Allen Tavakoli",
    standing: "Adjacent landowner, Portions 10 & 62",
    what:
      "Formal objection under nine headings demanding refusal. Enumerated 14 specialist studies as a precondition and requested 11 documents including the participation register, proof of notices to affected landowners, and organ-of-state comments. Expressly reserves the right to lodge appeals and take legal action.",
    response:
      "One page, 27 May 2026. Does not answer the enumerated demands item by item; none of the 11 documents were supplied.",
    risk: "Highest-probability appellant.",
  },
  {
    who: "Dirk Poley — Elandsfontein Community Forum",
    standing: "Portion 16, acting for a community body",
    what:
      "Formal objection that the Draft Scoping Report is non-compliant with Regulation 21 and Appendix 2. Asked the authority to reject it and to recommence a 30-day participation period under Regulation 41(2). Reserves the right to supplement.",
    response:
      "3 June 2026 — recommencement refused; content gaps deferred to the Final Scoping Report.",
    risk: "A collective objection: one adverse decision could produce a group appeal.",
  },
  {
    who: "Erika Taljaard — Ward 25 Committee Member",
    standing: "Ward committee, environmental portfolio",
    what:
      "Holds a DFFE letter dated 30 March 2026 recording that a complaint of alleged unlawful oil storage on Portion 45 was formally investigated by Environmental Management Inspectors jointly with the City of Ekurhuleni, that compliance concerns were identified, and that the matter remains under assessment with enforcement still possible. Requested an extension of the comment period.",
    response: "27 May 2026 — extension refused; the compliance matter treated as outside the participation process.",
    risk:
      "The strongest factual foundation for a procedural-fairness challenge. That DFFE letter is not in the project file.",
  },
  {
    who: "The 44 Moonlight Road cluster — Maxie, Jacobus and Quiza Gunter",
    standing: "Direct neighbours and landowners",
    what:
      "Allege prior explosions, currently unacceptable smell and noise, an unlicensed industrial operation running three years, four SAPS visits, and unanswered correspondence to two Ekurhuleni mayors. Maxie Gunter raises SPLUMA s16(1), a 6–8 m water table with sole reliance on groundwater, and prevailing north-westerly winds toward her property.",
    response: "3 June 2026 — recorded, expressly not adjudicated by the EAP.",
    risk: "Technically specific, locally credible, and shares an address cluster with three other registrants.",
  },
];

export const PPP_EVIDENCE = [
  { item: "Background Information Document", status: "missing" as const },
  { item: "Site notice wording and dated photographs", status: "partial" as const, note: "Photographs present but undated" },
  { item: "Newspaper advertisement proof", status: "present" as const },
  { item: "Written notices and proof of delivery / email", status: "missing" as const },
  { item: "I&AP register", status: "present" as const },
  { item: "Comments received", status: "present" as const },
  { item: "Comments and responses report", status: "present" as const },
  { item: "Proof the Final Scoping Report was made available for review", status: "missing" as const },
];

export const AGENTS = [
  { key: "supervisor", name: "Project Supervisor", role: "Decides what needs checking, dispatches the specialists, writes the brief.", cadence: "Daily 06:00 + on demand" },
  { key: "statutory-clock", name: "Statutory Clock", role: "Keeps every deadline anchored to a date the authority actually stated.", cadence: "Every run" },
  { key: "ppp-registrar", name: "Public Participation Registrar", role: "Guards the I&AP register and the integrity of the participation record.", cadence: "While a comment period is open" },
  { key: "comments-responses", name: "Comments & Responses Drafter", role: "Drafts replies to outstanding comments, for a human to check and send.", cadence: "When comments are unanswered" },
  { key: "doc-completeness", name: "Document Completeness", role: "Checks the pack is complete and says the same thing everywhere.", cadence: "Before every submission" },
  { key: "specialist-studies", name: "Specialist Studies Tracker", role: "Tracks the Plan of Study through to delivered reports.", cadence: "Weekly during the EIR phase" },
  { key: "obligation-register", name: "Licence Obligation Register", role: "Turns granted licence conditions into a live compliance calendar.", cadence: "After the licence is issued" },
];
