# CLAUDE.md — Booking Tracker Project

> This file is read automatically by Claude Code every session.
> It contains the full context needed to work on this project.
> Last updated: 2026-06-10 | Version: v1.7.0 (in progress)

---

## TIER 1: RULES

> These are non-negotiable. Follow them on every task, every session, no exceptions.

### 1.1 Hard Rules

- **NO silent data deletion.** Any change that could remove, overwrite, or reset user data (bookings, blocks, localStorage keys) must be explicitly flagged and confirmed before execution. This includes refactors that rename storage keys.
- **FLAG anything that costs money.** If a proposed solution involves a paid service, API, hosting, domain, or subscription, stop and say so clearly before proceeding. This is a personal project with a zero infrastructure cost goal until Phase 3.
- **Always test before delivering.** Before presenting any code change, mentally trace through the critical flows: login, add booking, save to localStorage, reload page, data persists. If a change touches auth or storage, state explicitly that you have verified it.
- **Branch for every new feature.** Never work directly on main. New features go on a branch named feature/short-description. Bug fixes go on fix/short-description. Only merge to main when the feature is complete and tested.
- **State a plan before complex changes.** For anything touching more than one function or more than ~30 lines, write out the plan first and wait for confirmation before writing code. Do not just start coding.
- **Never modify TIER 1 rules** without the owner explicitly asking you to do so.
- **Never violate the privacy principles in Tier 1.5.** Any feature, data structure, or Supabase schema that exposes guest data across host boundaries or stores data beyond what is necessary must be flagged and stopped before implementation.

### 1.2 Code Quality Rules

- **Three file architecture is intentional.** index.html is the app shell only. styles.css is all CSS. app.js is all JavaScript. Do not consolidate or split further without explicit instruction.
- **No external dependencies.** Do not import libraries, CDNs, or frameworks. The app uses zero dependencies by design. Everything must work offline.
- **Preserve all existing class names and IDs** unless explicitly refactoring. JavaScript references HTML by ID and class. Silent renames break functionality.
- **localStorage keys are fixed.** Do not rename them. Doing so silently wipes all user data on next load. Any new key must be documented in Tier 3 of this file.
- **Always recalculate nid on load.** After loading from localStorage, nid must be set to Math.max(...all existing ids) + 1 to prevent ID collisions.
- **Always escape user data before innerHTML.** All user-supplied fields must be wrapped in `esc()` before insertion via `innerHTML`. The `esc()` helper is defined in the helpers section of app.js. Never use bare `${field}` inside an innerHTML template string where the field comes from user input (names, notes, mobile, email, platform, method, tags, block reason/notes, review notes). For copy buttons or any onclick that embeds a user value, use `data-val="${esc(value)}"` and read it via `this.dataset.val` — never interpolate user data into an inline event handler string.
- **Passwords are never handled by app code.** Passwords are passed directly to Supabase auth via the Supabase client library. Never log, store, inspect, or manipulate password values in app.js at any point.
- **Supabase publishable key only in environment variables.** SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are loaded from environment variables. The secret key must never appear in source code under any circumstances.

### 1.3 Communication Rules

- Before starting any task, confirm you understand what is being asked.
- If a request is ambiguous, ask one clarifying question before proceeding.
- If you find a bug while working on something else, flag it but do not fix it unless asked.
- Always state which functions were changed and why at the end of a task.
- **Verify spec logic against existing codebase patterns before implementing.** If a formula, date range calculation, or logic check in the spec conflicts with how the same operation is handled elsewhere in the codebase, or would produce incorrect results when traced through, stop and flag the discrepancy before writing any code. Propose the correct implementation with reasoning and wait for confirmation. Never silently implement a spec that you can verify is wrong.

### 1.4 Data Protection — CRITICAL

localStorage is the primary storage. Supabase is the cloud backup layer from v1.7.0.
If localStorage data is lost it may not be recoverable until Supabase sync is verified complete.

Before any change that touches bt_b, bt_bl, bt_p, bt_bh, bt_gp, or any other storage key:

1. List every localStorage key that will be affected
2. Write a migration that carries old data forward if structure changes
3. Test the migration before touching anything else
4. Never rename or remove a localStorage key without a migration
5. Never clear localStorage except through the explicit Clear Demo button
6. If unsure whether a change is safe for existing data, stop and ask first

### 1.5 Supabase Rules

- **RLS must be enabled on every table before any data goes in.** No exceptions.
- **Never write to Supabase without first writing to localStorage.** localStorage is the primary write layer. Supabase is async backup. User must never wait for Supabase to complete a save.
- **Never block the user on a Supabase failure.** If Supabase write fails, log the error, mark the record as unsynced, and continue. The app must remain fully functional offline.
- **The publishable key is safe in browser code only because RLS is enforced.** If RLS is ever disabled on any table, the publishable key becomes a security risk immediately. Never disable RLS.
- **Secret key never in source code.** The Supabase secret key belongs only in Netlify environment variables. It is never read by the browser.
- **All migrated data must be tagged with the currently logged in user's auth ID.** Never migrate data without a valid authenticated session.

---

## TIER 1.5: PRIVACY PRINCIPLES

These principles apply to every feature built from v1.6.0 onwards and every Supabase design decision in v1.7.0. They are non-negotiable and must be considered in every prompt, every function, and every data structure decision.

### Why these exist

This app is built for Filipino short-term rental hosts but it handles data belonging to two parties: the hosts who use the app and the guests who book their properties. Guests did not sign up for this platform. They shared their contact details to book a property, not to be entered into a shared database. Their privacy must be respected accordingly.

### The five principles

**P1: Guest data belongs to the relationship, not the platform**
A guest's name, mobile number, email, booking history, ratings, and notes are private to the host they shared that information with. The platform is a tool for the host, not a data broker. No guest data is ever shared across hosts without explicit consent from all parties.

**P2: Minimum data sharing**
The only thing shared across hosts in future multi-user Supabase architecture is an anonymous internal guest ID used purely for system linkage. No names, no phone numbers, no emails, no booking details, no ratings ever cross host boundaries automatically. Cross-property guest matching requires explicit host confirmation.

**P3: Host data is equally private**
One host never sees another host's bookings, occupancy rates, revenue figures, guest lists, or any operational data. Each host's property data is completely siloed. Row Level Security in Supabase enforces this at the database level.

**P4: AI assistance never means data exposure**
When the AI agent is built in Phase 4, it operates on aggregated anonymous patterns only. It can surface insights like guest reputation signals without revealing which specific properties a guest stayed at, what contact details they used elsewhere, or any data belonging to another host. The AI agent has its own separate permission layer and never bypasses the privacy principles.

**P5: Collect only what is necessary**
We store only the data a host needs to manage their bookings effectively. We do not collect data speculatively for future use. Every new field added to any storage key must have a clear and immediate purpose. If the purpose is future AI analysis, that purpose must be documented explicitly in CLAUDE.md at the time the field is added.

### How these apply to code decisions

When building any feature that involves guest data, Claude Code must ask:

- Does this feature expose one host's guest data to another host in any way?
- Does this feature store guest data beyond what is needed for the host to manage their bookings?
- Does this feature assume guest consent for data usage that was not given at booking time?
- Does this Supabase table or localStorage key design allow data to leak across host boundaries?

If the answer to any of these is **yes** or **maybe**, stop and flag it before writing any code.

### Supabase architecture implications

- The shared `guests` table contains only an anonymous internal ID and system timestamps. Nothing else.
- All guest attributes (name, mobile, email) live in `guest_property_profiles` which is scoped per host per property.
- A guest using different phone numbers with different hosts is intentional and correct. Each host sees only the number their guest used with them.
- Row Level Security policies must be written and verified before any data goes into Supabase. No exceptions.
- The AI agent for cross-property intelligence is a separate service with its own permission layer. It is never part of the main app codebase.

---

## TIER 2: PROJECT CONTEXT

### 2.1 What This Is

Booking Tracker is a browser-based property booking management app built for Filipino short-term rental hosts. It is designed for individual condo, house, or apartment owners who list on multiple platforms (Airbnb, Agoda, Booking.com, Facebook) and need a simple, free way to track bookings, manage checkout logistics, and monitor occupancy.

### 2.2 Who It Is For

- Primary user: Filipino property host with 1 unit listed on 2 to 4 platforms
- Pain points solved: Double-bookings, missed cleaner calls, unclear payment status, no unified view across platforms
- Technical level of user: Non-technical. Uses phone primarily. Familiar with GCash, Messenger, Airbnb app.
- Current users: 2 real users, 2 beta testers

### 2.3 Core Philosophy

- Zero cost to run. Hosted on GitHub Pages (free, moving to Netlify at v1.7.0 Branch 5).
- Mobile-first in intent. Designed to be usable on a phone browser.
- PH-first in design. GCash, Maya, Bank transfer as first-class payment methods. Facebook as a first-class booking platform. Turnaround logistics built in.
- Privacy by design. Guest data is private to each host. No cross-host data sharing.

---

## TIER 3: FILE STRUCTURE

### 3.1 Current Structure

```
booking-tracker/
│
├── index.html      HTML shell (~452 lines) — app shell only, links styles.css and app.js
├── styles.css      All CSS (~257 lines) — cache-busted with ?v=1.6.1
├── app.js          All JavaScript (~2234 lines after XSS fix) — cache-busted with ?v=1.6.1
├── dachshund.png   Mascot asset, static PNG, scrolls in ticker
├── LICENSE         Proprietary copyright, all rights reserved
└── CLAUDE.md       This file. Read by Claude Code every session.
```

### 3.2 localStorage Schema

```
bt_b   Bookings array
       Fields: id, name, mobile, email, ci, co, ciS, coS, ciE, ciL,
               coE, coL, platform, pay, method, notes, cd, ur, at, type,
               ratePerNight (number|null), extensionRate (number|null),
               originalCo (string|null), guestProfileId (number|undefined),
               rating (number|undefined), tags (string[]|undefined),
               reviewNotes (string|undefined)

bt_bl  Blocks array
       Fields: id, from, to, reason, notes

bt_p   Profile object
       Fields: name, addr, type, bed, bath, occ, ci, co, eciAllow, eciFee,
               lcoAllow, lcoFee, pmGC, pmMy, pmBt, pmCs, fullPay, dpPct,
               expHrs, minNights, noSmoke, noPets, noParty, customRule,
               hostName, hostMob, gcash, pencilExpiryHrs, recontact[],
               defaultRate (number|null), cleanerMob (string),
               calSettings: { tickerEnabled, hoverEnabled, hoverMode,
                              tickerSpeed (planned: "slow"|"normal"|"fast") }

bt_bh  Booking history archive
       Fields: all bt_b fields + cancelReason + archivedAt (timestamp)
       cancelReason: "host_cancelled" | "booking_confirmed" | "expired" |
                     "confirmed_cancelled_full" | "confirmed_cancelled_partial"
       Additional: cancelledBy, originalCi, originalCo, cancelledDays

bt_gp  Guest profiles array
       Fields: id, createdAt (maps to guests table, anonymous)
               name, mobiles, email, isBlacklisted, blacklistReason,
               blacklistDate, averageRating, tags, notes, hasConfirmed
               (maps to guest_property_profiles, private per host)
               linkedBookingIds, linkedHistoryIds, mergedProfileIds
               (localStorage only, becomes joins in Supabase)

bt_gpnid  Next guest profile ID counter (integer string)

bt_bell   Bell last-seen timestamp (integer, milliseconds)

bt_last_export  UI state only — timestamp of last doExport(). Not exported in backup.

bt_setup_done   Welcome modal shown flag
```

### 3.3 Supabase Schema (v1.7.0)

Tables created in Branch 2:

```
users
  id (uuid, references auth.users)
  username (text, unique, min 5 chars, alphanumeric only)
  email (text)
  role (text[], default ['owner'])
  terms_accepted_at (timestamptz)
  initial_sync_complete (boolean, default false)
  created_at (timestamptz)

property_profiles
  id (bigint, primary key)
  created_by (uuid, references users.id)
  name, addr, type, bed, bath, occ — all existing bt_p fields
  created_at, updated_at (timestamptz)

property_users (junction table)
  id (bigint, primary key)
  property_id (bigint, references property_profiles.id)
  user_id (uuid, references users.id)
  role (text[], e.g. ['owner'] or ['manager', 'cleaner'])
  invited_by (uuid, references users.id)
  joined_at, created_at (timestamptz)
```

Tables created in Branch 3:

```
bookings (bt_b), blocks (bt_bl), booking_history (bt_bh),
guests (anonymous IDs only), guest_property_profiles (private per host),
notification_state (bt_bell)
```

RLS is enabled on every table. See ARCHITECTURE.md for full SQL.

### 3.4 Environment Variables

```
SUPABASE_URL              — project URL, safe to use in browser
SUPABASE_PUBLISHABLE_KEY  — publishable key, safe in browser when RLS enforced
```

Secret key is never in source code. Lives in Netlify environment variables only.

---

## TIER 4: CURRENT STATE

### 4.1 Authentication

Current (v1.6.0 and earlier):
- Username: admin (hardcoded placeholder)
- Auth uses SHA-256 soft gate, personal use only
- Session lives in JS memory only, clears on tab close

After Branch 2 (v1.7.0):
- Real Supabase email and password auth
- Login accepts username OR email
- Username lookup: if input has no @, look up email from users table, then authenticate
- Invite only signup, admin sends invite from Supabase dashboard
- Remember me: 30 days with, 30 minutes without
- No global session timeout for now, revisit after multi-user stabilizes
- Failed login always shows generic message, never reveals which field is wrong
- Forgot password always shows generic message regardless of whether email exists

### 4.2 Multi-user Architecture

- Each user has their own Supabase account
- Each user's data is isolated via RLS
- One user can be linked to multiple properties (Phase 3 UI)
- One property can have multiple users with different roles
- Roles: owner (all access), manager (no property settings edit), cleaner (limited view)
- Role enforcement deferred to Phase 3, schema ready in Branch 2
- All current users get owner role by default

### 4.3 First Login Sync Onboarding

On first login after signup, if localStorage has existing data:
- Show sync modal: "We found existing records on this device."
- Start Sync: force export, dry run summary, migrate, verify counts
- Skip for Now: sync reminder added to Important Notices, persists until complete
- initial_sync_complete flag in users table controls reminder visibility
- After all existing users complete sync, this feature is removed from codebase
- All migrated data is tagged with currently logged in user's auth ID

### 4.4 Profile Settings Page (new in Branch 2)

- Lives under More tab in bottom navigation
- Separate from Property Settings
- Simple list layout, Airbnb mobile style
- Username: editable with real time availability check
- Email: read only
- Password: change button triggers Supabase reset email
- Role: read only display, enforcement in Phase 3

### 4.5 Full Feature List

**Calendar, Bookings, Guests, Reports, Notices** — all complete as of v1.6.0.
See version history below for full details.

**XSS Protection (v1.7.0 Branch 1 — complete)**
- esc() helper in helpers section of app.js
- All user-supplied fields wrapped in esc() before innerHTML
- Copy buttons use data-val pattern

**Ticker (v1.6.0 + hotfixes)**
- Scrolling next check-in banner with gold urgency labels
- Pause/play button (commit 0428221)
- Dachshund PNG mascot scrolls with text (static, animated version deferred to v2.0.0)

### 4.6 Known Limitations

- localStorage is device-specific, Supabase sync coming in v1.7.0
- SHA-256 auth being replaced with Supabase auth in Branch 2
- Single property UI only, multi-property in Phase 3
- Role enforcement deferred to Phase 3
- Dachshund PNG is static, no walking/sitting animation yet

---

## TIER 5: ROADMAP

**v1.6.0: Complete**
Guest intelligence, bt_gp profiles, reports, ticker, cleaner SMS, calendar settings, notices enhancements.

**v1.7.0: In progress**
- Branch 1: XSS fix — COMPLETE (merged June 10, 2026)
- Branch 2: Supabase auth + multi-user onboarding — NEXT
- Branch 3: Schema and migration code (local only until Branch 5)
- Branch 4: Write-through sync
- Branch 5: Netlify migration, repo goes private
- Branch 6: Live migration on real data (only after Branch 5)
- Branch 7: Guest messaging templates

**v1.8.0: PWA**
Service worker, offline strategy, install prompt, iCal auto-pull.

**v1.9.0: AI Assistant**
Monthly reports, guest message drafts, pricing suggestions via Anthropic API.

**Phase 3: Growth and Monetisation**
Multi-property UI, role enforcement, subscription billing, app store submission,
DTI registration before first payment.

**v2.0.0: Design Refresh**
Glassmorphism, dark mode, micro-animations, dachshund animated mascot,
swipe gestures, full tile color customization.

---

## TIER 6: VERSION HISTORY

| Version | Date | Summary |
|---|---|---|
| v1.7.0 | Jun 2026 | In progress. Branch 1 complete: XSS fix, esc() helper, 85 call sites, data-val copy buttons, CLAUDE.md updated. |
| v1.6.0 | Jun 2026 | Six-branch release. Rate per night, bt_gp guest profiles, guest intelligence UI, ticker banner, quick stats chips, reports tab, important notices enhancements. Hotfixes: ticker pause/play, dachshund PNG mascot. |
| v1.5.5 | Jun 2026 | Critical data protection. Cancelled confirmed bookings archived to bt_bh. archiveBk() replaces archivePcl(). Privacy principles added to CLAUDE.md. Proprietary license added. |
| v1.5.4 | Jun 2026 | Architectural file split. index.html separated into styles.css and app.js. Zero logic changes. |
| v1.5.3 | Jun 2026 | Full audit bug fix release. 18 fixes including TD() timezone fix, state reset on logout, pencil edit conflict check, midnight timer leak. |
| v1.5.1 | Jun 2026 | Visual and UX cleanup. Green color system, gold today ring, payment badge, pencil tile fixes. |
| v1.5.0 | Jun 2026 | Navigation overhaul, bottom nav, property profile, pencil bookings, important notices, guest intelligence. |
| v1.4.0 | May 2026 | Calendar UX overhaul. Hover groups, cross-month indicators, legend redesign, responsive calendar. |
| v1.3.2 | May 2026 | Calendar visual polish. Unified booked color, past date hierarchy, chip contrast. |
| v1.3.1 | May 2026 | Three-channel color system. 3D card depth, payment chips, turnaround independent chips. |
| v1.3.0 | May 2026 | Calendar polish and alerts. Past tile states, ongoing pulse, unpaid border, notification bell. |
| v1.2.0 | May 2026 | Guest Masterlist. Search, filter, profile view, stay history. |
| v1.1.0 | May 2026 | Password hash, export/import backup, What's New modal. |
| v1.0.0 | May 2026 | MVP. Login, calendar, full booking lifecycle, localStorage persistence. |

---

*End of CLAUDE.md — Do not modify TIER 1 without explicit owner instruction.*
