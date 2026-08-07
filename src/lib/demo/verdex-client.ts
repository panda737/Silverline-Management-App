/**
 * Verdex — what the CLIENT sees.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ THIS FILE IS WRITTEN, NOT FILTERED.                                        │
 * │                                                                           │
 * │ It would be easier to import the internal Verdex fixture and hide the     │
 * │ fields we did not want to show. That is exactly the mistake: a filter is  │
 * │ one forgotten field away from publishing the fine exposure to the client, │
 * │ and a reader of this file could not tell what is safe without going and   │
 * │ reading the other one.                                                    │
 * │                                                                           │
 * │ So nothing here is derived. Every sentence was written for Verdex to      │
 * │ read. If a fact belongs on both screens it is stated twice, on purpose.   │
 * │                                                                           │
 * │ NEVER import from ./verdex into this file, and never import this file     │
 * │ into an internal page.                                                    │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * What is deliberately NOT here, and must not be added:
 *   · the section 24G fine and its exposure bands
 *   · which arguments we intend to run, and how strong we think they are
 *   · corrections to our own earlier record
 *   · anything about the second Verdex entity, or the previous occupier
 *   · commercial terms, invoices and payments — the client has their own copy
 */

export const VERDEX_CLIENT_AS_AT = "2026-08-08";

export const CLIENT_PROJECT = {
  client: "Verdex (Pty) Ltd",
  facility: "Composite plastic board manufacturing facility",
  address: "325 Mundt Street, Waltloo, Pretoria, Gauteng",
  work: "Section 24G application and Waste Management Licence, then an Atmospheric Emission Licence",
  waste: "GDARD — Gauteng Department of Agriculture and Rural Development",
  air: "City of Tshwane",
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
    label: "Understanding the site and the process",
    state: "done",
    detail:
      "Company records, the lease, the zoning certificate, the feedstock ledger and the site drawings are all in and read. The property description, the erf extent of 12 243 m², the building footprint and the site services are settled.",
  },
  {
    label: "Establishing what the law requires",
    state: "done",
    detail:
      "The activities that need a licence have been identified against the gazetted list, and the authorities are confirmed: GDARD for the waste side, the City of Tshwane for air. The application follows a Basic Assessment route rather than the longer Scoping and EIA route.",
  },
  {
    label: "Preparing the Section 24G application",
    state: "current",
    detail:
      "The application is drafted and being completed as the outstanding site information comes in. A legal opinion on one classification question is with our specialist counsel.",
  },
  {
    label: "Lodging the waste application",
    state: "next",
    detail:
      "Once the layouts, equipment list and process flow diagrams are in, the application is checked and lodged with GDARD.",
  },
  {
    label: "The air licence",
    state: "next",
    detail:
      "Prepared after the waste application is lodged. This order is deliberate — it lets the waste side be decided while the plant continues to operate.",
  },
];

/** Progress the client can verify from their own records. */
export const MILESTONES: { date: string; label: string }[] = [
  { date: "2026-07-27", label: "Mandate confirmed and work started" },
  { date: "2026-08-03", label: "Technical checklist answered by Ruhan" },
  { date: "2026-08-05", label: "Site drawings received" },
  { date: "2026-08-06", label: "Competent authorities confirmed · draft Section 24G circulated" },
  { date: "2026-08-07", label: "Commissioning dates and operating pattern confirmed by Ruhan" },
];

/**
 * What we are waiting for. This is the part of the page that does work — it is
 * the client's own to-do list, and it is the reason the page exists.
 */
export const CLIENT_OUTSTANDING: {
  item: string;
  why: string;
  status: "waiting" | "in-progress";
}[] = [
  {
    item: "Detailed site layout drawings",
    why: "The application has to show the footprint of each activity, the receiving, inspection, quarantine and storage areas, and where the treatment equipment stands.",
    status: "in-progress",
  },
  {
    item: "Process flow diagram",
    why: "Shows how material moves from delivery through to finished board, which is how the authority understands the operation.",
    status: "in-progress",
  },
  {
    item: "Equipment list with rated capacities",
    why: "Each item's make, model and rated capacity — including the extraction fans being installed.",
    status: "in-progress",
  },
  {
    item: "Storage volume in cubic metres",
    why: "The storage standard is written in cubic metres rather than tonnes, so tonnage on the floor cannot answer it.",
    status: "waiting",
  },
  {
    item: "Supplier names against the feedstock ledger",
    why: "The ledger currently carries dates and quantities only. The application needs to show where material comes from.",
    status: "waiting",
  },
  {
    item: "Monthly quantities processed and boards produced",
    why: "Used to describe actual operation alongside design capacity.",
    status: "waiting",
  },
  {
    item: "Waste contractors and disposal records",
    why: "Covers what leaves the site as well as what arrives — off-cuts, rejected loads and general waste.",
    status: "waiting",
  },
  {
    item: "Confirmation of the operating hours to be applied for",
    why: "You have indicated a move to 24-hour operation within a month or two. The application should describe the pattern you intend to run, not the one being replaced, so this needs to be fixed before the technical sections close.",
    status: "waiting",
  },
  {
    item: "Any previous inspections, notices or complaints — or written confirmation of none",
    why: "The application asks directly, and a nil return is a complete answer.",
    status: "waiting",
  },
  {
    item: "Decision on press commissioning dates",
    why: "Ruhan asked whether to break the press train down component by component or to use the first press date throughout. We will come back with a recommendation.",
    status: "in-progress",
  },
];

/** Answered, so the client can see their information landing somewhere. */
export const CONFIRMED_WITH_CLIENT: { label: string; value: string }[] = [
  { label: "Erf extent", value: "12 243 m²" },
  { label: "Shredder first run on production material", value: "10 March 2026" },
  { label: "First board pressed", value: "13 March 2026" },
  { label: "First shredder commissioned", value: "9–10 March 2026" },
  { label: "Drum screen commissioned", value: "Week of 2–6 March 2026" },
  { label: "Current operating hours", value: "06:00–22:00, Saturday 06:00–15:00" },
  { label: "Feedstock recorded", value: "365 960 kg gross over 38 deliveries" },
];
