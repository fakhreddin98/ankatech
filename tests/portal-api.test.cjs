const { test } = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/portal.js");
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server-only";
process.env.PORTAL_ORIGIN = "https://ankatech.se";
const uid = "12345678-1234-4234-8234-123456789abc";
function mock(routes) {
  global.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname + new URL(url).search;
    const route = routes.find(([match]) =>
      typeof match === "string" ? path === match : match.test(path),
    );
    assert.ok(route, "Unexpected backend call: " + path);
    const value = typeof route[1] === "function" ? route[1](options) : route[1];
    return {
      ok: !value?.error,
      status: value?.error || 200,
      text: async () => JSON.stringify(value?.error ? {} : value),
    };
  };
}
async function call(action, body, headers = {}) {
  let status, data, cookies;
  const req = {
    url: "/api/portal?action=" + action,
    method: body === undefined ? "GET" : "POST",
    body,
    headers: {
      origin: "https://ankatech.se",
      "content-type": "application/json",
      ...headers,
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    setHeader: (k, v) => {
      if (k === "Set-Cookie") cookies = v;
    },
    status: (s) => {
      status = s;
      return res;
    },
    json: (d) => {
      data = d;
      return res;
    },
  };
  await handler(req, res);
  return { status, data, cookies };
}
const auth = [
  [/\/auth\/v1\/user/, { id: uid, email: "admin@example.com" }],
  [/portal_admins/, [{ user_id: uid }]],
];
const slot = [/rpc\/portal_take_slot/, true];
const baseApp = {
  name: "Test Candidate",
  email: "test@example.com",
  consent: true,
  cv_name: "cv.pdf",
  cv: Buffer.from("%PDF-1.4\nTest").toString("base64"),
};
test("anonymous access to candidate data and signed URLs is denied", async () => {
  mock([]);
  assert.equal((await call("applications")).status, 401);
  assert.equal((await call("cv", { id: uid })).status, 401);
});
test("ordinary authenticated user does not become admin", async () => {
  mock([
    [/\/auth\/v1\/user/, { id: uid }],
    [/portal_admins/, []],
  ]);
  assert.equal(
    (
      await call("applications", undefined, {
        cookie: "__Host-anka_admin=test",
      })
    ).status,
    403,
  );
});
test("cross-origin mutation rejected before touching data", async () => {
  mock([]);
  assert.equal(
    (await call("apply", baseApp, { origin: "https://evil.example" })).status,
    403,
  );
});
test("published validation and status validation prevent accidental publishing", () => {
  assert.throws(() =>
    handler._test.jobInput({
      title: "Role",
      work_mode: "Onsite",
      status: "published",
    }),
  );
  assert.throws(() =>
    handler._test.jobInput({
      title: "Role",
      work_mode: "Onsite",
      status: "unknown",
    }),
  );
  assert.equal(
    handler._test.jobInput({
      title: "Draft",
      work_mode: "Onsite",
      status: "draft",
    }).status,
    "draft",
  );
});
test("drafts and expired jobs are not public", async () => {
  for (const job of [
    { status: "draft" },
    { status: "published", deadline: "2020-01-01" },
  ]) {
    mock([[/portal_jobs/, [job]]]);
    assert.equal((await call("job&id=" + uid)).status, 404);
  }
});
test("stale public form cannot submit to a closed assignment", async () => {
  mock([slot, [/portal_jobs/, [{ status: "closed" }]]]);
  assert.equal((await call("apply", { ...baseApp, job_id: uid })).status, 409);
});
test("CV type and file size validated on server", async () => {
  mock([slot]);
  assert.equal(
    (
      await call("apply", {
        ...baseApp,
        cv: Buffer.from("not PDF").toString("base64"),
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("apply", { ...baseApp, cv: "A".repeat(2796205) })).status,
    400,
  );
});
test("CV upload followed by insert produces receipt and no candidate echo", async () => {
  let saved;
  mock([
    slot,
    [/storage\/v1\/object\/portal-cvs\//, {}],
    [
      "/rest/v1/portal_applications",
      (o) => {
        saved = JSON.parse(o.body);
        return null;
      },
    ],
  ]);
  const result = await call("apply", baseApp);
  assert.equal(result.status, 201);
  assert.equal(saved.job_title, "Spontanansökan");
  assert.ok(saved.cv_path.endsWith("/cv.pdf"));
  assert.equal(result.data.email, undefined);
});
test("failed application insert cleans up uploaded CV", async () => {
  let cleaned = false;
  mock([
    slot,
    [/storage\/v1\/object\/portal-cvs\//, {}],
    ["/rest/v1/portal_applications", { error: 500 }],
    [
      "/storage/v1/object/portal-cvs",
      (o) => {
        assert.equal(o.method, "DELETE");
        cleaned = true;
        return {};
      },
    ],
  ]);
  assert.equal((await call("apply", baseApp)).status, 502);
  assert.equal(cleaned, true);
});
test("throttling fails closed", async () => {
  mock([[/rpc\/portal_take_slot/, false]]);
  assert.equal((await call("apply", baseApp)).status, 429);
});
test("concurrent edits return conflict instead of success", async () => {
  mock([...auth, [/portal_jobs/, []]]);
  assert.equal(
    (
      await call(
        "save-job",
        {
          id: uid,
          updated_at: "2026-09-24T12:00:00Z",
          title: "Test",
          status: "draft",
          work_mode: "Onsite",
        },
        { cookie: "__Host-anka_admin=test" },
      )
    ).status,
    409,
  );
});
test("admin login uses secure HttpOnly cookie", async () => {
  mock([
    slot,
    [
      /\/auth\/v1\/token/,
      {
        user: { id: uid, email: "a@example.com" },
        access_token: "jwt",
        expires_in: 3600,
      },
    ],
    [/portal_admins/, [{ user_id: uid }]],
  ]);
  const result = await call("login", {
    email: "a@example.com",
    password: "test",
  });
  assert.equal(result.status, 200);
  assert.match(result.cookies, /HttpOnly; Secure; SameSite=Strict/);
  assert.equal(result.data.access_token, undefined);
});
