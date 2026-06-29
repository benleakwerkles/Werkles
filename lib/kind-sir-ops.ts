export type KindSirEntityStatus = "Active/Compliance" | "Active/Noncompliance";

export type KindSirEntity = {
  name: string;
  controlNumber: string;
  status: KindSirEntityStatus;
  lastAnnualRegistrationYear: number;
  action: string;
};

export const kindSirOps = {
  generatedAt: "2026-06-29",
  source: {
    label: "Georgia Secretary of State eCorp business search",
    searchUrl: "https://ecorp.sos.ga.gov/BusinessSearch",
    annualRegistrationGuide: "https://sos.ga.gov/how-to-guide/how-file-annual-registration",
    renewLlcGuide: "https://georgia.gov/renew-llc"
  },
  paymentStatus: {
    entity: "Kind Sir Holding, LLC",
    controlNumber: "19153522",
    operatorReport: "Paid by operator after SOS noncompliance check.",
    readbackState: "SOS readback pending",
    nextCheck: "Re-open eCorp and confirm Last Annual Registration Year is 2026 and status is Active/Compliance."
  },
  notes: [
    "Exact search for Kind Sir Holdings, LLC returned no official Georgia record.",
    "The official Georgia record found is singular: Kind Sir Holding, LLC.",
    "Georgia SOS states Active/Noncompliance entities can be administratively dissolved or revoked this year if annual registrations and fees are not filed."
  ],
  entities: [
    {
      name: "Kind Sir Holding, LLC",
      controlNumber: "19153522",
      status: "Active/Noncompliance",
      lastAnnualRegistrationYear: 2025,
      action: "Paid by operator; verify SOS updates to 2026 compliance."
    },
    {
      name: "Kind Sir Construction, LLC",
      controlNumber: "19122676",
      status: "Active/Noncompliance",
      lastAnnualRegistrationYear: 2025,
      action: "Needs annual-registration payment or readback if already paid."
    },
    {
      name: "KIND SIR LLC",
      controlNumber: "10056354",
      status: "Active/Noncompliance",
      lastAnnualRegistrationYear: 2025,
      action: "Needs annual-registration payment or readback if already paid."
    },
    {
      name: "KIND SIR MANAGEMENT COMPANY, LLC",
      controlNumber: "25247479",
      status: "Active/Noncompliance",
      lastAnnualRegistrationYear: 2025,
      action: "Needs annual-registration payment or readback if already paid."
    },
    {
      name: "Kind Sir Concrete, LLC",
      controlNumber: "19144201",
      status: "Active/Compliance",
      lastAnnualRegistrationYear: 2026,
      action: "No SOS action indicated by current readback."
    },
    {
      name: "Kind Sir Insulation, LLC",
      controlNumber: "21221726",
      status: "Active/Compliance",
      lastAnnualRegistrationYear: 2026,
      action: "No SOS action indicated by current readback."
    }
  ] satisfies KindSirEntity[],
  kindSirDotComQueue: [
    {
      title: "Compliance banner",
      body: "Keep internal site/admin copy honest: payment made, SOS green readback pending."
    },
    {
      title: "Entity name hygiene",
      body: "Use Kind Sir Holding, LLC for the Georgia record unless counsel or filings prove a plural Holdings entity exists."
    },
    {
      title: "Post-payment readback",
      body: "After SOS processing, capture the updated eCorp status and receipt before calling the entity safe."
    }
  ]
} as const;
