/**
 * Hillside — Section 24G Fine Appeal + Section 31L Compliance Notice.
 *
 * Built 27 July 2026 from the admin@slco.co.za mailbox (received and sent), the
 * personal Gmail thread Waldo forwarded, the OneDrive project folders and the
 * local document set. Where a figure could only be read off a scanned PDF it was
 * opened and read directly rather than inferred — the R1 250 000 fine, the three
 * statutory clocks and the Chief Director's signature all come off the decision
 * letter itself.
 *
 * This is a fourth shape. Dilex is a licence application on a statutory clock.
 * ClinX is enforcement against a licence already held. Verdex is a rectification
 * being prepared. Hillside is a file where **two DFFE tracks run in parallel
 * against one site** — an appeal to the Minister on the Section 24G fine, and a
 * Section 31L compliance notice that never stopped running. Almost every mistake
 * on this file comes from treating them as one process.
 */

export const HILLSIDE_AS_AT = "2026-07-27";

export const PROJECT = {
  applicant: "Hillside Complex (Pty) Ltd",
  registration: "2021/894606/07",
  project: "Hillside Siding",
  site: "Portion 62 of the Farm Elandspruit 291 JS, Mpumalanga",
  registered: "66 Vorster Avenue, Glenanda, Johannesburg, 2091 · PO Box 1224, Southdale, 2135",
  directors: "E Salkinder · J Janse van Rensburg",
  activity:
    "Coal washing discards. Wastewater lagoons constructed before the Waste Management Licence was issued.",
  reference: "12/9/11/L250207150250/6/N/S24G",
  listedActivities:
    "GN R921 of 2013 Category B — storage of hazardous waste in lagoons (excluding effluent, wastewater or sewage); and construction of a facility for a Category B waste management activity.",
  routeLabel: "S24G appeal + S31L notice",
  consultants:
    "Silverline Compliance (project leads Juandré Cross, Waldo Jansen van Rensburg; support Luaan Rentzke) with Inyathi Yako Sosbozi Consult (Lucas Mahlangu, registered EAP)",
} as const;

/**
 * Four names for one client, across documents that all went to the same
 * regulator. DFFE has already refused a document on this exact ground once.
 */
export const ENTITY_NAMES = [
  {
    name: "Hillside Complex (Pty) Ltd",
    where: "DFFE's applicant of record; the EDMS entity; the appointment letter",
    status: "correct",
  },
  {
    name: "Hillside Siding",
    where: "The project name; also the counterparty on Silverline's retainer proposal",
    status: "project",
  },
  {
    name: "Hill Side Property Limited",
    where: "The letterhead on the appeal motivation actually submitted to the Minister",
    status: "wrong",
  },
  {
    name: "hillsidecomp@gmail.com vs hillsidecomplex@gmail.com",
    where: "Both in use with DFFE; the client corrected the Department once, in November",
    status: "wrong",
  },
] as const;

/** Read off the decision letter itself, not reconstructed from the appeal. */
export const FINE = {
  amount: "R1 250 000.00",
  words: "One million two hundred and fifty thousand rand",
  ceiling: "R5 000 000.00",
  soughtOnAppeal: "R400 000.00",
  atStake: "R850 000",
  decidedBy: "Ms Mishelle Govender, Chief Director: Hazardous Waste Management and Licensing",
  decidedOn: "2026-01-21",
  enquiries: "Mr Matjelele Phaladi · (012) 399 9852 · Mphaladi@dffe.gov.za",
  basis:
    "Section 24G of NEMA read with sections 5, 19 and 20 of NEM:WA and the Schedule to NEM:WA (GN 921 of 29 November 2013, as amended). The Department's joint national/provincial Section 24G penalty calculator protocol was used.",
  clocks: [
    {
      window: "14 days",
      what: "Representations to the Department, or a request for reasons, on the amount of the fine or on payment",
      by: "~2026-02-04",
    },
    {
      window: "30 days",
      what: "Appeal to the Minister under section 43(1) of NEMA — the power to issue the fine was delegated",
      by: "~2026-02-20",
    },
    {
      window: "60 days",
      what: "Payment of the fine in full into the Department's account",
      by: "~2026-03-22",
    },
  ],
  consequence:
    "If the Department receives neither payment within 60 days nor contact within that period — representations, a request for more time, or an appeal on quantum — the Section 24G application file is closed. Closure means the activity remains illegal.",
  gate:
    "A decision on the Section 24G application is not finalised until the money is in the account. Only on payment in full does the Department consider the reports and merits and decide whether to grant the licence.",
} as const;

/** The 17 July request. Four items, none of them delivered. */
export const DFFE_REQUEST = [
  {
    item: "Transfer the Appeal Letter Hillside content into the first column of the Appeal Response Report, under Grounds of Appeal",
    status: "outstanding",
    note: "Column 1 currently holds only the pre-printed line “1. Quantum of the fine”. Rows 2–5 are empty.",
  },
  {
    item: "Provide DFFE with an MS Word version of the ARR",
    status: "outstanding",
    note: "Only a PDF has ever been sent. The Department needs an editable file to add its own columns.",
  },
  {
    item: "Attach the email of 11 February 2026 sent to Appeals@environment.gov.za",
    status: "held",
    note: "In the Sent Items of admin@slco.co.za. Can be forwarded immediately.",
  },
  {
    item: "Attach the email notifying Hillside of the Chief Director's decision of 21 January 2026",
    status: "missing",
    note: "The decision letter itself is held, but the covering email is not in Silverline's mailbox. It must come from the client or from Inyathi.",
  },
] as const;

/**
 * The defects in what was actually filed on 11 February. These are the reason
 * the appeal sat for five months and the reason DFFE is now asking for it again.
 */
export const APPEAL_DEFECTS = [
  {
    defect: "The Appeal Response Report was submitted blank",
    detail:
      "Pages 1 and 2 were completed — project name, site, reference, the two decision dates, appellant and applicant details. Page 3, which is the appeal, was not. The Grounds of Appeal column contains only the pre-printed “1. Quantum of the fine”; the Responding Statement column is empty; the report is unsigned.",
    consequence:
      "DFFE's own reading, five months later: “It seems the appeal was initially submitted on 11 Feb 2026 but not on the correct form.”",
  },
  {
    defect: "The motivation went in on the wrong entity's letterhead",
    detail:
      "The appeal letter is headed “Hill Side Property Limited”, Bronkhorstspruit, Gauteng 1020 — not Hillside Complex (Pty) Ltd, Glenanda, Johannesburg, which is the applicant DFFE recognises. It also places the site in “Elandspruit, Mpumalanga” under a Gauteng address block.",
    consequence:
      "DFFE refused a Silverline notification two months earlier on precisely this ground. Lucas Mahlangu had flagged it in writing on 9 February: the motivation letter “must be on the applicant's letterhead”.",
  },
  {
    defect: "The reduction sought sits below our own stated floor",
    detail:
      "The appeal asks for R400 000. Inyathi's 14 October letter to the client says “the minimum fine typically imposed is R500 000”, and Silverline's own risk assessment puts the Section 24G range at R500 000 – R10 million. No reasoning is given in the appeal for going below that floor.",
    consequence:
      "An unreasoned number invites the Department to substitute its own. If the figure is right, the ARR is the place to justify it.",
  },
  {
    defect: "A mitigation claim that the Department can test against its own file",
    detail:
      "The motivation states the non-compliance was voluntarily disclosed and that the company “did not wait for enforcement action or external detection”. The same site is subject to a Section 31L compliance notice. Nothing on file establishes whether that notice pre-dates or post-dates the 5 February 2025 rectification application.",
    consequence:
      "Verify the sequence from the compliance notice itself before this claim is repeated in the ARR. If the notice came first, the sentence is worse than useless.",
  },
] as const;

export type ClockKind = "decision" | "submitted" | "received" | "open" | "due" | "risk";

export type ClockEvent = {
  date: string;
  track: "S24G" | "S31L" | "Both";
  kind: ClockKind;
  label: string;
  detail: string;
};

export const TIMELINE: ClockEvent[] = [
  {
    date: "2025-02-05",
    track: "S24G",
    kind: "submitted",
    label: "Rectification application made to DFFE",
    detail:
      "The application that opened reference 12/9/11/L250207150250/6/N/S24G. DFFE's own ARR template mislabels this date as “DATE PROJECT/ACTIVITY AUTHORISED” — the decision letter is clear that it is the date the rectification application was made.",
  },
  {
    date: "2025-10-14",
    track: "S24G",
    kind: "open",
    label: "Inyathi advises the client on the road ahead",
    detail:
      "Lucas Mahlangu to Dian Oosthuizen: operations may continue until a formal directive issues; the fine is payable within 60 days or may be appealed; “the minimum fine typically imposed is R500,000”; once paid, the licence usually follows within days.",
  },
  {
    date: "2025-10-20",
    track: "S31L",
    kind: "received",
    label: "Element's contamination assessment lands",
    detail:
      "EWS25-320, Hillside Siding Contamination Assessment [VERSION 2 FINAL], by Elemental Water Services — the report required under instruction 6.3 of the compliance notice. 93 pages.",
  },
  {
    date: "2025-10-21",
    track: "Both",
    kind: "risk",
    label: "Silverline and Inyathi red-flag the Element report",
    detail:
      "Consultant Commentary and Risk Assessment IC-SC/HS-01 FINAL 1, authored by Lucas Mahlangu, edited by Waldo Jansen van Rensburg and Juandré Cross. Fifteen risk areas. Conclusion: the report “cannot be submitted in its current form without substantial risk to the client”. Client told to hold all further submissions; Fine Committee meeting noted for 3 November.",
  },
  {
    date: "2025-10-29",
    track: "S24G",
    kind: "open",
    label: "Strategy set with the client",
    detail:
      "Silverline to JP: once the matter reaches the fine committee, submit nothing further; focus on finalising and settling the fine; submit the remaining supporting information afterwards as part of the licence application.",
  },
  {
    date: "2025-11-05",
    track: "S31L",
    kind: "received",
    label: "DFFE approves the specialist team and action plan",
    detail:
      "Conny Seroba (EMI Grade 2) resends the approval letter for the specialist team composition and the action plan submitted under instruction 6.2 of the compliance notice. The approved specialists are Element-S's. Acknowledged by JP on 6 November.",
  },
  {
    date: "2025-11-07",
    track: "S24G",
    kind: "submitted",
    label: "Silverline notifies DFFE that Inyathi is appointed EAP",
    detail:
      "Sent by admin@slco.co.za to Phumudzo Mavhunga, Directorate: Licensing, cc the client.",
  },
  {
    date: "2025-11-13",
    track: "S24G",
    kind: "risk",
    label: "DFFE refuses the appointment notification",
    detail:
      "Mavhunga: it was not sent by the applicant, it is not on the applicant's letterhead, and it must be accompanied by proof of EAPASA registration for the appointed EAP. Three defects, one of which recurs on the appeal three months later.",
  },
  {
    date: "2025-12-18",
    track: "S24G",
    kind: "submitted",
    label: "Appointment letter re-sent",
    detail:
      "Luaan resends with the signed appointment letter attached. Lucas's reply the same evening: “The doc looks fine and hope must now be accepted unless they have vendetta against us.” No acceptance from DFFE Licensing appears anywhere on file.",
  },
  {
    date: "2026-01-21",
    track: "S24G",
    kind: "decision",
    label: "The fine — R1 250 000",
    detail:
      "Ms Mishelle Govender, Chief Director: Hazardous Waste Management and Licensing, imposes an administrative fine of R1 250 000 against a statutory ceiling of R5 000 000, calculated on the Department's Section 24G penalty calculator. Fourteen days for representations, thirty for an appeal to the Minister, sixty for payment.",
  },
  {
    date: "2026-02-09",
    track: "S24G",
    kind: "open",
    label: "Inyathi sends the appeal pack",
    detail:
      "Lucas to Dian and Waldo, three attachments: the motivation letter (“must be on the applicant's letterhead, and please check the correctness of the information in line with the facility”), the Appeal Form “that must be filled by the applicant, it is straightforward”, and the fine letter. He gives the deadline as “20 days, which is Wednesday this week” — the decision letter says thirty.",
  },
  {
    date: "2026-02-11",
    track: "S24G",
    kind: "submitted",
    label: "Appeal submitted to the Minister",
    detail:
      "admin@slco.co.za to Appeals@environment.gov.za, cc the client, Greenlaw, Inyathi and Van Zyl Johnson. Three attachments: the blank Appeal Form, the motivation on Hill Side Property Limited letterhead, and the fine letter. Day 21 of the 30-day window.",
  },
  {
    date: "2026-03-26",
    track: "S24G",
    kind: "submitted",
    label: "First follow-up to the Minister",
    detail: "No acknowledgement had been received in the six weeks since submission.",
  },
  {
    date: "2026-04-01",
    track: "S31L",
    kind: "risk",
    label: "DFFE: the 6.3 report is overdue, and inspection is set",
    detail:
      "Seroba to JP — the timeframe for the instruction 6.3 report has already lapsed; failure to comply with a compliance notice is a criminal offence (paragraph 11 of the notice). A site verification inspection is set for 8 April at 10:00 by EMIs Brenden Perumal and Conny Seroba.",
  },
  {
    date: "2026-04-07",
    track: "S31L",
    kind: "submitted",
    label: "Client answers; Silverline announces the takeover",
    detail:
      "JP replies that Hillside had “intentionally awaited the finalisation of the Section 24G application process” before proceeding with certain compliance requirements, attaches Element's contamination report under instruction 6.3, and asks for a two-week extension. Separately, Luaan tells the Department that Silverline has taken over from Element-S.",
  },
  {
    date: "2026-04-08",
    track: "S31L",
    kind: "risk",
    label: "DFFE cancels the inspection and signals escalation",
    detail:
      "Seroba: the compliance notice stands with its timeframes; Hillside did not use paragraphs 7–10 of the notice to vary the timeframes or to object; replacing the approved Element-S specialists with Silverline is not a substitution the Department accepts informally. The inspection is cancelled and “the Department will issue an official Departmental decision letter to notify Hillside of the next enforcement process.” Section 49A(1)(k) is restated.",
  },
  {
    date: "2026-04-09",
    track: "S31L",
    kind: "open",
    label: "Waldo's five recommendations",
    detail:
      "Ask Lucas to advise urgently on separating the Section 24G process from the Section 31L notice; meet Michelle (Mishelle Govender) with Grant or Frances; obtain written instruction authorising the Silverline takeover; review the notice, action plan and specialist approvals still sitting with Element-S; prepare the engagement that regularises the position. Nothing on file records any of the five being done.",
  },
  {
    date: "2026-07-07",
    track: "S24G",
    kind: "submitted",
    label: "Second follow-up to the Minister",
    detail:
      "Copied this time to appeals@dffe.gov.za and to R Tlhoaele directly — which is what finally moved the file.",
  },
  {
    date: "2026-07-13",
    track: "S24G",
    kind: "received",
    label: "DFFE routes the appeal internally",
    detail:
      "Joshua Makhaza to Realeboga Tlhoaele: acknowledge receipt and allocate on the weekly report — “It seems the appeal was initially submitted on 11 Feb 2026 but not on the correct form.” Nosipho Nombewu is asked to initiate the appeal on EDMS under Hillside Complex (Pty) Ltd.",
  },
  {
    date: "2026-07-17",
    track: "S24G",
    kind: "due",
    label: "The appeal administrator's request",
    detail:
      "Realeboga Tlhoaele, Appeals and Legal Review: transfer the Appeal Letter content into column one of the ARR under Grounds of Appeal, return the ARR in MS Word, and attach both the 11 February email and the email notifying the 21 January decision.",
  },
  {
    date: "2026-07-27",
    track: "Both",
    kind: "risk",
    label: "Today — both tracks open",
    detail:
      "Ten days since the appeal administrator asked, with no reply sent. One hundred and ten days since the Department said it would issue a decision on the next enforcement step, with nothing received and no evidence the position was regularised.",
  },
];

/** The parallel track. This is where the criminal exposure sits. */
export const S31L = {
  instrument: "Section 31L compliance notice, NEMA",
  status: "In force. Never varied, never objected to, never withdrawn.",
  instructions: [
    {
      ref: "Instruction 6.2",
      what: "Action plan and specialist team composition",
      state:
        "Submitted and approved by DFFE on 5 November 2025, acknowledged by the client on 6 November. The approved specialists are Element-S's, not Silverline's.",
    },
    {
      ref: "Instruction 6.3",
      what: "Contamination impact assessment and rehabilitation plan",
      state:
        "Timeframe lapsed before submission. Element's report was submitted on 7 April 2026 — the same report Silverline's own risk assessment said could not be submitted as it stood.",
    },
    {
      ref: "Paragraphs 7–10",
      what: "The procedure for varying timeframes or objecting to the notice",
      state:
        "Never used. This is the specific failure DFFE relies on in refusing to accept the change of consultant.",
    },
    {
      ref: "Paragraph 11",
      what: "Section 49A(1)(k) of NEMA — failure to comply with a section 31L notice is an offence",
      state: "Cited by DFFE to the client twice, on 1 April and again on 8 April 2026.",
    },
  ],
  openRisk:
    "DFFE said on 8 April that it would issue a decision letter setting out the next enforcement process. Nothing has arrived in the Silverline mailbox in the 110 days since. Either it has not been issued, or it went to the client or to Element-S and has not reached us.",
} as const;

export const PEOPLE = [
  {
    name: "Ms Mishelle Govender",
    role: "Chief Director: Hazardous Waste Management and Licensing, DFFE",
    note: "Signed the R1.25m fine on 21 January 2026. The “Michelle” Waldo proposed meeting in April.",
  },
  {
    name: "Realeboga Tlhoaele",
    role: "Appeals and Legal Review, DFFE · 012 399 8733",
    note: "The appeal administrator since 17 July. The one person now waiting on us.",
  },
  {
    name: "Joshua Makhaza",
    role: "DFFE Appeals",
    note: "Allocated the appeal and identified that it was not on the correct form.",
  },
  {
    name: "Nosipho Nombewu",
    role: "DFFE Appeals",
    note: "Asked to initiate the appeal on EDMS under Hillside Complex (Pty) Ltd.",
  },
  {
    name: "Ms Monaga Conny Seroba",
    role: "Environmental Management Inspector Grade 2, Enforcement — Environmental Impact and Pollution",
    note: "Runs the Section 31L notice. Cancelled the April inspection and signalled escalation.",
  },
  {
    name: "Mr Brenden Perumal",
    role: "Environmental Management Inspector Grade 2, DFFE",
    note: "Was to conduct the 8 April site verification with Seroba.",
  },
  {
    name: "Mr Phumudzo Morris Mavhunga",
    role: "Directorate: Licensing, DFFE",
    note: "Refused the EAP appointment notification on 13 November 2025. No acceptance since.",
  },
  {
    name: "Mr Matjelele Phaladi",
    role: "DFFE · (012) 399 9852",
    note: "Named for enquiries on the fine decision.",
  },
  {
    name: "JP Janse van Rensburg",
    role: "Shareholder and Director, Hillside Complex (Pty) Ltd",
    note: "Signs for the applicant; corresponds with DFFE directly from hillsidecomp@gmail.com.",
  },
  {
    name: "Dian Oosthuizen",
    role: "Van Zyl Johnson",
    note: "The client's adviser; the route through which most instructions reach Silverline.",
  },
  {
    name: "Lucas Mahlangu",
    role: "Registered EAP, Inyathi Yako Sosbozi Consult",
    note: "Authored the risk assessment and the appeal pack. Appointment still not accepted by DFFE Licensing.",
  },
  {
    name: "Elemental Water Services (Element-S)",
    role: "Displaced consultants",
    note: "Melissa Pillay, du Toit. Still the specialists approved under the compliance notice.",
  },
] as const;

export const DOCUMENTS = [
  {
    name: "WML Hillside Complex Proprietary Limited (9).pdf",
    note: "The 21 January 2026 fine decision, 3 pages, scanned. Read directly for this mission — it is the source of every figure and clock above.",
    held: true,
  },
  {
    name: "Appeal Letter Hillside.pdf",
    note: "The motivation submitted 11 February, on Hill Side Property Limited letterhead. Its nine sections are the raw material for the ARR's Grounds of Appeal column.",
    held: true,
  },
  {
    name: "Appeal Form.pdf",
    note: "The Appeal Response Report. Submitted blank on 11 February and returned to us blank by DFFE on 17 July.",
    held: true,
  },
  {
    name: "Appeal Form.docx",
    note: "The editable ARR, in the 9 February pack from Inyathi. This is the file DFFE is asking for in Word.",
    held: true,
  },
  {
    name: "Inyathi HILLSIDE APPEAL 1.docx",
    note: "Inyathi's draft motivation, in the same 9 February pack.",
    held: true,
  },
  {
    name: "Risk Assessment Hillside V2.pdf",
    note: "Consultant Commentary and Risk Assessment IC-SC/HS-01, 21 October 2025. Fifteen risk areas against Element's report.",
    held: true,
  },
  {
    name: "HILLSIDE APPOINTMENT LETTER.pdf",
    note: "Three versions on file dated 5, 6 and 7 November 2025. Two are on the applicant's letterhead with the registration number; one is not.",
    held: true,
  },
  {
    name: "Silverline Proposal - Hillside.pdf",
    note: "24-month compliance retainer, R50 000 per month excluding VAT, dated 27 January 2026. Both signature blocks blank in the copy on file.",
    held: true,
  },
  {
    name: "The Section 31L compliance notice itself",
    note: "Referenced constantly — paragraphs 7–10, instruction 6.2, 6.3, paragraph 11 — but no copy is in the Silverline mailbox or project folders. Seroba attached it to the client on 1 April.",
    held: false,
  },
  {
    name: "The email notifying the 21 January decision",
    note: "Requested by DFFE on 17 July. Not in Silverline's mailbox; it reached the client or Inyathi, not us.",
    held: false,
  },
  {
    name: "DFFE's decision letter on the next enforcement process",
    note: "Promised on 8 April 2026. Not received.",
    held: false,
  },
  {
    name: "EWS25-320 Contamination Assessment [VERSION 2 FINAL]",
    note: "Element's 93-page report. Seen in a forwarded Gmail thread; not filed in the Silverline project folder.",
    held: false,
  },
] as const;

export const FINDINGS = [
  {
    agent: "appeals-tracker",
    severity: "critical" as const,
    title: "The appeal administrator's request is ten days old and unanswered",
    detail:
      "After five months of silence, DFFE allocated the appeal to Realeboga Tlhoaele and asked for four specific things on 17 July. A search of Sent Items shows nothing has gone to that address since 7 July. Three of the four items are within Silverline's control today: the ARR content, the Word version, and the 11 February email. This is the only thing standing between the appeal and adjudication.",
    action:
      "Draft the ARR from the nine sections of the appeal motivation, return it in Word with the two emails attached, and copy Makhaza and Nombewu so the EDMS record is opened under the right entity.",
    evidence: [
      {
        source: "R Tlhoaele, DFFE Appeals and Legal Review",
        locator: "17 July 2026, 08:43",
        quote:
          "We kindly request that you transfer the Appeal Letter Hillside information to the first column of the Appeal Response Report (ARR) under Grounds of Appeal and provide us with a MS Word version of the ARR.",
      },
      {
        source: "admin@slco.co.za Sent Items",
        locator: "recipient rtlhoaele@dffe.gov.za",
        quote: "Last message sent 7 July 2026. Nothing after the 17 July request.",
      },
    ],
  },
  {
    agent: "enforcement-watch",
    severity: "critical" as const,
    title: "The Section 31L track has been silent for 110 days after DFFE signalled escalation",
    detail:
      "On 8 April the Department cancelled the site verification, refused to accept the informal substitution of Silverline for Element-S, and said it would issue a decision letter setting out the next enforcement process. It restated that failure to comply with a section 31L notice is an offence under section 49A(1)(k) of NEMA. Nothing has been received since. This track carries criminal exposure; the appeal only carries money.",
    action:
      "Establish whether the decision letter has issued — ask Seroba directly, and ask the client whether anything arrived at hillsidecomp@gmail.com. Then close out Waldo's five April recommendations, starting with written authority for the takeover.",
    evidence: [
      {
        source: "C Seroba, DFFE Enforcement",
        locator: "8 April 2026",
        quote:
          "the site verification inspection is therefore cancelled, and the Department will issue an official Departmental decision letter to notify Hillside of the next enforcement process.",
      },
      {
        source: "C Seroba, DFFE Enforcement",
        locator: "1 April 2026",
        quote:
          "Please be reminded that failure to compliance Notice is a criminal offence, refer to paragraph 11 of the Compliance Notice.",
      },
    ],
  },
  {
    agent: "submission-auditor",
    severity: "critical" as const,
    title: "What was filed on 11 February was a blank appeal form",
    detail:
      "The Appeal Response Report submitted to the Minister has pages 1 and 2 completed and page 3 — the appeal itself — empty but for the pre-printed heading “1. Quantum of the fine”. The Responding Statement column is blank and the form is unsigned. The copy DFFE returned on 17 July is the same document. Five months passed before anyone at the Department read it closely enough to say so.",
    action:
      "When the ARR is redrafted, complete every row and have the applicant's representative initial each page as the form requires. Treat the blank submission as the cause of the delay, not as bad luck.",
    evidence: [
      {
        source: "Appeal Form.pdf, attached to the 11 February 2026 submission",
        locator: "page 3, Grounds of Appeal",
        quote: "1. Quantum of the fine · 2. · 3. · 4. · 5.",
      },
      {
        source: "J Makhaza, DFFE",
        locator: "13 July 2026",
        quote:
          "It seems the appeal was initially submitted on 11 Feb 2026 but not on the correct form.",
      },
    ],
  },
  {
    agent: "document-control",
    severity: "high" as const,
    title: "The motivation went to the Minister on a third entity's letterhead",
    detail:
      "The applicant is Hillside Complex (Pty) Ltd of Glenanda, Johannesburg. The letter is headed Hill Side Property Limited of Bronkhorstspruit, Gauteng — the same town and postal code as Inyathi's own address, which suggests the letterhead was built from a template rather than supplied by the client. DFFE refused a Silverline document on this exact ground on 13 November 2025, and Lucas warned about it in writing on 9 February.",
    action:
      "Reissue the motivation on Hillside Complex (Pty) Ltd letterhead carrying registration 2021/894606/07, signed by JP Janse van Rensburg, and align every document to the single applicant name before anything else goes to the Department.",
    evidence: [
      {
        source: "Appeal Letter Hillside.pdf",
        locator: "letterhead",
        quote: "Hill Side Property Limited · Bronkhorstspruit, Gauteng, 1020",
      },
      {
        source: "P Mavhunga, DFFE Directorate: Licensing",
        locator: "13 November 2025",
        quote:
          "we are unable to accept it, as it was not sent by the applicant, Hillside Complex Proprietary Limited, nor is it on the applicant's letterhead.",
      },
      {
        source: "L Mahlangu, Inyathi",
        locator: "9 February 2026",
        quote:
          "The motivation letter to the Minister must be on the applicant's letterhead, and please check the correctness of the information in line with the facility.",
      },
    ],
  },
  {
    agent: "quantum-analyst",
    severity: "high" as const,
    title: "R400 000 is asked for without reasoning, and below our own stated floor",
    detail:
      "The fine is R1 250 000 against a ceiling of R5 000 000, calculated on the Department's penalty calculator. The appeal asks for R400 000 — below the R500 000 Inyathi told the client is the typical minimum, and below the floor of the R500 000 – R10 million range in Silverline's own risk assessment. The motivation gives no basis for the figure.",
    action:
      "Either justify R400 000 against the penalty calculator's own factors in the ARR, or move to a defensible number. Ask Mr Phaladi for the calculator breakdown — the letter names him for exactly this.",
    evidence: [
      {
        source: "DFFE decision letter",
        locator: "21 January 2026, page 2",
        quote:
          "an administrative fine of R1 250 000.00 (One million two hundred and fifty thousand rand) is imposed on you",
      },
      {
        source: "Inyathi letter to Dian Oosthuizen",
        locator: "14 October 2025",
        quote: "The minimum fine typically imposed is R500,000",
      },
    ],
  },
  {
    agent: "risk-reviewer",
    severity: "high" as const,
    title: "The report submitted under instruction 6.3 is the one we said could not be submitted",
    detail:
      "Silverline and Inyathi reviewed Element's contamination assessment on 21 October 2025 and raised fifteen risk areas — no downgradient control borehole, no QA/QC or laboratory certificates, no waste classification justification, no conceptual site model, no measurable rehabilitation acceptance criteria, and a timeline that fails the 60-day directive. The conclusion was explicit. On 7 April the client sent that same Element report to DFFE under instruction 6.3.",
    action:
      "Establish whether the corrected addendum was ever produced. If it was not, the compliance notice is answered by a document we have already documented as inadequate — and that document is now in the Department's hands.",
    evidence: [
      {
        source: "Consultant Commentary and Risk Assessment IC-SC/HS-01",
        locator: "21 October 2025, section 7",
        quote:
          "The EWS report provides a useful baseline but cannot be submitted in its current form without substantial risk to the client.",
      },
      {
        source: "JP Janse van Rensburg to C Seroba",
        locator: "7 April 2026",
        quote:
          "The attached Contamination Impact Assessment and Rehabilitation Plan was compiled by Elemental Water Services for the Hillside Siding in compliance with Section 6.3 of the Section 31L Compliance Notice.",
      },
    ],
  },
  {
    agent: "mandate-checker",
    severity: "high" as const,
    title: "Inyathi's appointment was never accepted by DFFE Licensing",
    detail:
      "Mavhunga refused the November notification on three grounds: not from the applicant, not on the applicant's letterhead, and no EAPASA registration proof for the EAP. Luaan re-sent the appointment letter on 18 December. There is no acceptance anywhere on file, and no record that EAPASA proof was ever attached. Inyathi is the party dealing with the Section 24G on the client's behalf.",
    action:
      "Re-serve the notification from the applicant, on the applicant's letterhead, with Lucas's EAPASA certificate attached, and get written confirmation of acceptance onto the file.",
    evidence: [
      {
        source: "P Mavhunga, DFFE",
        locator: "13 November 2025",
        quote:
          "such notification must be accompanied by proof of the Environmental Assessment Practitioners Association of South Africa (EAPASA) registration for the appointed EAP",
      },
      {
        source: "L Mahlangu, Inyathi",
        locator: "18 December 2025",
        quote: "The doc looks fine and hope must now be accepted unless they have vendetta against us",
      },
    ],
  },
  {
    agent: "records-auditor",
    severity: "medium" as const,
    title: "Two documents DFFE relies on are not in Silverline's possession",
    detail:
      "The Section 31L compliance notice is cited throughout — paragraphs 7 to 10, instructions 6.2 and 6.3, paragraph 11 — but no copy exists in the mailbox or the project folders. Neither does the covering email that notified the client of the 21 January decision, which DFFE has now asked us to produce. Both sit with the client or with Element-S.",
    action:
      "Request both from JP and from Dian today. The compliance notice in particular cannot be managed from other people's summaries of it.",
    evidence: [
      {
        source: "R Tlhoaele, DFFE",
        locator: "17 July 2026",
        quote:
          "please attach your email of 11 February 2026 ... as well as the email notifying you of the Chief Director: Hazardous Waste Management and Licensing's decision of 21 January 2026.",
      },
      {
        source: "admin@slco.co.za, all folders",
        locator: "January–February 2026",
        quote: "No DFFE correspondence on Hillside in the mailbox between 18 December and 11 February.",
      },
    ],
  },
  {
    agent: "commercial-watch",
    severity: "medium" as const,
    title: "The retainer is unsigned and the billing chain runs through a third party",
    detail:
      "The 24-month retainer proposal of 27 January 2026 puts Hillside Siding at R50 000 per month excluding VAT — R1.2 million over the term — and both signature blocks are blank in the copy on file. The only Hillside invoice found is Inyathi's #007981 of the same date, R10 000 for “Hillside Siding Compliance Reporting”, billed to Greenlaw Consult rather than to Hillside or Silverline.",
    action:
      "Confirm whether the retainer was ever executed and on what terms, and establish who is contracting with whom before further work is booked against this file.",
    evidence: [
      {
        source: "Silverline Proposal - Hillside.pdf",
        locator: "27 January 2026, section 12",
        quote: "SIGNED FOR AND ON BEHALF OF HILLSIDE SIDING — Name: ____ Date: ____",
      },
      {
        source: "Inyathi Consult invoice 007981",
        locator: "27 January 2026",
        quote: "TO Greenlaw Consult · Hillside Siding Compliance Reporting · R 10,000.00",
      },
    ],
  },
  {
    agent: "deadline-analyst",
    severity: "medium" as const,
    title: "The 60-day payment window closed four months ago; the appeal is what holds the file open",
    detail:
      "Payment fell due around 22 March 2026, 127 days ago. The decision letter closes the Section 24G file only where the Department receives neither payment within 60 days nor contact within that period — and an appeal on quantum is one of the qualifying contacts. The 11 February appeal was lodged inside the window, so the saving condition was met. That reading has never been put to the Department in writing, and no acknowledgement of it exists.",
    action:
      "State the position expressly in the ARR covering letter and ask DFFE to confirm the file remains open pending the Minister's decision. Do not leave it as an assumption.",
    evidence: [
      {
        source: "DFFE decision letter",
        locator: "21 January 2026, page 3",
        quote:
          "should the Department not receive payment of the fine within the 60 days provided and you failed to contact the Department within that time period ... your section 24G application file will be closed. Closure of your Section 24G application denotes that the activity will remain illegal.",
      },
      {
        source: "DFFE decision letter",
        locator: "21 January 2026, page 2",
        quote:
          "a decision on your Section 24G application will not be finalised until such time, the money is deposited in the above-mentioned account.",
      },
    ],
  },
];
