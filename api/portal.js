"use strict";
const { randomUUID, createHmac } = require("node:crypto");
const COOKIE = "__Host-anka_admin";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicFields =
  "id,title,title_en,summary,summary_en,description,description_en,requirements,requirements_en,merits,merits_en,location,category,work_mode,scope,start_text,deadline,created_at";
const fail = (status, message) => Object.assign(new Error(message), { status });
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(
    new Date(),
  );
function str(value, max, required = false) {
  if (value == null && !required) return "";
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw fail(400, "Kontrollera obligatoriska fält och textlängder.");
  return value.trim();
}
function id(value) {
  if (!UUID.test(value || "")) throw fail(400, "Ogiltigt ID.");
  return value;
}
function jobInput(b) {
  const result = {};
  for (const key of [
    "title",
    "title_en",
    "summary",
    "summary_en",
    "description",
    "description_en",
    "requirements",
    "requirements_en",
    "merits",
    "merits_en",
    "location",
    "category",
    "scope",
    "start_text",
  ]) {
    result[key] = str(
      b[key],
      key.includes("description") ||
        key.includes("requirements") ||
        key.includes("merits")
        ? 12000
        : key.includes("summary")
          ? 600
          : 160,
      key === "title",
    );
  }
  if (
    !["draft", "published", "closed"].includes(b.status) ||
    !["Onsite", "Hybrid", "Remote"].includes(b.work_mode)
  )
    throw fail(400, "Ogiltig status eller arbetsform.");
  result.status = b.status;
  result.work_mode = b.work_mode;
  result.deadline = b.deadline || null;
  if (
    result.deadline &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(result.deadline) ||
      !Number.isFinite(Date.parse(result.deadline)) ||
      new Date(result.deadline).toISOString().slice(0, 10) !== result.deadline)
  )
    throw fail(400, "Kontrollera datumet.");
  if (
    result.status === "published" &&
    (!result.summary ||
      !result.description ||
      !result.location ||
      (result.deadline && result.deadline < today()))
  )
    throw fail(
      400,
      "Publicering kräver sammanfattning, beskrivning, ort och en giltig sista ansökningsdag.",
    );
  result.updated_at = new Date().toISOString();
  return result;
}
function isOpen(job) {
  return (
    job &&
    job.status === "published" &&
    (!job.deadline || job.deadline >= today())
  );
}
function config() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.PORTAL_ORIGIN)
    throw fail(
      503,
      "Portalen är ännu inte ansluten. Kontakta info@ankatech.se.",
    );
  return { url: url.replace(/\/$/, ""), key };
}
async function backend(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(url + path, {
    ...options,
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = fail(
      502,
      "Tjänsten kunde inte slutföra åtgärden. Försök igen.",
    );
    error.upstream = response.status;
    throw error;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const db = (path, options) => backend("/rest/v1/" + path, options);
const json = (body) => JSON.stringify(body);
function token(req) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(COOKIE + "="))
      ?.slice(COOKIE.length + 1) || ""
  );
}
async function admin(req) {
  const jwt = token(req);
  if (!jwt) throw fail(401, "Logga in för att fortsätta.");
  let user;
  try {
    user = await backend("/auth/v1/user", {
      headers: { Authorization: "Bearer " + jwt },
    });
  } catch {
    throw fail(401, "Sessionen har gått ut. Logga in igen.");
  }
  if (
    !user?.id ||
    !(await db("portal_admins?user_id=eq." + id(user.id) + "&select=user_id"))
      .length
  )
    throw fail(403, "Kontot saknar adminbehörighet.");
  return user;
}
async function throttle(req, action, limit, seconds) {
  const ip =
    req.headers["x-vercel-forwarded-for"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown";
  const key = createHmac("sha256", config().key)
    .update(action + ":" + String(ip).split(",")[0])
    .digest("hex");
  if (
    !(await db("rpc/portal_take_slot", {
      method: "POST",
      body: json({ p_key: key, p_limit: limit, p_seconds: seconds }),
    }))
  )
    throw fail(429, "För många försök. Försök igen senare.");
}
function checkOrigin(req) {
  const allowed = [
    process.env.PORTAL_ORIGIN,
    process.env.VERCEL_URL && "https://" + process.env.VERCEL_URL,
  ]
    .filter(Boolean)
    .map((s) => s.replace(/\/$/, ""));
  if (!allowed.includes(req.headers.origin))
    throw fail(403, "Begäran måste skickas från webbplatsen.");
}
async function handle(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const respond = (status, body) => res.status(status).json(body);
  try {
    config();
    const query = new URL(req.url, "https://portal.local").searchParams;
    const action = query.get("action") || "jobs";
    if (!["GET", "POST"].includes(req.method))
      throw fail(405, "Metoden stöds inte.");
    if (req.method === "GET") {
      if (action === "jobs") {
        const rows = await db(
          "portal_jobs?status=eq.published&or=(deadline.is.null,deadline.gte." +
            today() +
            ")&select=" +
            publicFields +
            "&order=created_at.desc&limit=500",
        );
        return respond(200, { jobs: rows });
      }
      if (action === "job") {
        const rows = await db(
          "portal_jobs?id=eq." + id(query.get("id")) + "&select=*",
        );
        if (!isOpen(rows[0]))
          throw fail(404, "Uppdraget är avslutat eller finns inte längre.");
        return respond(200, {
          job: Object.fromEntries(
            publicFields.split(",").map((k) => [k, rows[0][k]]),
          ),
        });
      }
      const user = await admin(req);
      if (action === "session") return respond(200, { email: user.email });
      if (action === "admin-jobs")
        return respond(200, {
          jobs: await db("portal_jobs?order=updated_at.desc&limit=500"),
        });
      if (action === "applications") {
        const offset = Math.max(
          0,
          Math.min(100000, parseInt(query.get("offset") || "0", 10) || 0),
        );
        let filter = "";
        if (query.get("job")) filter += "&job_id=eq." + id(query.get("job"));
        if (query.get("status")) {
          if (
            !["new", "contacted", "interview", "presented", "closed"].includes(
              query.get("status"),
            )
          )
            throw fail(400, "Ogiltig status.");
          filter += "&status=eq." + query.get("status");
        }
        // Fetch one extra to determine whether another page exists.
        const rows = await db(
          "portal_applications?select=*&order=created_at.desc&limit=31&offset=" +
            offset +
            filter,
        );
        return respond(200, {
          applications: rows.slice(0, 30),
          more: rows.length > 30,
        });
      }
      throw fail(404, "Sidan finns inte.");
    }
    checkOrigin(req);
    if (
      !String(req.headers["content-type"] || "").startsWith("application/json")
    )
      throw fail(415, "JSON krävs.");
    let b = req.body;
    if (typeof b === "string") {
      if (b.length > 3000000) throw fail(413, "Filen är för stor. Max 2 MB.");
      try {
        b = JSON.parse(b);
      } catch {
        throw fail(400, "Ogiltig begäran.");
      }
    }
    if (
      !b ||
      typeof b !== "object" ||
      Array.isArray(b) ||
      json(b).length > 3000000
    )
      throw fail(400, "Ogiltig eller för stor begäran.");
    if (action === "login") {
      await throttle(req, "login", 10, 900);
      let session;
      try {
        session = await backend("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: json({
            email: str(b.email, 254, true),
            password: str(b.password, 256, true),
          }),
        });
      } catch {
        throw fail(401, "E-postadress eller lösenord stämmer inte.");
      }
      if (
        !session.user?.id ||
        !(
          await db(
            "portal_admins?user_id=eq." +
              id(session.user.id) +
              "&select=user_id",
          )
        ).length
      )
        throw fail(403, "Kontot saknar adminbehörighet.");
      res.setHeader(
        "Set-Cookie",
        COOKIE +
          "=" +
          session.access_token +
          "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" +
          Math.min(session.expires_in || 3600, 3600),
      );
      return respond(200, { email: session.user.email });
    }
    if (action === "logout") {
      const jwt = token(req);
      if (jwt) {
        try {
          await backend("/auth/v1/logout", {
            method: "POST",
            headers: { Authorization: "Bearer " + jwt },
          });
        } catch {}
      }
      res.setHeader(
        "Set-Cookie",
        COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      );
      return respond(200, { ok: true });
    }
    if (action === "apply") {
      await throttle(req, "apply", 5, 3600);
      if (b.website) throw fail(400, "Ansökan kunde inte skickas.");
      const jobId = b.job_id ? id(b.job_id) : null;
      if (
        jobId &&
        !isOpen((await db("portal_jobs?id=eq." + jobId + "&select=*"))[0])
      )
        throw fail(409, "Uppdraget är inte längre öppet.");
      const email = str(b.email, 254, true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || b.consent !== true)
        throw fail(
          400,
          "Ange giltig e-post och godkänn hanteringen av ansökan.",
        );
      const application = {
        job_id: jobId,
        job_title: jobId ? "" : "Spontanansökan",
        name: str(b.name, 160, true),
        email,
        phone: str(b.phone, 60),
        location: str(b.location, 160),
        availability: str(b.availability, 160),
        skills: str(b.skills, 2000),
        message: str(b.message, 6000),
        cv_name: str(b.cv_name, 180, true),
      };
      if (
        typeof b.cv !== "string" ||
        b.cv.length > 2796204 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(b.cv)
      )
        throw fail(400, "Bifoga ditt CV som PDF, högst 2 MB.");
      const cv = Buffer.from(b.cv, "base64");
      if (
        cv.length > 2097152 ||
        cv.length < 5 ||
        cv.subarray(0, 5).toString() !== "%PDF-" ||
        !/\.pdf$/i.test(application.cv_name)
      )
        throw fail(400, "Bifoga en giltig PDF, högst 2 MB.");
      application.id = randomUUID();
      application.cv_path = application.id + "/cv.pdf";
      await backend("/storage/v1/object/portal-cvs/" + application.cv_path, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: cv,
      });
      try {
        await db("portal_applications", {
          method: "POST",
          body: json(application),
        });
      } catch (error) {
        await backend("/storage/v1/object/portal-cvs", {
          method: "DELETE",
          body: json({ prefixes: [application.cv_path] }),
        }).catch(() => {});
        throw error;
      }
      return respond(201, { ok: true, reference: application.id.slice(0, 8) });
    }
    await admin(req);
    if (action === "save-job") {
      const job = jobInput(b);
      let rows;
      if (b.id) {
        const stamp = str(b.updated_at, 60, true);
        rows = await db(
          "portal_jobs?id=eq." +
            id(b.id) +
            "&updated_at=eq." +
            encodeURIComponent(stamp),
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: json(job),
          },
        );
        if (!rows.length)
          throw fail(
            409,
            "Annonsen har ändrats av någon annan. Ladda om innan du sparar.",
          );
      } else
        rows = await db("portal_jobs", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: json(job),
        });
      return respond(200, { job: rows[0] });
    }
    if (action === "save-application") {
      if (
        !["new", "contacted", "interview", "presented", "closed"].includes(
          b.status,
        )
      )
        throw fail(400, "Ogiltig status.");
      const rows = await db(
        "portal_applications?id=eq." +
          id(b.id) +
          "&updated_at=eq." +
          encodeURIComponent(str(b.updated_at, 60, true)),
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: json({
            status: b.status,
            notes: str(b.notes, 12000),
            updated_at: new Date().toISOString(),
          }),
        },
      );
      if (!rows.length)
        throw fail(409, "Ansökan har ändrats. Ladda om innan du sparar.");
      return respond(200, { application: rows[0] });
    }
    if (action === "cv" || action === "delete-application") {
      const a = (
        await db("portal_applications?id=eq." + id(b.id) + "&select=cv_path")
      )[0];
      if (!a) throw fail(404, "Ansökan finns inte.");
      if (action === "cv") {
        const result = await backend(
          "/storage/v1/object/sign/portal-cvs/" + a.cv_path,
          { method: "POST", body: json({ expiresIn: 60 }) },
        );
        return respond(200, {
          url: config().url + "/storage/v1" + result.signedURL,
        });
      }
      await backend("/storage/v1/object/portal-cvs", {
        method: "DELETE",
        body: json({ prefixes: [a.cv_path] }),
      });
      await db("portal_applications?id=eq." + id(b.id), { method: "DELETE" });
      return respond(200, { ok: true });
    }
    throw fail(404, "Åtgärden finns inte.");
  } catch (error) {
    return respond(error.status || 500, {
      error: error.status ? error.message : "Ett fel uppstod. Försök igen.",
    });
  }
}
module.exports = handle;
module.exports._test = { jobInput, isOpen, str };
