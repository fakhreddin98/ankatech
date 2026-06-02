/* Fallbackdata. Adminportalen redigerar content/assignments.json. */

window.ANKA_ASSIGNMENTS = [
  {
    id: "gnss-ins-verification-2026",
    status: "open",
    featured: true,
    title:    { sv: "Verifieringsingenjör inom GNSS/INS", en: "Verification Engineer – GNSS/INS" },
    role:     { sv: "Testingenjör", en: "Test Engineer" },
    seniority: "Senior",
    location: { sv: "Göteborg (SE)", en: "Gothenburg (SE)" },
    remote: "0%",
    period_start: "2026-06-15",
    period_end:   "2026-11-12",
    deadline: "2026-06-08",
    rate:     { sv: "upp till 580 SEK/h", en: "up to 580 SEK/h" },
    client:   "Ework Group AB",
    hours_per_week: 40,
    scope:  { sv: "Projekt- eller specialistinsats", en: "Project or specialist support" },
    start:  { sv: "15 jun 2026", en: "15 Jun 2026" },
    tags:   ["GNSS/INS", "Verifiering", "Fordonsprovning", "Dataanalys"],
    description: {
      sv: "Teknisk roll för dig som kan arbeta nära mätdata, positionering, provning och verifiering i avancerade fordonsmiljöer.",
      en: "A technical role for someone who can work close to measurement data, positioning, testing and verification in advanced vehicle environments."
    },
    sections: [
      {
        heading: { sv: "Uppdragsbeskrivning", en: "Assignment description" },
        body: {
          sv: "Analysera, standardisera och förbättra testmetoder, tillvägagångssätt och processer.\n\nGenomföra testning och utvärdering av avancerade förarberoende körfunktioner – t.ex. kollisionsmitigering (AEB), Lane Departure Warning (LDW), Blind Spot Detection (BSD) och Forward Collision Warning (FCW).\n\nVehicle Integration – förbereda fordonet med rätt SW/HW för testaktiviteten.\n\nOpen Loop – datainsamling på allmänna vägar och testbana. Closed Loop – sanity, smoke och funktionell testning (NCAP + kravbaserad).",
          en: "Analyze, standardize, and improve the test approaches, methods, and processes.\n\nExecute testing and evaluation of various advanced and automated driving functions (e.g.: AEB, LDW, BSD, FCW). Vehicle Integration – bring up the vehicle with the correct SW/HW required for the test activity.\n\nOpen Loop – Data Collection (public roads + test track). Closed Loop – Sanity, Smoke & Functional testing (NCAP + Requirement based)."
        }
      },
      {
        heading: { sv: "Erfarenhet och kvalifikationer", en: "Experience & qualifications" },
        body: {
          sv: "Högskole-/civilingenjörsexamen inom fordon, mekanik eller elektroteknik.\n\nMinst 5 års erfarenhet inom fordons- och/eller ADAS-komponenttestning.\n\nErfarenhet av ECU-flashning och dataloggning. ASPICE / ISO26262. Jira. B-körkort krävs.",
          en: "Bachelor's degree in engineering (vehicle, mechanical, or electrical engineering).\n\nA minimum of 5 years experience in vehicle and/or ADAS component testing.\n\nECU flashing and data logging. ASPICE / ISO26262. Jira. Driving license, category B."
        }
      }
    ],
    required_skills: ["GNSS/INS", "ADAS-komponenttestning", "ECU Flashing", "Dataloggning", "ASPICE / ISO26262", "Jira", "B-körkort"],
    preferred_skills: ["CAN / Vector-verktyg", "NI-produkter", "Python", "LabVIEW", "UNECE/EU-regelverk"],
    languages: [
      { name: "Svenska", level: { sv: "Nativ", en: "Native" } },
      { name: "Engelska", level: { sv: "Avancerad (krav)", en: "Advanced (mandatory)" } }
    ]
  }
];
