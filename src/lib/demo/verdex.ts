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

export const VERDEX_AS_AT = "2026-08-08";

export const PROJECT = {
  client: "Verdex (Pty) Ltd",
  registration: "2024/312113/07",
  facility: "Composite plastic board manufacturing facility, Waltloo",
  address: "325 Mundt Street, Waltloo, Pretoria, Gauteng, 0184",
  product: "Composite plastic boards, primarily construction formwork",
  process:
    "Receipt → weighing → inspection → shredding → blending → heating → compression moulding → QC → storage → dispatch",
  routeLabel: "Section 24G rectification + WML, then AEL",
  // Two authorities, not one. The waste side is provincial because the waste is
  // general; the air side is the metro because NEM:AQA puts AEL licensing with
  // the metropolitan municipality. Treating "the competent authority" as a
  // single question is what kept this field unconfirmed for three weeks.
  authority: "GDARD (waste, decided 6 Aug) · City of Tshwane (air, decided 5 Aug)",
  consultant: "Silverline Compliance (Pty) Ltd, reg 2025/816742/07",
} as const;

/** Capacity is the figure that matters, not throughput — GN 921 thresholds are
 *  written against what a facility *can* process, not what it did. */
export const CAPACITY = [
  { label: "Current throughput", value: "10–15 tonnes per week", note: "As reported 22 July" },
  { label: "Design capacity", value: "~30 tonnes per day", note: "In GN 921 Cat A(5)/(6) band" },
  { label: "Absolute press maximum", value: "~2 t/hour ≈ 48 tonnes per day", note: "Still under 100 t/day" },
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

/**
 * The listed activities, read off the gazette rather than described in general
 * terms. GN 921 in GG 37083 of 29 November 2013, as amended by GN 332 (2 May
 * 2014), GN R633 (24 July 2015), GN 1094 (11 October 2017) and GN 1757
 * (11 February 2022).
 *
 * The distinction that does the work here is CATEGORY A versus CATEGORY C.
 * Category A needs a Basic Assessment and a waste management licence — those are
 * the activities the s24G has to rectify. Category C needs compliance with
 * published norms and standards and registration, NOT a licence, so those
 * activities are not part of the unlawful-commencement exposure at all.
 *
 * That matters for the fine: storage from the first feedstock receipt on
 * 5 August 2025 is Category C, so the clock does not start there. It starts with
 * the press, in March 2026.
 */
export type ActivityBearing = "applies" | "excluded-question" | "not-a-licence" | "does-not-apply";

export const LISTED_ACTIVITIES: {
  citation: string;
  category: "A" | "B" | "C";
  wording: string;
  bearing: ActivityBearing;
  note: string;
}[] = [
  {
    citation: "GN 921 Category A(5)",
    category: "A",
    wording:
      "The recovery of waste including the refining, utilisation, or co-processing of waste in excess of 10 tons but less than 100 tons of general waste per day … excluding recovery that takes place as an integral part of an internal manufacturing process within the same premises.",
    bearing: "excluded-question",
    note:
      "Design capacity ~30 t/day and press maximum ~48 t/day sit squarely in the band. Whether the closing exclusion rescues Verdex is the live question — it is precisely the argument the client already makes in writing.",
  },
  {
    citation: "GN 921 Category A(6)",
    category: "A",
    wording:
      "The treatment of general waste using any form of treatment at a facility that has the capacity to process in excess of 10 tons but less than 100 tons per day calculated as a monthly average, excluding the treatment of organic waste using composting and any other organic waste treatment.",
    bearing: "applies",
    note:
      "The one that bites hardest. It says CAPACITY TO PROCESS in terms, which settles the capacity-not-throughput point on the face of the gazette — and it carries NO internal-manufacturing exclusion, only an organic-waste one. A 200–220 °C press is treatment by any ordinary reading.",
  },
  {
    citation: "GN 921 Category A(3)",
    category: "A",
    wording:
      "The recycling of general waste at a facility that has an operational area in excess of 500 m², excluding recycling that takes place as an integral part of an internal manufacturing process within the same premises.",
    bearing: "excluded-question",
    note:
      "Operational area is well over 500 m². Same exclusion as A(5), so it stands or falls with the same argument.",
  },
  {
    citation: "GN 921 Category A(12)",
    category: "A",
    wording:
      "The construction of a facility for a waste management activity listed in Category A of this Schedule.",
    bearing: "applies",
    note:
      "Added to the screening 8 August. It matters because it reaches back further than anything else: physical implementation of the facility began around September 2025, months before the first board. The exact first site-work date has to come from contractor records.",
  },
  {
    citation: "GN 921 Category A(13)",
    category: "A",
    wording:
      "The expansion of a waste management activity or facility where the applicable threshold may be reached or exceeded.",
    bearing: "excluded-question",
    note:
      "Also added 8 August. Twelve shredders are now on site where the original facility had fewer — whether that is an expansion within A(13) turns on the installation history, which is part of the technical pack still to come from Ruhan.",
  },
  {
    citation: "GN 921 Category B(3)",
    category: "B",
    wording:
      "The recovery of waste … at a facility that processes in excess of 100 tons of general waste per day or in excess of 1 ton of hazardous waste per day …",
    bearing: "does-not-apply",
    note:
      "Threshold not met — 48 t/day at the press maximum. This is what keeps the file on BASIC ASSESSMENT rather than Scoping and EIR, and it is worth stating positively in the application.",
  },
  {
    citation: "GN 921 Category C(1)",
    category: "C",
    wording:
      "The storage of general waste at a facility that has the capacity to store in excess of 100 m³ of general waste at any one time, excluding the storage of waste in lagoons or temporary storage of such waste.",
    bearing: "not-a-licence",
    note:
      "~200 t on the floor is comfortably over. But Category C means the Norms and Standards for Storage of Waste (GN R926, GG 37088) and registration — NOT a licence. So storage is not an unlawful commencement, and the fine clock does not run from the first bale.",
  },
  {
    citation: "GN 921 Category C(6)",
    category: "C",
    wording:
      "The sorting, shredding, grinding, crushing, screening or baling of general waste at a waste facility that has an operational area that is 1 000 m² and more.",
    bearing: "not-a-licence",
    note:
      "Also Category C — the Norms and Standards published under GN 1094 (GG 41175). Shredding on its own is therefore not the licensable act; the heat is.",
  },
  {
    citation: "GN 893 Subcategory 8.1 (NEM:AQA)",
    category: "A",
    wording:
      "Category 8: Thermal Treatment of Hazardous and General Waste · Subcategory 8.1 — facilities where general and hazardous waste are treated by the application of heat. Application: all installations treating 10 kg per day of waste.",
    bearing: "applies",
    note:
      "The air side. 10 kg per DAY, not per hour — the press maximum is roughly 200× the threshold. Licensing authority is the City of Tshwane. Carries the full incineration-grade emission suite including dioxins and furans at 0,1 ng I-TEQ/Nm³.",
  },
];

/**
 * The position Silverline actually runs on this file.
 *
 * Not decoration and not a closing paragraph. Verdex went up the waste
 * hierarchy — recovery ahead of landfill — believing they were doing the right
 * thing. That is the professional case, and it is the frame the s24G
 * motivation, the need and desirability chapter, the fine representations and
 * every authority meeting are built on.
 *
 * Its limit matters as much as its strength, which is why WHERE_IT_HELPS is
 * here rather than left to be worked out later: this is mitigation, context and
 * better-outcome logic. It is NOT a route to argue the material is not waste,
 * and it does not avoid the licensing trigger. Used that way it stops being an
 * argument and becomes a credibility problem in front of the same official who
 * has to decide the fine.
 */
export const THE_POSITION = {
  line:
    "Verdex's operation should be viewed in its proper context: it diverts high-calorific-value plastic waste from landfill, advances recovery and circular-economy objectives, converts a problematic waste stream into a useful product, and was implemented in good faith. While this does not remove the need for regulatory compliance, it is highly relevant to the authority's consideration of rectification, mitigation, and the appropriate enforcement response.",
  pillars: [
    {
      title: "Diversion from landfill",
      detail: "Significant volumes of plastic are diverted from disposal.",
    },
    {
      title: "Recovery of value",
      detail:
        "The waste is not merely stored or moved. It is converted into a usable product with value.",
    },
    {
      title: "Alignment with environmental policy",
      detail:
        "The activity sits where the waste hierarchy says it should — recovery ahead of disposal — and supports circular-economy objectives.",
    },
    {
      title: "Good faith",
      detail:
        "Verdex did not set out to evade the law. They pursued a recovery model, believed it was the right thing, and are now regularising it.",
    },
    {
      title: "Better environmental outcome",
      detail:
        "On the evidence, controlled recovery may be environmentally preferable to landfilling high-calorific-value plastic waste.",
    },
  ],
  /** Said plainly, because the same argument is strong in one place and fatal in another. */
  whereItHelps: [
    {
      weight: "Strongest" as const,
      use: "Section 24G motivation · need and desirability · administrative-fine mitigation · authority engagement meetings · the public participation narrative · and the enforcement discretion available to the decision-maker",
    },
    {
      weight: "Moderate" as const,
      use: "Section 22A mitigation narrative and the overall good-faith context",
    },
    {
      weight: "Not a safe use" as const,
      use: "Proving the material is not waste · avoiding the legal trigger · avoiding an AEL where the air trigger is otherwise met",
    },
  ],
  /** Claims become facts only once these exist. */
  evidenceNeeded:
    "Tonnage records, destination evidence, composition and calorific-value support, product output records, and a competent fire-risk assessment — before any of this is put as fact rather than as position.",
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
    kind: "received",
    label: "Ruhan answered the technical checklist",
    detail:
      "Followed at 14:07 by Luaan's full specification of what the site plans must show — locality map at 1:50 000, erf and 21-digit SG code, WGS84 corner coordinates, footprint per listed activity, receiving/inspection/quarantine/storage areas, treatment equipment and rated capacities, impermeable surfaces and bunding, clean/contaminated stormwater separation, process-flow diagram, firewater containment, sensitive receptors and a GIS shapefile.",
  },
  {
    date: "2026-08-05",
    kind: "received",
    label: "The site drawings arrived — and moved three things",
    detail:
      "The erf is 12 243 m², which dissolves the area contradiction. The previous occupier was a HOT-DIP GALVANISING PLANT, which puts contaminated-land history on the file. Coverage sits at 59,97% against a permissible 60% — four square metres of headroom. And the occupancy classification on the drawings does not match the lease.",
  },
  {
    date: "2026-08-05",
    kind: "open",
    label: "AEL decided to be in scope — City of Tshwane",
    detail:
      "Juandre's determination, superseding the provisional reading that an open press points away from thermal treatment. GN 893 Subcategory 8.1 applies to all installations treating 10 kg per day. Emission standards are incineration-grade, including dioxins and furans at 0,1 ng I-TEQ/Nm³.",
  },
  {
    date: "2026-08-06",
    kind: "open",
    label: "Competent authority confirmed as GDARD, working draft remapped to v6",
    detail:
      "General waste, not hazardous, so licensing competence is provincial. The genuine blank DFFE 2016 form was also found on this machine and filled. One caveat survives: v6 is still built on the national structure, and GDARD's own 2021 edition has not been obtained.",
  },
  {
    date: "2026-08-07",
    kind: "open",
    label: "Sequencing decided — waste first, then air",
    detail:
      "Juandre and Waldo, in person. The mandatory-cessation trigger in NEM:AQA s22A(3)(a) fires on the air application, so lodging waste first lets the WML and s24G be decided while the press runs. It is also the only physically possible order: a stack test needs a defined release point.",
  },
  {
    date: "2026-08-07",
    kind: "received",
    label: "Ruhan gave the five dates — the commencement question is closed",
    detail:
      "Shredder first run on production material 10 March 2026. First board pressed 13 March 2026, evidenced by the Verdex LinkedIn post, with a dated video available. First shredder commissioned 9–10 March 2026 (twelve are on site now); first drum screen the week of 2–6 March 2026. The press itself went in over roughly four months, September 2025 to February 2026, with no work during the builder's break of 17 December to 3 January. Also answered: NO extraction is fitted to the press, and the shredder line has no dedicated extraction either. Hours are 06:00–22:00 with a Saturday shift 06:00–15:00, moving to 24 hours within a month or two, and the press runs about 45 minutes in every hour over a 20-hour day at full forecast production.",
  },
  {
    date: "2026-08-08",
    kind: "open",
    label: "Classification settled, and the strategy with it",
    detail:
      "The incoming material is treated as general waste; no relabelling or payment-based feedstock route. A(12) construction and A(13) expansion join A(3), A(5) and A(6) in the screening, and the twelve shredders are assessed as one integrated process on the rated bottleneck rather than by summing nameplates. Commencement is split by activity. Sequencing is revised: both tracks prepared in parallel, controlled pre-application engagement with GDARD and the City of Tshwane, no promise of continued operation.",
  },
  {
    date: "2026-08-08",
    kind: "due",
    label: "Client must decide whether to lodge — letter drafted, not sent",
    detail:
      "Because both routes trigger a cessation direction, lodging is Dewald's commercial decision and he has not been asked. Nothing lodges until he has had the letter and answered. This is the gate everything else queues behind.",
  },
  {
    date: "2027-03-13",
    kind: "due",
    label: "First 12-month cycle of unlicensed operation completes",
    detail:
      "The AIR-side mechanism — GN 332 of 18 March 2016 under NEM:AQA s22A — adds R200 000 for each completed 12-month cycle. Not the s24G fine, which is discretionary on the nine indices under GN R698 and capped by s24G(4) at R10 million — NOT the R5 million the 2018 form still prints, which predates NEMLAA 2 of 2022. The first board was pressed on 13 March 2026, so the first air cycle closes on 13 March 2027.",
  },
];

/** The questions that decide whether there is a matter at all. */
export type LegalState = "blocking" | "open" | "decided";

export const LEGAL_QUESTIONS: {
  question: string;
  state: LegalState;
  why: string;
  /** Set once answered — what the answer is, and what it was decided on. */
  answer?: string;
}[] = [
  {
    question: "Does the incoming sorted and baled plastic remain \"waste\" under NEM:WA?",
    state: "decided",
    why:
      "Everything was downstream of this. Complicated by the client's own signed lease, which calls the input \"plastic waste\" twice — signed by Dewald Muller on 7 February 2025, a year before the regulatory question arose.",
    answer:
      "Treated as GENERAL WASTE — settled on advice, 8 August 2026. Silverline will not advance a relabelling or payment-based \"feedstock\" route. That Verdex pays its suppliers is an indicator only; it does not turn waste into a product. The supplier contracts, invoices, specifications, rejection records, origin and composition are still wanted — as the classification evidence pack, not as a way around the legislation.",
  },
  {
    question: "Which listed waste-management activities and thresholds apply?",
    state: "decided",
    why:
      "Turns on CAPACITY, not throughput — GN 921 thresholds are written against what a facility can process. Design capacity ~30 t/day and press maximum ~48 t/day both sit above 10 t/day and below 100 t/day. Arguing from the ledger totals (a little over a tonne a day) gives the opposite answer and would not survive the first question.",
    answer:
      "Read off GN 921 (GG 37083, 29 Nov 2013) as amended to GN 1757 of 11 Feb 2022. The licensable activities are CATEGORY A — Basic Assessment plus a WML: A(5), recovery of waste including refining, utilisation or co-processing, \"in excess of 10 tons but less than 100 tons of general waste per day\"; A(6), treatment of general waste by any form of treatment where the facility has \"the capacity to process in excess of 10 tons but less than 100 tons per day calculated as a monthly average\"; and A(3), recycling of general waste at a facility with an operational area over 500 m². Category B(3) starts at 100 t/day and does NOT apply, so this is Basic Assessment, not Scoping and EIR. Storage and baling are NOT licensable here: storage of general waste over 100 m³ is Category C(1), and sorting/shredding/baling at 1 000 m² or more is Category C(6) — Category C is compliance with norms and standards, not a licence.",
  },
  {
    question: "Does the \"internal manufacturing process\" exclusion take A(3) and A(5) away?",
    state: "decided",
    why:
      "A(3) and A(5) both end with \"excluding recycling/recovery that takes place as an integral part of an internal manufacturing process within the same premises\". That is exactly what Verdex says it does.",
    answer:
      "Test A(3) and A(5) separately against their exclusions — but the exclusions do NOT reach A(6), which has no equivalent wording. If the material is waste, A(6) remains the working activity and the licence is required regardless. Confirmed on advice, 8 August 2026, independently of Silverline's own reading of the gazette.",
  },
  {
    question: "When did each activity commence?",
    state: "decided",
    why:
      "The fine is calculated off it, and forcing every activity onto one date is what makes a rectification statement fall apart under the first question.",
    answer:
      "Split by activity, and every date disclosed. A(6) treatment and the NEM:AQA Subcategory 8.1 air-side operation are both advanced as 13 March 2026, the first evidenced board. The 10 March shredder run is characterised as commissioning ONLY if the commissioning and production records honestly support that. A(12) construction, if the screening confirms it, reaches back to about September 2025 — the exact first physical-implementation date still has to come from contractor and site records. The application must explain why each date is advanced, not conceal the less favourable ones.",
  },
  {
    question: "Is DFFE or GDARD the competent authority for the waste application?",
    state: "decided",
    why:
      "Determines the form, the fee, the pre-application procedure and who the Section 24G representations are addressed to.",
    answer:
      "GDARD — decided 6 August 2026. The activity classifies as GENERAL waste, not hazardous, and general-waste licensing competence sits with the province rather than with DFFE nationally. Every \"DFFE / GDARD — unconfirmed\" field in the working draft is now GDARD (v6).",
  },
  {
    question: "Does the 200–220 °C press trigger an Atmospheric Emission Licence?",
    state: "decided",
    why:
      "The earlier provisional position was that an open press points away from thermal treatment. That position is superseded.",
    answer:
      "YES — decided 5 August 2026, and Silverline will do it. The listed activity is GN 893 (NEM:AQA s21) Category 8, Subcategory 8.1, \"facilities where general and hazardous waste are treated by the application of heat\", applying to \"all installations treating 10 kg per day of waste\" — note per DAY, not per hour. The licensing authority is the CITY OF TSHWANE, not DFFE and not GDARD, so competent authority was never one question but at least two. Subcategory 8.1 carries the full incineration-grade emission suite including dioxins and furans at 0,1 ng I-TEQ/Nm³ — a stack test with a long lead time and a major cost.",
  },
  {
    question: "Does lodging force the plant to stop?",
    state: "blocking",
    why:
      "This now outranks everything except the classification, and it is the reason the sequencing answer below changed.",
    answer:
      "YES, on both routes. NEM:AQA s22A(3)(a) and — since 30 June 2023 — NEMA s24G(1)(aa)(A) both require the authority to direct immediate cessation when the application is made. s24G carries a narrow exception where stopping would itself cause serious environmental harm; s22A carries none. So lodging is a COMMERCIAL DECISION FOR THE CLIENT rather than a formality. It is blocking because the client has not yet been asked: the letter that puts it to him is drafted and unsent. Nothing lodges before he has had it and answered.",
  },
  {
    question: "In what order do the waste and air applications go in?",
    state: "decided",
    why:
      "The earlier working answer was waste first, so that the WML and s24G could be decided while the press kept running.",
    answer:
      "That answer did not survive the cessation provisions — waste-first does NOT preserve a right to operate, because s24G now triggers a cessation direction of its own. Revised 8 August: prepare both tracks in parallel, hold controlled pre-application engagement with GDARD and the City of Tshwane, and seek coordinated directions, a prompt fine determination and the earliest lawful provisional AEL. Where ceasing a particular waste-side activity would itself cause serious environmental harm, a fact-based s24G exception can be investigated for that activity — there is no equivalent for the hot press.",
  },
  {
    question: "Do the general-waste storage norms or a registration apply?",
    state: "open",
    why:
      "Now narrowed: storage of general waste above 100 m³ at any one time is Category C(1) of GN 921, which means compliance with the Norms and Standards for Storage of Waste (GN R926, GG 37088) and registration — not a licence. Maximum storage was reported at ~300–500 tonnes across indoor and outdoor hardstanding, and the density figure from the drawings now makes the m³ calculable. Still needs the volume in cubic metres and the pre-shred/post-shred split.",
  },
  {
    question: "Which Section 24G form does the authority actually require?",
    state: "open",
    why:
      "Now that GDARD is confirmed, GDARD's own 2021 edition is what applies. A reference to \"S24G Application Form_Gauteng_2021\" was found on SAHRIS but the document itself could not be retrieved — both mirrors were unreachable on 6 August (connection refused on sahris.sahra.org.za, HTTP 403 on sahris.org.za). The current draft (v6) is still built on the national DFFE structure as the best available approximation. The Free State precedent shows a provincial edition can differ materially in structure, not just letterhead.",
  },
  {
    question: "May one combined Section 24G application cover all identified activities?",
    state: "open",
    why: "Affects whether this is one submission or several, and the fine calculation.",
  },
  {
    question: "Which listed activity commenced when?",
    state: "decided",
    why:
      "The fine is calculated off it. Materially narrowed by the GN 921 reading above: because storage and baling are Category C rather than licensable, commencement does NOT run from the first feedstock receipt on 5 August 2025.",
    answer:
      "13 March 2026 — the first board pressed, given by Ruhan on 7 August 2026 and evidenced by the Verdex LinkedIn post of that date, with a dated video available. Shredding on production material began 10 March 2026, which also corrects the file's earlier note of \"January 2026\" by two months. Since the licensable activity is the treatment and recovery at the press, not the storage or the shredding, the s24G commencement date is 13 March 2026 and the first 12-month cycle under GN 332 closes on 13 March 2027.",
  },
];

/** What the client still owes, as sent to Dewald and Ruhan on 27 July. */
export const OUTSTANDING: { section: string; item: string }[] = [
  { section: "Company", item: "Registered applicant confirmation, current CIPC documents and directors" },
  { section: "Company", item: "Authorised application signatory and the resolution giving that authority" },
  { section: "Property", item: "Title deed or lease, landowner details and written consent" },
  { section: "Property", item: "Erf/farm/portion, SG code, zoning, and building, occupancy and fire approvals" },
  { section: "Dates", item: "Per-component commissioning dates for the press train — Ruhan asked whether to break these down or use 13 March 2026 throughout" },
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
    agent: "legal",
    severity: "critical",
    title: "Lodging either application forces the plant to stop",
    detail:
      "NEM:AQA s22A(3)(a) and, since 30 June 2023, NEMA s24G(1)(aa)(A) both require the authority to direct immediate cessation when the application is made. Section 24G has a narrow exception where stopping would itself cause serious environmental harm; section 22A has none. The working plan until 7 August was to lodge waste first so the press could keep running while it was decided — that reasoning does not survive, because s24G now carries a cessation trigger of its own.",
    action:
      "Treat lodging as the client's commercial decision, not a Silverline milestone, and put it to Dewald in writing before anything is prepared for filing. The letter exists and has not gone. Where stopping a particular waste-side activity would itself cause serious environmental harm, a fact-based s24G exception can be investigated for that activity — but there is no equivalent route for the hot press, so the air side stops either way.",
    evidence: [
      { source: "Verdex project timeline", locator: "§2, added 7 August 2026", quote: "BOTH ROUTES CARRY A MANDATORY CESSATION DIRECTION … s24G has a narrow exception where stopping would itself cause serious environmental harm; s22A has none." },
      { source: "Verdex project timeline", locator: "§2", quote: "So lodging is a commercial decision for the client, not a formality, and the client has not yet been told." },
    ],
  },
  {
    agent: "s24g-form",
    severity: "critical",
    title: "Every S24G draft on file is built on a superseded form — including the one already sent",
    detail:
      "All seven drafts in the submissions folder, and the filled copy, use the DFFE 2016 form. That form predates GN R698 of 20 July 2017 and has nowhere to put an entire part of the application: Directives, Deferral, representations on the QUANTUM OF THE FINE, and preliminary advertisement. The current form is S24GAF/04/2018. Draft v6 was attached to the EAP of record on 6 August, so a copy on the wrong structure is already out.",
    action:
      "Rebuild on S24GAF/04/2018. The content carries over — property description, process description, applicant details and the rectification statement were all built from verified sources — but the container does not, and the missing part is the one where the money is. Tell Lucas to set aside what he was sent. Keep trying for GDARD's own edition; both SAHRIS mirrors were unreachable on 6 August.",
    evidence: [
      { source: "05_Submissions — READ THIS FIRST", locator: "8 August 2026", quote: "The DFFE 2016 form predates GN R698 of 20 July 2017 and is missing an entire part of the application — Directives, Deferral, Quantum of the s24G Fine, and Preliminary Advertisement." },
      { source: "05_Submissions — READ THIS FIRST", locator: "8 August 2026", quote: "do not lodge, quote or send any file in this folder, and do not treat the highest version number as the current position." },
    ],
  },
  {
    agent: "air-quality",
    severity: "critical",
    title: "There is no extraction on the press, so there is no release point to test",
    detail:
      "Ruhan confirmed on 7 August that no extraction system is fitted to the press — \"No not yet\" — and that the shredder line has no dedicated extraction either, only general area extractor fans being installed for dust. The press is the Subcategory 8.1 activity. An AEL application has to describe each emission source, its release point and any abatement, and the emission standards are incineration-grade down to dioxins and furans at 0,1 ng I-TEQ/Nm³. None of that can be demonstrated on an unducted press: there is nothing to sample.",
    action:
      "Treat extraction and a stack as a design-and-build item on the critical path for the air application, not a compliance detail to be settled later. It has to be specified, installed and commissioned before a stack test can even be booked, and the test itself has a long lead time. This is the strongest practical argument for the waste-first sequencing already decided — but it also means the air side cannot simply be started later, because the plant does not yet have the thing the application describes.",
    evidence: [
      { source: "Ruhan Rykaart", locator: "7 August 2026, 13:29 — Part B q6", quote: "Is an extraction system fitted to the press? … No not yet" },
      { source: "Ruhan Rykaart", locator: "7 August 2026 — Part B q10", quote: "We do not have focussed extraction dedicated to the shredder, but we are in the process of installing general extractor fans to extract dust from the general area." },
    ],
  },
  {
    agent: "scope",
    severity: "high",
    title: "The move to 24-hour operation lands inside the application window",
    detail:
      "Operating hours are currently 06:00–22:00 with a Saturday shift of 06:00–15:00, but Ruhan says the plant moves to 24-hour operation \"in the next month or two\" — that is, while the s24G and WML are being prepared. Emission limits and the impact assessment are both calculated against hours of operation, and the press is forecast to run 45 minutes in every hour across a 20-hour day. An application describing a 16-hour operation that becomes a 24-hour operation before it is decided is wrong on the day it is lodged.",
    action:
      "Fix the operating pattern that the application will describe, in writing with Verdex, before the technical sections are finalised — and describe the 24-hour case if that is where the plant is going. Changing it afterwards means amending the application or applying again.",
    evidence: [
      { source: "Ruhan Rykaart", locator: "7 August 2026 — Part C q14", quote: "Normal operating hours are 06:00 – 22:00 currently but we will move to 24h operations in the next month or two." },
      { source: "Ruhan Rykaart", locator: "7 August 2026 — Part C q16", quote: "Rough estimate is that the Hot press will run for 45min every hour, 20hours per working day. This is based on full forecasted production." },
    ],
  },
  {
    agent: "legal-classification",
    severity: "info",
    title: "Closed — the material is general waste, and the file is built on that",
    detail:
      "This governed the file from July: if the sorted, baled plastic were a commodity rather than waste there would be no listed activity, no licence and no Section 24G. It is settled as of 8 August. The material is treated as GENERAL waste, and Silverline will not advance a relabelling or payment-based \"feedstock\" route — that Verdex pays its suppliers is an indicator only and does not turn waste into a product. The lease wording, which calls the input \"plastic waste\" twice and was signed by Dewald Muller in February 2025, points the same way.",
    action:
      "Stop treating this as open. The supplier contracts, invoices, specifications, rejection records, origin and composition are still wanted, but as the classification evidence pack rather than as a route around the legislation — and the request to the client should say so, or it reads as though the question is still live.",
    evidence: [
      { source: "Verdex project timeline", locator: "§2, 8 August 2026", quote: "Waldo decided on 8 August 2026 that the incoming material is to be treated as general waste." },
      { source: "Lease, Schedule item 6", locator: "signed 7 February 2025", quote: "Industrial Manufacturing — Converting plastic waste into composite products" },
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
