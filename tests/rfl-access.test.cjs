const assert = require("node:assert/strict")
const { readFileSync, existsSync } = require("node:fs")
const path = require("node:path")
const { createRequire } = require("node:module")
const { test } = require("node:test")
const ts = require("typescript")
const { renderToStaticMarkup } = require("react-dom/server")

const root = path.resolve(__dirname, "..")

// Load the real handlers while replacing authentication and database boundaries.
// No test connects to a database or modifies application data.
function load(file, mocks = {}) {
  const filename = path.resolve(root, file)
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText
  const mod = { exports: {} }
  const localRequire = createRequire(filename)
  const resolve = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name)
      const target = [base + ".ts", base + ".tsx"].find((p) => existsSync(p))
      if (!target) throw new Error(`Unknown module ${name}`)
      return load(target, mocks)
    }
    return localRequire(name)
  }
  new Function("require", "module", "exports", source)(resolve, mod, mod.exports)
  return mod.exports
}

function boundaries(role, prisma = {}) {
  return {
    "next-auth": { getServerSession: async () => role ? { user: { id: "test-user", role } } : null },
    "@/lib/auth": { authOptions: {} },
    "@/lib/prisma": { prisma },
  }
}

function middleware() {
  return load("middleware.ts", {
    "next-auth/middleware": { withAuth: (handler) => handler },
  }).default
}

const detailPaths = ["participants", "mentorship", "alumni", "sponsorships"]
const modelNames = { participants: "rFLParticipant", mentorship: "rFLMentorship", alumni: "rFLAlumni", sponsorships: "rFLSponsorship" }
for (const area of detailPaths) {
  for (const suffix of ["", "/example-id"]) {
    test(`TRUST_MGMT can open ${area}${suffix || " list"}`, () => {
      const url = new URL(`https://example.test/dashboard/rfl/${area}${suffix}`)
      const response = middleware()({ nextauth: { token: { role: "TRUST_MGMT" } }, nextUrl: url, url: url.href })
      assert.equal(response.headers.get("location"), null)
      assert.equal(response.headers.get("x-middleware-next"), "1")
    })
  }

  test(`unrelated roles cannot open ${area} details`, () => {
    const url = new URL(`https://example.test/dashboard/rfl/${area}/example-id`)
    const response = middleware()({ nextauth: { token: { role: "SCHOOL_AUTHORITY" } }, nextUrl: url, url: url.href })
    assert.equal(response.headers.get("location"), "https://example.test/unauthorized")
  })

  test(`TRUST_MGMT can read the ${area} list`, async () => {
    let calls = 0
    const model = { findMany: async () => { calls++; return [] }, count: async () => 0 }
    const prisma = { [modelNames[area]]: model }
    const route = load(`app/api/rfl/${area}/route.ts`, boundaries("TRUST_MGMT", prisma))
    const response = await route.GET({ url: `https://example.test/api/rfl/${area}` })
    assert.equal(response.status, 200)
    assert.equal(calls, 1)
  })

  for (const [file, method] of [["route.ts", "POST"], ["[id]/route.ts", "PUT"], ["[id]/route.ts", "DELETE"]]) {
    test(`TRUST_MGMT cannot ${method} ${area}`, async () => {
      const route = load(`app/api/rfl/${area}/${file}`, boundaries("TRUST_MGMT"))
      const response = await route[method]({ json: () => assert.fail("Read-only requests must stop before reading mutation data") }, { params: { id: "example-id" } })
      assert.equal(response.status, 401)
    })
  }
}

test("TRUST_MGMT can read alumni profiles and their activity history", async () => {
  const alumni = { id: "alumni-id", name: "Graduate", activities: [{ activityName: "Workshop" }] }
  const route = load("app/api/rfl/alumni/[id]/route.ts", boundaries("TRUST_MGMT", {
    rFLAlumni: { findUnique: async (query) => {
      assert.equal(query.where.id, alumni.id)
      assert.deepEqual(query.include.activities.orderBy, { date: "desc" })
      return alumni
    } },
  }))
  const response = await route.GET({}, { params: { id: alumni.id } })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), alumni)
})

test("TRUST_MGMT cannot add alumni activities", async () => {
  const route = load("app/api/rfl/alumni/[id]/activities/route.ts", boundaries("TRUST_MGMT"))
  const response = await route.POST({ json: () => assert.fail("Read-only requests must not read mutation data") }, { params: { id: "alumni-id" } })
  assert.equal(response.status, 401)
})

for (const area of ["alumni", "sponsorships"]) {
  for (const role of [null, "HOSTEL_INCHARGE"]) {
    test(`${area} list rejects ${role || "unauthenticated requests"} before querying data`, async () => {
      const route = load(`app/api/rfl/${area}/route.ts`, boundaries(role))
      assert.equal((await route.GET({ url: `https://example.test/api/rfl/${area}` })).status, 401)
    })
  }
}

const sponsorship = {
  id: "sponsorship-id", sponsorName: "Test Sponsor", type: "NEED_BASED", amount: 12000,
  startDate: new Date("2026-11-01"), endDate: new Date("2027-11-01"), status: "ACTIVE",
  participantId: "member-id", notes: "Tuition for the academic year", other: "Books included",
}

test("TRUST_MGMT sponsorship details show all fields and link to the participant", async () => {
  const page = load("app/dashboard/rfl/sponsorships/[id]/page.tsx", boundaries("TRUST_MGMT", {
    rFLSponsorship: { findUnique: async () => sponsorship },
    rFLParticipant: { findUnique: async (query) => {
      assert.deepEqual(query.select, { id: true, name: true, institute: true })
      return { id: "member-id", name: "Member", institute: "University" }
    } },
  })).default
  const html = renderToStaticMarkup(await page({ params: { id: sponsorship.id } }))
  for (const text of ["Test Sponsor", "NEED BASED", "12,000", "01 Nov 2026", "01 Nov 2027", "ACTIVE", sponsorship.notes, sponsorship.other, "University"]) assert.ok(html.includes(text), `Missing ${text}`)
  assert.ok(html.includes('/dashboard/rfl/participants/member-id'))
  assert.ok(!html.includes("Save Sponsorship"))
})

for (const participantId of [null, "deleted-member"]) {
  test(`sponsorship view handles ${participantId ? "a deleted participant" : "general sponsorship and missing fields"}`, async () => {
    const page = load("app/dashboard/rfl/sponsorships/[id]/page.tsx", boundaries("TRUST_MGMT", {
      rFLSponsorship: { findUnique: async () => ({ ...sponsorship, participantId, endDate: null, amount: null, other: null, notes: null }) },
      rFLParticipant: { findUnique: async () => null },
    })).default
    const html = renderToStaticMarkup(await page({ params: { id: sponsorship.id } }))
    for (const text of [participantId ? "Participant no longer available" : "General", "No End Date", "Not recorded", "No notes recorded."]) assert.ok(html.includes(text))
  })
}

test("sponsorship view returns not found for a missing record", async () => {
  const page = load("app/dashboard/rfl/sponsorships/[id]/page.tsx", {
    ...boundaries("TRUST_MGMT", { rFLSponsorship: { findUnique: async () => null } }),
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND") } },
  }).default
  await assert.rejects(page({ params: { id: "missing" } }), /NOT_FOUND/)
})

for (const role of [null, "HOSTEL_INCHARGE"]) {
  test(`sponsorship view rejects ${role || "unauthenticated requests"} before querying data`, async () => {
    const page = load("app/dashboard/rfl/sponsorships/[id]/page.tsx", {
      ...boundaries(role),
      "next/navigation": { redirect: (target) => { throw new Error(target) } },
    }).default
    await assert.rejects(page({ params: { id: sponsorship.id } }), new RegExp(role ? "/unauthorized" : "/login"))
  })
}

// Render loaded client screens with controlled session/state, without a browser or live database.
function renderClient(file, role, states, props = {}) {
  let stateIndex = 0
  const Component = load(file, {
    react: {
      ...require("react"),
      useState: () => [states[stateIndex++], () => {}],
      useEffect: () => {},
      useCallback: (fn) => fn,
    },
    "next-auth/react": { useSession: () => ({ data: { user: { role } } }) },
    "next/navigation": { useParams: () => ({ id: "alumni-id" }), useRouter: () => ({ push: () => {} }) },
    "@/components/AlumniModal": { AlumniModal: () => null },
    "@/components/ActivityModal": { ActivityModal: () => null },
    "@/components/SponsorshipModal": { SponsorshipModal: () => null },
  }).default
  return renderToStaticMarkup(require("react").createElement(Component, props))
}

for (const role of ["TRUST_MGMT", "SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]) {
  const canEdit = role !== "TRUST_MGMT"
  const alumni = { id: "alumni-id", name: "Graduate", program: "Leadership", institute: "University", graduationYear: 2024, currentStatus: "Employed", _count: { activities: 1 }, activities: [{ id: "activity-id", activityName: "Workshop", type: "workshop", date: "2026-11-01", status: "Completed" }] }

  test(`${role} alumni list has view access and ${canEdit ? "keeps" : "hides"} mutation controls`, () => {
    const html = renderClient("app/dashboard/rfl/alumni/AlumniClient.tsx", role, [[alumni], false, "", false, null, false], {
      stats: { totalAlumni: 1, activitiesThisYear: 1, mostRecentGraduationYear: 2024 },
    })
    assert.ok(html.includes("Graduate"))
    assert.ok(html.includes("View Profile"))
    assert.equal(html.includes("Add Alumni"), canEdit)
    assert.equal(html.includes('title="Edit"'), canEdit)
  })

  test(`${role} alumni profile shows history and ${canEdit ? "keeps" : "hides"} edit/activity controls`, () => {
    const html = renderClient("app/dashboard/rfl/alumni/[id]/page.tsx", role, [alumni, false, false, false])
    assert.ok(html.includes("Graduate"))
    assert.ok(html.includes("Workshop"))
    assert.equal(html.includes("Edit alumni profile"), canEdit)
    assert.equal(html.includes("Add Activity"), canEdit)
  })

  test(`${role} sponsorship list has View and ${canEdit ? "keeps" : "hides"} mutation controls`, () => {
    const html = renderClient("app/dashboard/rfl/sponsorships/SponsorshipClient.tsx", role, [[sponsorship], 1, 1, 1, false, "", false, null], {
      stats: { activeCount: 1, totalSponsors: 1, expiringSoon: 0, totalValue: 12000 },
    })
    assert.ok(html.includes(`/dashboard/rfl/sponsorships/${sponsorship.id}`))
    assert.ok(html.includes('title="View"'))
    assert.equal(html.includes("Add Sponsorship"), canEdit)
    assert.equal(html.includes('title="Edit"'), canEdit)
    assert.equal(html.includes('title="Delete"'), canEdit)
  })
}

test("TRUST_MGMT overview offers read-only links to all four RFL tabs", async () => {
  const model = { count: async () => 0, findMany: async () => [] }
  const page = load("app/dashboard/rfl/page.tsx", boundaries("TRUST_MGMT", {
    rFLParticipant: model, rFLMentorship: model, rFLAlumni: model, rFLSponsorship: model,
  })).default
  const html = renderToStaticMarkup(await page())
  for (const label of ["View Participants", "View Mentorship", "View Alumni", "View Sponsorships"]) assert.ok(html.includes(label))
  assert.ok(!html.includes("Add Alumni"))
  assert.ok(!html.includes("Add Sponsorship"))
})

test("participant read access keeps admission fields restricted to existing staff roles", async () => {
  let selected
  const route = load("app/api/rfl/participants/[id]/route.ts", boundaries("TRUST_MGMT", {
    rFLParticipant: { findUnique: async (query) => { selected = query.select; return { id: "participant-id", name: "Member" } } },
  }))
  assert.equal((await route.GET({}, { params: { id: "participant-id" } })).status, 200)
  assert.equal(selected.name, true)
  assert.equal(selected.cnic, undefined)
})

const mentorship = {
  id: "session-id", mentorName: "Test Mentor", sessionDate: new Date("2026-11-01"), sessionType: "GROUP",
  targetAudience: "Students", notes: "Full session notes", images: ["data:image/png;base64,dGVzdA=="], participant: null,
}

test("mentorship view renders group sessions, full notes, and pictures for TRUST_MGMT", async () => {
  const page = load("app/dashboard/rfl/mentorship/[id]/page.tsx", boundaries("TRUST_MGMT", {
    rFLMentorship: { findUnique: async () => mentorship },
  })).default
  const html = renderToStaticMarkup(await page({ params: { id: mentorship.id } }))
  for (const text of ["Test Mentor", "Students", "Full session notes", "General", "data:image/png"]) assert.ok(html.includes(text))
  assert.ok(!html.includes("Save Session"))
})

test("mentorship view links a participant and handles missing notes or pictures", async () => {
  const page = load("app/dashboard/rfl/mentorship/[id]/page.tsx", boundaries("SUPER_ADMIN", {
    rFLMentorship: { findUnique: async () => ({ ...mentorship, notes: null, images: [], participant: { id: "member-id", name: "Member", institute: "Institute" } }) },
  })).default
  const html = renderToStaticMarkup(await page({ params: { id: mentorship.id } }))
  assert.ok(html.includes('/dashboard/rfl/participants/member-id'))
  assert.ok(html.includes("No notes recorded."))
  assert.ok(html.includes("No pictures recorded."))
})

test("mentorship view returns not found for a missing session", async () => {
  const page = load("app/dashboard/rfl/mentorship/[id]/page.tsx", {
    ...boundaries("TRUST_MGMT", { rFLMentorship: { findUnique: async () => null } }),
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND") } },
  }).default
  await assert.rejects(page({ params: { id: "missing" } }), /NOT_FOUND/)
})

for (const role of [null, "HOSTEL_INCHARGE"]) {
  test(`mentorship view rejects ${role || "unauthenticated"} before querying data`, async () => {
    const page = load("app/dashboard/rfl/mentorship/[id]/page.tsx", {
      ...boundaries(role),
      "next/navigation": { redirect: (target) => { throw new Error(target) } },
    }).default
    await assert.rejects(page({ params: { id: "session-id" } }), new RegExp(role ? "/unauthorized" : "/login"))
  })
}

test("staff can save edits to an existing alumni record", async () => {
  let update
  const route = load("app/api/rfl/alumni/[id]/route.ts", boundaries("RFL_COORDINATOR", {
    rFLAlumni: { update: async (query) => { update = query; return { id: query.where.id, ...query.data } } },
  }))
  const data = { name: "Updated Name", program: "Program", institute: "Institute", graduationYear: "2024", currentStatus: "Employed", tenure: "2020-2024", qualification: "BS", professionalJourney: "Updated career" }
  const response = await route.PUT({ json: async () => data }, { params: { id: "alumni-id" } })
  assert.equal(response.status, 200)
  assert.equal(update.where.id, "alumni-id")
  assert.deepEqual(update.data, { ...data, graduationYear: 2024, image: undefined })
})

test("TRUST_MGMT cannot save alumni edits", async () => {
  const route = load("app/api/rfl/alumni/[id]/route.ts", boundaries("TRUST_MGMT"))
  const response = await route.PUT({}, { params: { id: "alumni-id" } })
  assert.equal(response.status, 401)
})

for (const area of ["participants", "mentorship"]) {
  for (const role of [null, "SCHOOL_AUTHORITY"]) {
    test(`${area} PDF rejects ${role || "unauthenticated"} before reading data`, async () => {
      const route = load(`app/api/rfl/${area}/[id]/report/route.ts`, boundaries(role))
      const response = await route.GET({}, { params: { id: "record-id" } })
      assert.equal(response.status, role ? 403 : 401)
    })
  }

  test(`${area} PDF returns 404 for a missing record`, async () => {
    const model = { findUnique: async () => null }
    const route = load(`app/api/rfl/${area}/[id]/report/route.ts`, boundaries("TRUST_MGMT", {
      [area === "participants" ? "rFLParticipant" : "rFLMentorship"]: model,
    }))
    assert.equal((await route.GET({}, { params: { id: "missing" } })).status, 404)
  })
}

for (const role of ["TRUST_MGMT", "RFL_COORDINATOR"]) {
  test(`participant PDF includes full history and respects ${role} admission access`, async () => {
    let exported
    let query
    let activityQuery
    const participant = { id: "member-id", name: "Test Member", mentorships: Array.from({ length: 12 }, (_, id) => ({ id })) }
    const activities = Array.from({ length: 15 }, (_, id) => ({ id }))
    const route = load("app/api/rfl/participants/[id]/report/route.ts", {
      ...boundaries(role, {
        rFLParticipant: { findUnique: async (input) => { query = input; return participant } },
        activity: { findMany: async (input) => { activityQuery = input; return activities } },
      }),
      "@/lib/audit": { logAction: async () => {} },
      "@/lib/individual-report": {
        createParticipantReport: (data) => { exported = data; return Buffer.from("%PDF-1.3 test") },
        reportFilename: () => "participant_report.pdf",
      },
    })
    const response = await route.GET({}, { params: { id: "member-id" } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("content-type"), "application/pdf")
    assert.equal(response.headers.get("cache-control"), "private, no-store")
    assert.match(response.headers.get("content-disposition"), /^inline;/)
    assert.equal(query.where.id, "member-id")
    assert.equal(Boolean(query.select.cnic), role === "RFL_COORDINATOR")
    assert.equal(exported.mentorships.length, 12)
    assert.equal(exported.activities.length, 15)
    assert.deepEqual(activityQuery.where, { participantId: "member-id" })
    assert.equal(activityQuery.take, undefined)
  })
}

test("mentor PDF loads every session for the selected mentor rather than the current list page", async () => {
  let query
  let exported
  const sessions = Array.from({ length: 15 }, (_, id) => ({ id, mentorName: "Mentor A" }))
  const route = load("app/api/rfl/mentorship/[id]/report/route.ts", {
    ...boundaries("TRUST_MGMT", {
      rFLMentorship: { findUnique: async () => ({ mentorName: "Mentor A" }), findMany: async (input) => { query = input; return sessions } },
    }),
    "@/lib/audit": { logAction: async () => {} },
    "@/lib/individual-report": {
      createMentorReport: (name, data) => { exported = { name, data }; return Buffer.from("%PDF-1.3 test") },
      reportFilename: () => "mentor_report.pdf",
    },
  })
  const response = await route.GET({}, { params: { id: "selected-session" } })
  assert.equal(response.status, 200)
  assert.deepEqual(query.where, { mentorName: "Mentor A" })
  assert.equal(query.take, undefined)
  assert.equal(exported.name, "Mentor A")
  assert.equal(exported.data.length, 15)
})

test("individual report button opens the correct authenticated PDF endpoint", () => {
  const Button = load("components/IndividualReportButton.tsx").IndividualReportButton
  const html = renderToStaticMarkup(Button({ kind: "participants", id: "member-id", name: "Test Member" }))
  assert.ok(html.includes('/api/rfl/participants/member-id/report'))
  assert.ok(html.includes('target="_blank"'))
  assert.ok(html.includes("Report"))
})

test("PDF builders generate printable multi-page documents with embedded pictures", () => {
  const { participant, mentorSessions } = require("./fixtures/individual-report.cjs")
  const { createParticipantReport, createMentorReport, reportFilename } = load("lib/individual-report.ts")
  for (const pdf of [createParticipantReport(participant), createMentorReport("Test Mentor", mentorSessions)]) {
    const content = Buffer.from(pdf).toString("latin1")
    assert.ok(content.startsWith("%PDF-"))
    assert.match(content, /\/S \/Named\s*\/Type \/Action\s*\/N \/Print/)
    assert.match(content, /\/Subtype \/Image/)
    assert.ok(Number(content.match(/\/Count (\d+)/)[1]) > 1)
    const text = Array.from(content.matchAll(/\/Filter \/FlateDecode\s*>>\s*stream\n([\s\S]*?)\nendstream/g), (match) => {
      try { return require("node:zlib").inflateSync(Buffer.from(match[1], "latin1")).toString("latin1") } catch { return "" }
    }).join("\n")
    for (const expected of ["Test Mentor", "University students", "Detailed session notes with next steps", "Page 1 of"]) assert.ok(text.includes(expected), `PDF missing ${expected}`)
  }
  assert.equal(reportFilename('Name "\r\n; / Person', "participant"), "participant_Name_Person_report.pdf")
})

test("successful sign-ins are persisted and the users API returns the most recent login", async () => {
  const entries = []
  const user = { id: "user-id", email: "test@example.test", name: "Test User", role: "TRUST_MGMT", password: "hash" }
  const prisma = {
    user: {
      findUnique: async ({ where }) => where.email === user.email ? user : null,
      findMany: async () => [{ id: user.id, name: user.name, email: user.email, role: user.role }],
      count: async () => 1,
    },
    auditLog: {
      create: async ({ data }) => { entries.push({ ...data, createdAt: new Date(`2026-11-19T${entries.length === 0 ? "10" : "11"}:00:00Z`) }) },
      groupBy: async (query) => {
        assert.deepEqual(query.where, { action: "LOGIN", userId: { in: ["user-id"] } })
        assert.deepEqual(query._max, { createdAt: true })
        return [{ userId: "user-id", _max: { createdAt: entries.at(-1).createdAt } }]
      },
    },
  }
  const auth = load("lib/auth.ts", {
    "./prisma": { prisma }, "@/lib/prisma": { prisma },
    "next-auth/providers/credentials": (options) => options,
    bcryptjs: { compare: async (password) => password === "correct-password" },
  }).authOptions
  const authorize = auth.providers[0].authorize
  assert.equal(await authorize({ email: user.email, password: "wrong-password" }), null)
  assert.equal(await authorize({ email: "missing@example.test", password: "correct-password" }), null)
  assert.equal(await authorize({}), null)
  assert.equal(entries.length, 0)

  const signedIn = await authorize({ email: user.email, password: "correct-password" })
  await auth.events.signIn({ user: signedIn })
  await auth.events.signIn({ user: signedIn })
  assert.equal(entries.length, 2)
  assert.equal(entries[0].action, "LOGIN")
  assert.equal(entries[0].userId, user.id)
  assert.equal(entries[0].userEmail, user.email)

  // Opening a page or updating the session must not change the login timestamp.
  const token = await auth.callbacks.jwt({ token: { id: user.id, role: user.role }, trigger: "update", session: { name: "Updated" } })
  await auth.callbacks.session({ session: { user: {} }, token })
  assert.equal(entries.length, 2)

  const route = load("app/api/users/route.ts", boundaries("SUPER_ADMIN", prisma))
  const response = await route.GET({ url: "https://example.test/api/users" })
  const data = await response.json()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "private, no-store")
  assert.equal(data.users[0].lastLogin, "2026-11-19T11:00:00.000Z")
  assert.equal(data.users[0].password, undefined)
})

test("users without a recorded login return null rather than a fabricated timestamp", async () => {
  const route = load("app/api/users/route.ts", boundaries("SUPER_ADMIN", {
    user: { findMany: async () => [{ id: "new-user" }], count: async () => 1 },
    auditLog: { groupBy: async () => [] },
  }))
  const response = await route.GET({ url: "https://example.test/api/users" })
  assert.equal((await response.json()).users[0].lastLogin, null)
})

test("empty user pages do not query the entire login history", async () => {
  const route = load("app/api/users/route.ts", boundaries("SUPER_ADMIN", {
    user: { findMany: async () => [], count: async () => 0 },
    auditLog: { groupBy: async () => assert.fail("No login query for an empty page") },
  }))
  const response = await route.GET({ url: "https://example.test/api/users" })
  assert.deepEqual((await response.json()).users, [])
})

for (const role of [null, "TRUST_MGMT"]) {
  test(`user login history is inaccessible to ${role || "unauthenticated requests"}`, async () => {
    const route = load("app/api/users/route.ts", boundaries(role))
    const response = await route.GET({ url: "https://example.test/api/users" })
    assert.equal(response.status, 403)
  })
}
