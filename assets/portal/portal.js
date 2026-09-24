(() => {
  "use strict";
  const main = document.getElementById("main");
  let language = localStorage.getItem("ankaLang") || "sv",
    dirty = false;
  const t = (sv, en) => (language === "en" ? en : sv);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const value = (job, key) =>
    language === "en" && job[key + "_en"] ? job[key + "_en"] : job[key] || "";
  const date = (s) =>
    s
      ? new Intl.DateTimeFormat(language === "en" ? "en-GB" : "sv-SE", {
          dateStyle: "medium",
        }).format(new Date(s.slice(0, 10) + "T12:00:00"))
      : "—";
  const today = () =>
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(
      new Date(),
    );
  const statuses = {
    new: ["Ny", "New"],
    contacted: ["Kontaktad", "Contacted"],
    interview: ["Intervju", "Interview"],
    presented: ["Presenterad", "Presented"],
    closed: ["Avslutad", "Closed"],
  };
  const stateName = (s) =>
    ({
      draft: t("Utkast", "Draft"),
      published: t("Publicerad", "Published"),
      closed: t("Stängd", "Closed"),
    })[s] || s;
  const option = (v, label, selected) =>
    `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(label)}</option>`;
  const statusOptions = (s) =>
    Object.entries(statuses)
      .map(([k, v]) => option(k, t(...v), s))
      .join("");
  const input = (
    name,
    label,
    v = "",
    type = "text",
    required = false,
    max = 160,
  ) =>
    `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(v)}" ${required ? "required" : ""} maxlength="${max}"></label>`;
  const area = (name, label, v = "", required = false, max = 12000) =>
    `<label>${esc(label)}<textarea name="${name}" ${required ? "required" : ""} maxlength="${max}">${esc(v)}</textarea></label>`;
  function message(element, text, error = false) {
    element.className = "status " + (error ? "error" : "notice");
    element.textContent = text;
    element.setAttribute("role", error ? "alert" : "status");
  }
  async function api(action, body, params = {}) {
    const query = new URLSearchParams({ action, ...params });
    const response = await fetch("/api/portal?" + query, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        t(
          "Tjänsten svarade inte. Försök igen.",
          "The service did not respond. Please try again.",
        ),
      );
    }
    if (!response.ok) {
      const e = new Error(data.error || "Request failed");
      e.status = response.status;
      throw e;
    }
    return data;
  }
  function allowLeave() {
    return (
      !dirty ||
      confirm(
        t(
          "Du har osparade ändringar. Vill du lämna dem?",
          "You have unsaved changes. Discard them?",
        ),
      )
    );
  }
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  document.getElementById("language").addEventListener("click", () => {
    if (!allowLeave()) return;
    dirty = false;
    language = language === "sv" ? "en" : "sv";
    localStorage.setItem("ankaLang", language);
    start();
  });
  function shell() {
    document.documentElement.lang = language;
    document.getElementById("language").textContent =
      language === "sv" ? "EN" : "SV";
    const links = document.querySelectorAll("nav a");
    links[0].textContent = t("Tjänster", "Services");
    links[1].textContent = t("Uppdrag", "Assignments");
    links[2].textContent = t("Kontakt", "Contact");
  }
  function card(job) {
    return `<article class="card"><div class="row"><span class="badge accent">${esc(job.category)}</span><span class="badge">${esc(job.work_mode)}</span></div><h2><a href="uppdrag-detalj.html?id=${job.id}">${esc(value(job, "title"))}</a></h2><div class="meta"><span>${esc(job.location)}</span><span>${esc(job.scope)}</span></div><p class="muted">${esc(value(job, "summary"))}</p><div class="actions row between"><small>${job.deadline ? t("Ansök senast ", "Apply by ") + date(job.deadline) : t("Löpande urval", "Ongoing selection")}</small><a class="button small secondary" href="uppdrag-detalj.html?id=${job.id}">${t("Visa uppdrag", "View assignment")} →</a></div></article>`;
  }
  function jobDetail(job) {
    return `<div class="hero"><p class="eyebrow">${esc(job.category || "Engineering")}</p><h1>${esc(value(job, "title") || t("Din annonstitel", "Your assignment title"))}</h1><p class="lead">${esc(value(job, "summary"))}</p><div class="meta"><span>${esc(job.location)}</span><span>${esc(job.work_mode)}</span><span>${esc(job.scope)}</span></div></div>${[
      ["description", t("Om uppdraget", "About the assignment")],
      ["requirements", t("Obligatoriska krav", "Requirements")],
      ["merits", t("Meriterande", "Preferred qualifications")],
    ]
      .filter(([k]) => value(job, k))
      .map(
        ([k, label]) =>
          `<section class="detail-section"><h2>${label}</h2><div class="prose">${esc(value(job, k))}</div></section>`,
      )
      .join("")}`;
  }
  async function jobsPage() {
    const { jobs } = await api("jobs");
    main.innerHTML = `<div class="hero"><p class="eyebrow">${t("Uppdrag hos ANKA Tech", "Assignments at ANKA Tech")}</p><h1>${t("Nästa steg i din tekniska karriär.", "Your next step in engineering.")}</h1><p class="lead">${t("Hitta uppdrag där din erfarenhet gör skillnad. Utforska roller inom teknik, utveckling och verifiering.", "Find assignments where your experience matters. Explore roles in engineering, development and verification.")}</p></div><div class="filters"><label>${t("Sök uppdrag", "Search assignments")}<input id="search" type="search" placeholder="${t("Titel, kompetens eller ort", "Title, skill or location")}"></label><label>${t("Arbetsform", "Work arrangement")}<select id="mode"><option value="">${t("Alla arbetsformer", "All arrangements")}</option>${["Onsite", "Hybrid", "Remote"].map((s) => option(s, s)).join("")}</select></label><label>${t("Område", "Discipline")}<select id="category"><option value="">${t("Alla områden", "All disciplines")}</option>${[...new Set(jobs.map((j) => j.category))].map((s) => option(s, s)).join("")}</select></label></div><p id="result-count" class="muted" role="status"></p><div class="grid" id="job-list"></div><aside class="banner"><div><h2>${t("Hittar du inte rätt uppdrag?", "Haven’t found the right assignment?")}</h2><p class="muted">${t("Skicka ditt CV så kan vi matcha dig mot kommande möjligheter.", "Send your CV to be considered for upcoming opportunities.")}</p></div><a class="button" href="ansok.html">${t("Spontanansökan", "Open application")} →</a></aside>`;
    const search = document.getElementById("search"),
      mode = document.getElementById("mode"),
      category = document.getElementById("category");
    function filter() {
      const q = search.value.trim().toLocaleLowerCase();
      const filtered = jobs.filter(
        (j) =>
          (!mode.value || j.work_mode === mode.value) &&
          (!category.value || j.category === category.value) &&
          [
            value(j, "title"),
            value(j, "summary"),
            value(j, "requirements"),
            j.location,
            j.category,
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q),
      );
      document.getElementById("result-count").textContent =
        filtered.length + " " + t("uppdrag", "assignments");
      document.getElementById("job-list").innerHTML = filtered.length
        ? filtered.map(card).join("")
        : `<div class="empty"><h2>${t("Inga uppdrag att visa", "No assignments to show")}</h2><p class="muted">${jobs.length ? t("Prova en annan sökning eller ta bort ett filter.", "Try another search or remove a filter.") : t("Just nu finns inga öppna uppdrag. Du är välkommen med en spontanansökan.", "There are no open assignments at present. Open applications are welcome.")}</p></div>`;
    }
    [search, mode, category].forEach((el) =>
      el.addEventListener("input", filter),
    );
    filter();
  }
  async function detailPage() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id)
      throw new Error(
        t(
          "Välj ett uppdrag från listan.",
          "Select an assignment from the list.",
        ),
      );
    const { job } = await api("job", undefined, { id });
    document.title = value(job, "title") + " | ANKA Tech";
    main.innerHTML = `<a class="pill-link" href="uppdrag.html">← ${t("Alla uppdrag", "All assignments")}</a><div class="split"><article>${jobDetail(job)}</article><aside class="box aside"><p class="eyebrow">${t("Snabbfakta", "At a glance")}</p><dl>${[
      [t("Plats", "Location"), job.location],
      [t("Arbetsform", "Arrangement"), job.work_mode],
      [t("Omfattning", "Scope"), job.scope],
      [t("Start", "Start"), job.start_text],
      [
        t("Sista ansökningsdag", "Deadline"),
        job.deadline
          ? date(job.deadline)
          : t("Löpande urval", "Ongoing selection"),
      ],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
      .join(
        "",
      )}</dl><a class="button" href="ansok.html?id=${job.id}">${t("Ansök till uppdraget", "Apply for this assignment")} →</a><p class="muted" style="margin:16px 0 0">${t("Du ansöker direkt hos ANKA Tech.", "Apply directly to ANKA Tech.")}</p></aside></div>`;
  }
  async function applyPage() {
    const id = new URLSearchParams(location.search).get("id");
    const job = id ? (await api("job", undefined, { id })).job : null;
    main.innerHTML = `<a class="pill-link" href="${job ? "uppdrag-detalj.html?id=" + job.id : "uppdrag.html"}">← ${t("Tillbaka", "Back")}</a><div class="hero"><p class="eyebrow">${t("Din ansökan", "Your application")}</p><h1>${job ? esc(value(job, "title")) : t("Spontanansökan", "Open application")}</h1><p class="lead">${t("Berätta om dig själv och bifoga ditt CV. Inget konto behövs.", "Tell us about yourself and attach your CV. No account required.")}</p></div><div class="split"><form id="apply-form" class="box"><div class="form-grid">${input("name", t("Namn *", "Name *"), "", "text", true)}${input("email", t("E-post *", "Email *"), "", "email", true, 254)}${input("phone", t("Telefon", "Phone"), "", "tel", false, 60)}${input("location", t("Bostadsort", "Home location"))}${input("availability", t("När kan du börja?", "When are you available?"))}</div>${input("skills", t("Viktigaste kompetenser", "Key skills"), "", "text", false, 2000)}${area("message", t("Berätta kort om dig själv", "A short introduction"), "", false, 6000)}<label>${t("Ditt CV *", "Your CV *")}<input type="file" name="cv_file" accept="application/pdf,.pdf" required></label><p class="form-note">PDF · ${t("Max 2 MB", "Max 2 MB")}</p><label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="consent"><input type="checkbox" name="consent" required><span>${t("Jag godkänner att ANKA Engineering AB behandlar mina uppgifter för att hantera min ansökan och kontakta mig om relevanta uppdrag.", "I agree that ANKA Engineering AB may process my details to handle my application and contact me about relevant assignments.")} <a href="integritet.html" target="_blank" rel="noopener">${t("Läs om hanteringen", "Read about data handling")}</a></span></label><div id="apply-status" class="status" aria-live="polite"></div><button class="button" type="submit">${t("Skicka ansökan", "Send application")} →</button></form><aside class="box aside"><h2>${t("Vad händer sedan?", "What happens next?")}</h2><p class="muted">${t("Vi går igenom din profil och kontaktar dig om erfarenheten matchar uppdraget eller ett kommande behov.", "We review your profile and contact you if your experience matches this assignment or an upcoming opportunity.")}</p><a href="mailto:info@ankatech.se">info@ankatech.se</a></aside></div>`;
    const form = document.getElementById("apply-form");
    form.addEventListener("input", () => (dirty = true));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]"),
        status = document.getElementById("apply-status");
      btn.disabled = true;
      message(status, t("Skickar din ansökan…", "Sending your application…"));
      try {
        const file = form.elements.cv_file.files[0];
        if (
          !file ||
          file.size > 2097152 ||
          !file.name.toLowerCase().endsWith(".pdf")
        )
          throw new Error(
            t(
              "Välj ett CV som PDF, högst 2 MB.",
              "Choose a PDF CV, maximum 2 MB.",
            ),
          );
        const cv = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const data = Object.fromEntries(new FormData(form));
        delete data.cv_file;
        data.cv = cv;
        data.cv_name = file.name;
        data.job_id = job?.id || null;
        data.consent = form.elements.consent.checked;
        const result = await api("apply", data);
        dirty = false;
        main.innerHTML = `<section class="box login"><p class="eyebrow">${t("Ansökan mottagen", "Application received")}</p><h1>${t("Tack för din ansökan.", "Thank you for applying.")}</h1><p>${t("Din profil och ditt CV har sparats hos ANKA Tech.", "Your profile and CV have been saved with ANKA Tech.")}</p><p class="muted">${t("Referens", "Reference")}: ${esc(result.reference)}</p><a class="button" href="uppdrag.html">${t("Till uppdragen", "View assignments")}</a></section>`;
        main.focus();
      } catch (error) {
        message(status, error.message, true);
        btn.disabled = false;
      }
    });
  }
  let jobs = [],
    applications = [],
    activeTab = "jobs",
    offset = 0,
    more = false,
    jobFilter = "",
    appStatus = "";
  async function login() {
    main.innerHTML = `<section class="box login"><p class="eyebrow">ANKA Tech · Admin</p><h1>${t("Välkommen tillbaka.", "Welcome back.")}</h1><p class="muted">${t("Logga in för att hantera annonser och ansökningar.", "Sign in to manage assignments and applications.")}</p><form id="login-form">${input("email", t("E-post", "Email"), "", "email", true, 254)}${input("password", t("Lösenord", "Password"), "", "password", true, 256)}<div id="login-status" class="status" aria-live="polite"></div><button class="button" type="submit">${t("Logga in", "Sign in")}</button></form><p class="muted" style="margin-top:20px">${t("Behörigheten hanteras av bolagets administratör.", "Access is managed by your company administrator.")}</p></section>`;
    const form = document.getElementById("login-form");
    form.elements.email.autocomplete = "username";
    form.elements.password.autocomplete = "current-password";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        await api("login", Object.fromEntries(new FormData(form)));
        await dashboard();
      } catch (error) {
        message(document.getElementById("login-status"), error.message, true);
        btn.disabled = false;
      }
    });
  }
  async function dashboard() {
    dirty = false;
    ({ jobs } = await api("admin-jobs"));
    main.innerHTML = `<div class="row between hero"><div><p class="eyebrow">ANKA Tech · Admin</p><h1>${t("Uppdrag & kandidater", "Assignments & candidates")}</h1><p class="muted">${t("Från första annons till nästa konsultuppdrag.", "From the first listing to the next assignment.")}</p></div><button id="logout" class="button secondary">${t("Logga ut", "Sign out")}</button></div><div class="tabs"><button id="tab-jobs">${t("Annonser", "Assignments")}</button><button id="tab-applications">${t("Ansökningar", "Applications")}</button></div><div id="workspace"></div>`;
    document.getElementById("logout").onclick = async () => {
      if (!allowLeave()) return;
      try {
        await api("logout", {});
        dirty = false;
        login();
      } catch (e) {
        alert(e.message);
      }
    };
    document.getElementById("tab-jobs").onclick = () => {
      if (allowLeave()) {
        dirty = false;
        activeTab = "jobs";
        jobTable();
      }
    };
    document.getElementById("tab-applications").onclick = () => {
      if (allowLeave()) {
        dirty = false;
        activeTab = "applications";
        applicationTable();
      }
    };
    if (activeTab === "jobs") jobTable();
    else await applicationTable();
  }
  const workspace = () => document.getElementById("workspace");
  function tabs() {
    document
      .getElementById("tab-jobs")
      .classList.toggle("active", activeTab === "jobs");
    document
      .getElementById("tab-applications")
      .classList.toggle("active", activeTab === "applications");
  }
  function jobTable() {
    tabs();
    workspace().innerHTML = `<div class="row between" style="margin-bottom:22px"><p class="muted">${jobs.length} ${t("annonser", "assignments")} · <span class="count">${jobs.filter((j) => j.status === "published" && (!j.deadline || j.deadline >= today())).length}</span> ${t("öppna", "open")}</p><button class="button" id="new-job">+ ${t("Skapa annons", "Create assignment")}</button></div><div class="table-wrap"><table><thead><tr><th>${t("Annons", "Assignment")}</th><th>Status</th><th>${t("Plats", "Location")}</th><th>${t("Sista ansökningsdag", "Deadline")}</th><th>${t("Åtgärder", "Actions")}</th></tr></thead><tbody>${jobs.map((j) => `<tr><td><strong>${esc(j.title)}</strong><br><small>${esc(j.category)}</small></td><td><span class="badge">${j.status === "published" && j.deadline && j.deadline < today() ? t("Utgången", "Expired") : stateName(j.status)}</span></td><td>${esc(j.location)}</td><td>${date(j.deadline)}</td><td><div class="row"><button class="button small secondary" data-edit="${j.id}">${t("Redigera", "Edit")}</button><button class="button small secondary" data-copy="${j.id}">${t("Duplicera", "Duplicate")}</button><button class="button small secondary" data-apps="${j.id}">${t("Ansökningar", "Applications")}</button></div></td></tr>`).join("")}</tbody></table></div>${!jobs.length ? `<div class="empty">${t("Skapa din första annons. Den sparas som utkast tills du publicerar den.", "Create your first assignment. It stays a draft until you publish it.")}</div>` : ""}`;
    document.getElementById("new-job").onclick = () =>
      editor({ status: "draft", work_mode: "Onsite", category: "Engineering" });
    workspace()
      .querySelectorAll("[data-edit]")
      .forEach(
        (b) =>
          (b.onclick = () => editor(jobs.find((j) => j.id === b.dataset.edit))),
      );
    workspace()
      .querySelectorAll("[data-copy]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const j = {
              ...jobs.find((j) => j.id === b.dataset.copy),
              status: "draft",
              deadline: null,
            };
            delete j.id;
            delete j.updated_at;
            j.title += " " + t("(kopia)", "(copy)");
            editor(j);
          }),
      );
    workspace()
      .querySelectorAll("[data-apps]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            jobFilter = b.dataset.apps;
            appStatus = "";
            offset = 0;
            activeTab = "applications";
            applicationTable();
          }),
      );
  }
  function editor(job) {
    workspace().innerHTML = `<div class="row between" style="margin-bottom:22px"><button id="back-jobs" class="button secondary">← ${t("Alla annonser", "All assignments")}</button><span class="muted">${t("Förhandsgranska medan du skriver", "Preview as you write")}</span></div><div class="editor"><form id="job-editor"><div class="box"><h2>${t("Grunduppgifter", "Basic information")}</h2>${input("title", t("Annonstitel *", "Title *"), job.title, "text", true)}<div class="form-grid">${input("location", t("Ort", "Location"), job.location)}${input("category", t("Kompetensområde", "Discipline"), job.category)}<label>${t("Arbetsform", "Work arrangement")}<select name="work_mode">${["Onsite", "Hybrid", "Remote"].map((s) => option(s, s, job.work_mode)).join("")}</select></label>${input("scope", t("Omfattning, exempelvis 100 %", "Scope, for example 100%"), job.scope)}${input("start_text", t("Start, exempelvis omgående", "Start, for example immediately"), job.start_text)}${input("deadline", t("Sista ansökningsdag", "Application deadline"), job.deadline, "date")}</div>${area("summary", t("Kort sammanfattning", "Short summary"), job.summary, false, 600)}${area("description", t("Om uppdraget", "About the assignment"), job.description)}${area("requirements", t("Obligatoriska krav – ett per rad", "Requirements – one per line"), job.requirements)}${area("merits", t("Meriterande – ett per rad", "Preferred qualifications – one per line"), job.merits)}<details><summary>${t("Engelsk version (valfri)", "English version (optional)")}</summary>${input("title_en", "Title (EN)", job.title_en)}${area("summary_en", "Summary (EN)", job.summary_en, false, 600)}${area("description_en", "Description (EN)", job.description_en)}${area("requirements_en", "Requirements (EN)", job.requirements_en)}${area("merits_en", "Preferred qualifications (EN)", job.merits_en)}</details><label>Status<select name="status">${["draft", "published", "closed"].map((s) => option(s, stateName(s), job.status)).join("")}</select></label><p class="form-note">${t("Utkast syns bara här. Publicerade annonser visas direkt. Efter sista ansökningsdag stängs ansökan automatiskt.", "Drafts are private. Published assignments appear immediately. Applications close automatically after the deadline.")}</p></div><div id="editor-status" class="status" aria-live="polite"></div><div class="editor-actions"><button class="button" type="submit">${t("Spara annons", "Save assignment")}</button></div></form><aside class="editor-preview" aria-label="Förhandsgranskning"><p class="eyebrow">${t("Förhandsgranskning", "Preview")}</p><div id="preview"></div></aside></div>`;
    const form = document.getElementById("job-editor");
    const preview = () =>
      (document.getElementById("preview").innerHTML = jobDetail(
        Object.fromEntries(new FormData(form)),
      ));
    preview();
    document.getElementById("back-jobs").onclick = () => {
      if (allowLeave()) {
        dirty = false;
        jobTable();
      }
    };
    form.addEventListener("input", () => {
      dirty = true;
      preview();
    });
    form.addEventListener("change", () => {
      dirty = true;
      preview();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      try {
        const result = await api("save-job", {
          ...Object.fromEntries(new FormData(form)),
          id: job.id,
          updated_at: job.updated_at,
        });
        job = result.job;
        dirty = false;
        ({ jobs } = await api("admin-jobs"));
        message(
          document.getElementById("editor-status"),
          t("Annonsen är sparad.", "Assignment saved."),
        );
      } catch (e) {
        message(document.getElementById("editor-status"), e.message, true);
      } finally {
        btn.disabled = false;
      }
    });
  }
  async function applicationTable() {
    tabs();
    workspace().innerHTML = `<div class="filters"><label>${t("Uppdrag", "Assignment")}<select id="app-job"><option value="">${t("Alla uppdrag och spontanansökningar", "All assignments and open applications")}</option>${jobs.map((j) => option(j.id, j.title, jobFilter)).join("")}</select></label><label>Status<select id="app-status"><option value="">${t("Alla statusar", "All statuses")}</option>${statusOptions(appStatus)}</select></label></div><div id="application-results" aria-live="polite"></div>`;
    async function load() {
      const results = document.getElementById("application-results");
      results.innerHTML = `<p class="loading">${t("Hämtar ansökningar…", "Loading applications…")}</p>`;
      try {
        const data = await api("applications", undefined, {
          offset: String(offset),
          ...(jobFilter ? { job: jobFilter } : {}),
          ...(appStatus ? { status: appStatus } : {}),
        });
        applications = data.applications;
        more = data.more;
        results.innerHTML = `<div class="table-wrap"><table><thead><tr><th>${t("Kandidat", "Candidate")}</th><th>${t("Uppdrag", "Assignment")}</th><th>Status</th><th>${t("Inkommen", "Received")}</th><th></th></tr></thead><tbody>${applications.map((a) => `<tr><td><strong>${esc(a.name)}</strong><br><small>${esc(a.email)}</small></td><td>${esc(a.job_title)}</td><td><span class="badge accent">${t(...statuses[a.status])}</span></td><td>${date(a.created_at)}</td><td><button class="button small secondary" data-open="${a.id}">${t("Öppna", "Open")}</button></td></tr>`).join("")}</tbody></table></div>${!applications.length ? `<p class="empty">${t("Inga ansökningar för detta urval.", "No applications for this selection.")}</p>` : ""}<div class="row between" style="margin-top:20px"><button class="button secondary" id="previous" ${offset === 0 ? "disabled" : ""}>← ${t("Föregående", "Previous")}</button><small>${t("Sida", "Page")} ${Math.floor(offset / 30) + 1}</small><button class="button secondary" id="next" ${!more ? "disabled" : ""}>${t("Nästa", "Next")} →</button></div>`;
        results
          .querySelectorAll("[data-open]")
          .forEach(
            (b) =>
              (b.onclick = () =>
                candidate(applications.find((a) => a.id === b.dataset.open))),
          );
        document.getElementById("previous").onclick = () => {
          offset = Math.max(0, offset - 30);
          load();
        };
        document.getElementById("next").onclick = () => {
          offset += 30;
          load();
        };
      } catch (e) {
        message(results, e.message, true);
      }
    }
    document.getElementById("app-job").onchange = (e) => {
      jobFilter = e.target.value;
      offset = 0;
      load();
    };
    document.getElementById("app-status").onchange = (e) => {
      appStatus = e.target.value;
      offset = 0;
      load();
    };
    await load();
  }
  function candidate(a) {
    workspace().innerHTML = `<button id="back-apps" class="button secondary" style="margin-bottom:24px">← ${t("Alla ansökningar", "All applications")}</button><div class="split"><section class="box"><p class="eyebrow">${esc(a.job_title)}</p><h2>${esc(a.name)}</h2><p><a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.phone ? " · " + esc(a.phone) : ""}</p><dl><dt>${t("Bostadsort", "Home location")}</dt><dd>${esc(a.location || "—")}</dd><dt>${t("Tillgänglighet", "Availability")}</dt><dd>${esc(a.availability || "—")}</dd><dt>${t("Kompetenser", "Skills")}</dt><dd class="preserve">${esc(a.skills || "—")}</dd></dl><h3>${t("Meddelande", "Message")}</h3><p class="prose">${esc(a.message || "—")}</p><button class="button secondary" id="cv">${t("Hämta CV", "Get CV")}</button><div id="cv-link" class="status"></div><p class="muted" style="margin-top:20px">${t("Mottagen", "Received")}: ${date(a.created_at)} · ${t("Samtycke registrerat", "Consent recorded")}: ${date(a.consent_at)}</p></section><aside><form class="box" id="candidate-form"><h2>${t("Uppföljning", "Follow-up")}</h2><label>Status<select name="status">${statusOptions(a.status)}</select></label>${area("notes", t("Interna anteckningar", "Internal notes"), a.notes)}<p class="form-note">${t("Syns endast för administratörer.", "Visible only to administrators.")}</p><button class="button" type="submit">${t("Spara", "Save")}</button><div id="candidate-status" class="status" aria-live="polite"></div></form><details><summary>${t("Radera personuppgifter", "Delete personal data")}</summary><p class="muted">${t("Tar bort ansökan, anteckningar och CV permanent.", "Permanently deletes the application, notes and CV.")}</p><button class="button danger" id="delete-application">${t("Radera ansökan och CV", "Delete application and CV")}</button></details></aside></div>`;
    document.getElementById("back-apps").onclick = () => {
      if (allowLeave()) {
        dirty = false;
        applicationTable();
      }
    };
    document.getElementById("cv").onclick = async (e) => {
      e.target.disabled = true;
      try {
        const { url } = await api("cv", { id: a.id });
        const el = document.getElementById("cv-link");
        el.innerHTML = `<a class="button secondary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t("Öppna PDF (länken gäller i 60 sekunder)", "Open PDF (link valid for 60 seconds)")}</a>`;
      } catch (error) {
        message(document.getElementById("cv-link"), error.message, true);
      } finally {
        e.target.disabled = false;
      }
    };
    const form = document.getElementById("candidate-form");
    form.addEventListener("input", () => (dirty = true));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        const data = await api("save-application", {
          ...Object.fromEntries(new FormData(form)),
          id: a.id,
          updated_at: a.updated_at,
        });
        a = data.application;
        dirty = false;
        message(
          document.getElementById("candidate-status"),
          t("Ändringarna är sparade.", "Changes saved."),
        );
      } catch (e) {
        message(document.getElementById("candidate-status"), e.message, true);
      } finally {
        btn.disabled = false;
      }
    });
    document.getElementById("delete-application").onclick = async (e) => {
      if (
        !confirm(
          t(
            "Radera ansökan och CV permanent? Detta går inte att ångra.",
            "Permanently delete this application and CV? This cannot be undone.",
          ),
        )
      )
        return;
      e.target.disabled = true;
      try {
        await api("delete-application", { id: a.id });
        dirty = false;
        applicationTable();
      } catch (error) {
        message(
          document.getElementById("candidate-status"),
          error.message,
          true,
        );
        e.target.disabled = false;
      }
    };
  }
  async function start() {
    shell();
    main.innerHTML = `<p class="loading" role="status">${t("Hämtar innehåll…", "Loading…")}</p>`;
    try {
      const page = document.body.dataset.page;
      if (page === "jobs") await jobsPage();
      if (page === "detail") await detailPage();
      if (page === "apply") await applyPage();
      if (page === "admin") {
        try {
          await api("session");
          await dashboard();
        } catch (e) {
          if (e.status === 401 || e.status === 403) await login();
          else throw e;
        }
      }
    } catch (e) {
      main.innerHTML = `<div class="box"><h1>${t("Vi kunde inte öppna sidan.", "We could not open this page.")}</h1><p class="error" role="alert">${esc(e.message)}</p><div class="row"><a class="button secondary" href="uppdrag.html">${t("Till uppdragen", "Assignments")}</a><a href="mailto:info@ankatech.se">info@ankatech.se</a></div></div>`;
    }
  }
  start();
})();
