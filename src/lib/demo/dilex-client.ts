/**
 * Dilex Inland, Elandsfontein WML — what the CLIENT sees.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ THIS FILE IS WRITTEN, NOT FILTERED.                                       │
 * │                                                                           │
 * │ Same rule as verdex-client.ts, and for the same reason. It would be       │
 * │ easier to import ./dilex and hide the fields we did not want shown. That  │
 * │ is exactly the mistake: a filter is one forgotten field away from         │
 * │ publishing our own corrections to our own record, and a reader of this    │
 * │ file could not tell what is safe without going and reading the other one. │
 * │                                                                           │
 * │ NEVER import from ./dilex into this file, and never import this file      │
 * │ into an internal page.                                                    │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * What is deliberately NOT here, and must not be added:
 *   · fees, invoices, disbursements or who paid what — the client has their
 *     own copy and a status page is not the place for money
 *   · our corrections to our own record: the scoping submission date, the
 *     register's empty acknowledgement column, the cover-letter placeholders,
 *     the site-notice contact, document control in the annexure pack. Those
 *     are being carried into the EIR phase and settled with the Department
 *     directly. They are on the internal file and they stay there.
 *   · the POPIA consent point on one participant — handled by not corresponding
 *     with her electronically again; it does not belong on a client screen
 *   · which arguments we rate and how strongly, and anything about the
 *     enforcement matter beyond what the client already knows
 *
 * What IS here that is uncomfortable, and belongs here: the groundwater
 * baseline, the contaminated-land baseline and the watercourse survey. Those
 * are the client's decisions and the client's money, and a status page that
 * hides the recommendations is not a status page.
 */

export const DILEX_CLIENT_AS_AT = "2026-08-10";

/** The brief. */
export const CLIENT_PROJECT = {
  client: "Dilex Inland (Pty) Ltd",
  facility: "Elandsfontein Waste Treatment Facility",
  description:
    "Hazardous waste treatment, recovery, recycling and transfer facility",
  property: "Portion 45 of the Farm Elandsfontein 412 JR",
  extent: "8,5654 ha (85 654 m²)",
  municipality: "City of Ekurhuleni · Ward 25 · Kempton Park",
  work: "Waste Management Licence — Scoping and Environmental Impact Reporting",
  authority: "DFFE — Directorate: Licensing",
  reference: "12/9/11/L260513113929/3/N",
  eap: "Lucas Mahlangu — EAPASA 2021/4461",
  contact: "Luaan Rentzke · luaan@slco.co.za",
} as const;

/**
 * Plain-language stage. The client should be able to tell where the work is
 * without knowing what a listed activity is.
 */
export const STAGES: {
  label: string;
  state: "done" | "current" | "next";
  detail: string;
}[] = [
  {
    label: "Application lodged and registered",
    state: "done",
    detail:
      "The Waste Management Licence application was lodged with the national Department and a reference number issued. The Department confirmed the application and appointed a case officer.",
  },
  {
    label: "Public participation — scoping round",
    state: "done",
    detail:
      "Site notice placed, newspaper advertisement run, stakeholder letters issued, and twenty-one interested and affected parties registered and acknowledged. Every comment received was responded to in writing and carried into the Comments and Responses Report.",
  },
  {
    label: "Scoping Report accepted by the Department",
    state: "done",
    detail:
      "The Final Scoping Report and Plan of Study were accepted on 16 July 2026, subject to seven conditions. Acceptance is the gate that authorises the impact assessment phase — the application has cleared it.",
  },
  {
    label: "Impact assessment phase — where we are now",
    state: "current",
    detail:
      "The specialist work and the impact assessment report are in preparation, alongside a municipal consent use application to the City of Ekurhuleni. The draft report goes to the Department inside a thirty-day public participation round before the final version is lodged.",
  },
  {
    label: "Final report lodged, then the decision",
    state: "next",
    detail:
      "Once the final Environmental Impact Assessment Report and Environmental Management Programme are lodged, the Department has its own period in which to decide the licence.",
  },
];

/**
 * The statutory clock. Dates only — the page computes days at runtime, so
 * nothing here goes stale. The EIR date is settled and is used as settled:
 * Regulation 23(1) gives 106 days from acceptance, Regulation 3 adds the
 * public holidays inside the period and rolls the Sunday forward.
 */
export const CLOCK: {
  date: string;
  label: string;
  detail: string;
  kind: "done" | "due";
}[] = [
  {
    date: "2026-04-21",
    label: "Application lodged with the Department",
    detail: "Receipt confirmed by DFFE.",
    kind: "done",
  },
  {
    date: "2026-05-18",
    label: "Reference number assigned",
    detail: "12/9/11/L260513113929/3/N, with a case officer appointed.",
    kind: "done",
  },
  {
    date: "2026-06-03",
    label: "Final Scoping Report submitted",
    detail:
      "Submitted with the Plan of Study for the impact assessment phase and the participation record.",
    kind: "done",
  },
  {
    date: "2026-07-16",
    label: "Scoping Report ACCEPTED, subject to seven conditions",
    detail:
      "The Department confirmed the report meets the regulations and authorised the impact assessment phase to proceed on the accepted Plan of Study.",
    kind: "done",
  },
  {
    date: "2026-08-02",
    label: "Screening re-run against the actual footprint",
    detail:
      "The national screening tool was re-run with the site's real boundary supplied, so the environmental sensitivity ratings now describe the operational yard rather than the wider landscape.",
    kind: "done",
  },
  {
    date: "2026-11-02",
    label: "Impact assessment report and management programme due",
    detail:
      "Monday 2 November 2026. Regulation 23(1) allows 106 days from acceptance; Regulation 3 extends that by the public holidays falling inside the period and moves a Sunday deadline to the next working day. The thirty-day public participation round on the draft report has to run inside this window, so the draft is needed well before the date itself.",
    kind: "due",
  },
];

/** The seven conditions, each with our position — not a defect list. */
export const CONDITIONS: {
  n: number;
  title: string;
  position: string;
  state: "in-hand" | "in-progress" | "needs-client";
}[] = [
  {
    n: 1,
    title: "One project title across every document",
    position:
      "A single title has been settled and is being applied consistently across the application form, the reports and the annexures as they are reissued for the impact assessment phase.",
    state: "in-progress",
  },
  {
    n: 2,
    title: "Specify exactly which waste streams will be received",
    position:
      "We are building the classification table the Department asked for — stream, waste code, hazard classification, annual tonnage, process route and product or residue. Most of it comes out of your existing operating procedures. The tonnages and the residue destinations are the part we need from you.",
    state: "needs-client",
  },
  {
    n: 3,
    title: "Land use must be regularised before the site is used",
    position:
      "Handled as a parallel workstream. A special consent use application to the City of Ekurhuleni is prepared — the form is completed on the City's own 2024 schedule and the planning motivation is written. Consent use retains the existing Agricultural zoning and is the faster and more proportionate instrument; a full rezoning is the fallback if the City directs it. The one outstanding item is the landowner's power of attorney.",
    state: "needs-client",
  },
  {
    n: 4,
    title: "Identify and assess alternatives",
    position:
      "Being written for the impact assessment report. The same assessment answers a municipal requirement as well, so it is being commissioned once and used twice.",
    state: "in-progress",
  },
  {
    n: 5,
    title: "Include the public participation records in the draft report",
    position:
      "The full participation record — register, comments, and our written responses — is compiled and will be included in the draft report as an annexure.",
    state: "in-hand",
  },
  {
    n: 6,
    title: "Draft report to the Department inside the thirty-day round",
    position:
      "Built into the programme. The draft goes to the Department at the start of the participation round rather than after it, which is what the condition requires and what governs our internal dates.",
    state: "in-progress",
  },
  {
    n: 7,
    title: "Draft Environmental Management Programme",
    position:
      "In preparation against the regulated format, drawing on the site's existing procedures and the controls already committed to.",
    state: "in-progress",
  },
];

/** Scope — what is in this application, and what is not. */
export const SCOPE = {
  inScope: [
    "Reception, classification and storage of hazardous waste",
    "Used oil re-refining by vacuum distillation",
    "Filtration and clean oil manufacture",
    "Oil–water separation and effluent treatment",
    "Used oil filter and container recovery",
    "Chemical re-use and blending",
    "Waste petrol and diesel dewatering",
  ],
  outOfScope: [
    "Tyre pyrolysis and any other thermal treatment",
  ],
  pyrolysisNote:
    "Pyrolysis is deliberately kept out of this application and will be applied for separately. The plant is roughly eighteen months from installation, and a thermal process cannot be assessed properly until it can be specified — it needs its own listed activity screening and an Atmospheric Emission Licence with its own emission evidence. Splitting it keeps this licence simple, removes the objectors' loudest concern, and costs nothing, because the separate application can run while this facility is already operating.",
  capacity: [
    { label: "Throughput", value: "100 t/day · 2 500 t/month" },
    { label: "Storage", value: "±600 000 L in above-ground tanks" },
    { label: "Vehicle movements", value: "Up to 10 tankers per day" },
    { label: "Operating hours", value: "24 hours" },
    { label: "New buildings proposed", value: "None" },
  ],
  activities:
    "GN 921 Category B activities 2, 3, 4 and 10 — reuse and recycling, recovery, treatment, and construction of the facility.",
};

/**
 * Specialist studies. The honest position: drafted in-house and with the EAP,
 * none yet commissioned to an external registered professional.
 */
export const STUDIES = {
  drafted: 16,
  summary:
    "Sixteen specialist studies and the site sensitivity verification are drafted and with the environmental assessment practitioner — around forty thousand words, each in the format the Department expects, and each carrying the record of the site inspection.",
  fourOpen:
    "Four of the sixteen deliberately do not reach a conclusion yet, and say so on their own faces: they are waiting on a baseline noise measurement, the emission inventory, the watercourse survey below, and on two of the other studies being finished first. A declared gap is professional; a manufactured conclusion is what an authority takes apart.",
  sensitivities: [
    { theme: "Agriculture", level: "Very High" },
    { theme: "Terrestrial biodiversity", level: "Very High" },
    { theme: "Palaeontology", level: "High" },
    { theme: "Civil aviation", level: "High" },
    { theme: "Animal species", level: "Medium" },
    { theme: "Plant species", level: "Medium" },
    { theme: "Aquatic biodiversity", level: "Low" },
    { theme: "Archaeology and cultural heritage", level: "Low" },
  ],
  sensitivityNote:
    "These are the national screening tool's ratings, re-run on 2 August against the site's real boundary. A high rating is not an obstacle — it sets how thoroughly a theme has to be dealt with. Agriculture and terrestrial biodiversity are answered by the fact that the proposal adds no new buildings and takes no undeveloped ground.",
};

/** Participation — stated as what was done, because it was done. */
export const PARTICIPATION = {
  registered: 21,
  points: [
    "Site notice placed at the property and a newspaper advertisement run in the Germiston City News.",
    "Stakeholder letters issued to neighbouring landowners and occupiers, with the national Department, the Gauteng provincial department and the City of Ekurhuleni copied.",
    "Twenty-one interested and affected parties registered, each acknowledged in writing on registration.",
    "Every comment received was responded to individually in writing, and the responses were compiled into the Comments and Responses Report filed with the Final Scoping Report.",
  ],
  next:
    "A full thirty-day public participation round runs in the impact assessment phase on the draft report, with the Department inside it. Every organ of state with jurisdiction will be served directly and individually this round, with proof of service retained, rather than copied on a general notice.",
};

/**
 * What we need from the client. Ordered by what is actually blocking.
 * The reason matters as much as the ask — "storage volume in m³" reads as
 * bureaucracy until you say why tonnage cannot answer it.
 */
export const CLIENT_OUTSTANDING: {
  item: string;
  why: string;
  priority: "critical" | "high" | "normal";
}[] = [
  {
    item: "Power of attorney from the registered landowner",
    why: "This is the one item holding up the municipal consent use application, and nothing can be lodged with the City without it. The property is registered to Spring Romance Properties 38 (Pty) Ltd, so the City requires the owner's written authority on its own form, signed by a director of that company and identified by identity number. We have drafted it — we need the introduction, and a signature.",
    priority: "critical",
  },
  {
    item: "The written agreement under which Dilex occupies the property",
    why: "The lease, sale agreement or occupation agreement — whichever exists. If it already records the owner's consent to applications over the property, it does part of the power of attorney's job and there is less to ask of the landowner.",
    priority: "critical",
  },
  {
    item: "Waste streams with classification codes and annual tonnages",
    why: "This closes acceptance condition 2 directly. The Department has said in terms that general descriptions are not enough for it to decide on. The tonnages also drive the diversion argument, which is the strongest part of the need and desirability case.",
    priority: "high",
  },
  {
    item: "Vacuum distillation specification",
    why: "It is the terminal recovery step in the process, and it decides an air quality question that would otherwise stay open in the assessment.",
    priority: "high",
  },
  {
    item: "Residue destinations",
    why: "Where anything not recovered goes, and to whose licence. An assessment that cannot follow the residue to a licensed endpoint is incomplete.",
    priority: "high",
  },
  {
    item: "Written confirmation that the plants go on existing hardstand",
    why: "You confirmed verbally that the new plants sit on the existing bunded hardstand and not on the open ground north of the yard. In writing, that single line is what allows three expensive specialist assessments to be dealt with as compliance statements rather than run in full.",
    priority: "high",
  },
  {
    item: "Six outstanding site photographs",
    why: "The electricity meter, the distribution board, the pit outlet and the plant nameplates. They complete the photographic record that supports the site sensitivity verification.",
    priority: "normal",
  },
  {
    item: "Your identity number and contact details for the municipal form",
    why: "The City's application form asks for the applicant representative's identity number, postal and physical address and telephone number. Whatever goes on the form is where every municipal notice will be sent.",
    priority: "normal",
  },
];

/**
 * Recommendations that cost money. These stay visible: they are the client's
 * decision and, in two of the three cases, they protect the client rather than
 * the application.
 */
export const RECOMMENDED: {
  title: string;
  what: string;
  why: string;
}[] = [
  {
    title: "Groundwater and soil baseline",
    what:
      "A desk study plus a limited intrusive baseline — a small number of boreholes and soil samples targeted at the tank farm, the warehouse floors and the historic transfer point.",
    why: "This is the one specialist theme that cannot be argued away, and the reason is commercial before it is regulatory. Under the waste legislation a current owner carries historical contamination unless it can show what it inherited. The site previously handled waste oil under a different owner. A dated baseline is the only thing that separates their legacy from yours, and it costs a fraction of a remediation instruction. The neighbours draw potable water from a shallow table, which is also why its absence would be the first thing questioned in the report.",
  },
  {
    title: "Survey the watercourse distance",
    what:
      "A surveyed distance and delineation of the vegetated corridor west of the site, rather than the current estimate from aerial imagery.",
    why: "Our desktop work puts it between 500 and 800 metres away. The regulations set a threshold at 500 metres, and if the corridor falls inside it a separate water use authorisation from the Department of Water and Sanitation is engaged — its own application, on its own timeline, which can run longer than this licence. A survey either adds that workstream now, while there is time to absorb it, or removes the question permanently. Either answer is worth having.",
  },
  {
    title: "Localise the operating procedures to Elandsfontein",
    what:
      "Reissue the operating and emergency procedures with Elandsfontein details — the City of Ekurhuleni in place of eThekwini, local emergency contacts, and the licence conditions this facility will actually carry.",
    why: "The current pack is the Durban facility's, which is correct as a starting point — Elandsfontein is being built as a duplicate of a plant that already works, and reusing the proven procedures is the right decision. They now need the local detail filled in before they are attached to the management programme, so that an inspector reading them sees this site.",
  },
];
