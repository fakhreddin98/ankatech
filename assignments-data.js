/*
  Här lägger du enkelt till eller tar bort uppdrag.

  Så här publicerar du ett nytt uppdrag:
  1. Kopiera ett uppdragsblock.
  2. Ändra id, title, location, scope, start, tags och description.
  3. Sätt featured: true om uppdraget ska synas på startsidan.
  4. Sätt status: "open" för aktiva uppdrag eller "closed" för stängda.

  Formulären skickas via FormSubmit. Byt REPLACE_WITH_YOUR_EMAIL i HTML/JS
  till rätt mottagaradress innan publicering.
*/

window.ANKA_ASSIGNMENTS = [
  {
    id: "adas-testautomation-2026",
    status: "open",
    featured: true,
    title: {
      sv: "ADAS Testautomation Engineer",
      en: "ADAS Test Automation Engineer"
    },
    location: {
      sv: "Västsverige / hybrid",
      en: "West Sweden / hybrid"
    },
    scope: {
      sv: "Konsultuppdrag",
      en: "Consultant assignment"
    },
    start: {
      sv: "Enligt överenskommelse",
      en: "By agreement"
    },
    tags: ["ADAS", "Python", "Testautomation", "Mätdata"],
    description: {
      sv: "För uppdrag inom fordonsnära testmiljöer söker vi teknisk kompetens inom ADAS, automatiserade testflöden och strukturerad mätdata.",
      en: "For assignments in vehicle-adjacent test environments, we are looking for technical competence in ADAS, automated test flows and structured measurement data."
    }
  },
  {
    id: "gnss-ins-verification-2026",
    status: "open",
    featured: true,
    title: {
      sv: "Verifieringsingenjör inom GNSS/INS",
      en: "Verification Engineer within GNSS/INS"
    },
    location: {
      sv: "Borås / Göteborgsområdet",
      en: "Borås / Gothenburg area"
    },
    scope: {
      sv: "Projekt- eller specialistinsats",
      en: "Project or specialist support"
    },
    start: {
      sv: "Löpande dialog",
      en: "Ongoing dialogue"
    },
    tags: ["GNSS/INS", "Verifiering", "Fordonsprovning", "Dataanalys"],
    description: {
      sv: "Teknisk roll för dig som kan arbeta nära mätdata, positionering, provning och verifiering i avancerade fordonsmiljöer.",
      en: "A technical role for someone who can work close to measurement data, positioning, testing and verification in advanced vehicle environments."
    }
  }
];
