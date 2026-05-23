# CLAUDE.md — Booking Tracker Project

> This file is read automatically by Claude Code every session.
> It contains the full context needed to work on this project.
> Last updated: 2026-05-22 | Version: v1.0.0

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

### 1.2 Code Quality Rules

- **Single file architecture is intentional.** Do not propose splitting into multiple files unless the owner asks. The app is designed to be one index.html for simplicity and GitHub Pages compatibility.
- **No external dependencies.** Do not import libraries, CDNs, or frameworks. The app uses zero dependencies by design. Everything must work offline.
- **Preserve all existing class names and IDs** unless explicitly refactoring. JavaScript references HTML by ID and class. Silent renames break functionality.
- **localStorage keys are fixed.** The two keys are bt_b (bookings array) and bt_bl (blocks array). Do not rename them. Doing so silently wipes all user data on next load.
- **Always recalculate nid on load.** After loading from localStorage, nid must be set to Math.max(...all existing ids) + 1 to prevent ID collisions.

### 1.3 Communication Rules

- Before starting any task, confirm you understand what is being asked.
- If a request is ambiguous, ask one clarifying question before proceeding.
- If you find a bug while working on something else, flag it but do not fix it unless asked.
- Always state which functions were changed and why at the end of a task.

### 1.4 Data Protection — CRITICAL

localStorage is the only storage. There is no backend or backup system yet. If data is lost it cannot be recovered.

Before any change that touches bt_b or bt_bl:

1. List every localStorage key that will be affected
2. Write a migration that carries old data forward if structure changes
3. Test the migration before touching anything else
4. Never rename or remove a localStorage key without a migration
5. Never clear localStorage except through the explicit Clear Demo button
6. If unsure whether a change is safe for existing data, stop and ask first

---

## TIER 2: PROJECT CONTEXT

### 2.1 What This Is

Booking Tracker is a single-file, browser-based property booking management app built for Filipino short-term rental hosts. It is designed for individual condo, house, or apartment owners who list on multiple platforms (Airbnb, Agoda, Booking.com, Facebook) and need a simple, free way to track bookings, manage checkout logistics, and monitor occupancy.

### 2.2 Who It Is For

- Primary user: Solo Filipino property host with 1 unit listed on 2 to 4 platforms
- Pain points solved: Double-bookings, missed cleaner calls, unclear payment status, no unified view across platforms
- Technical level of user: Non-technical. Uses phone primarily. Familiar with GCash, Messenger, Airbnb app.

### 2.3 Core Philosophy

- Zero cost to run. Hosted on GitHub Pages (free). No backend. No database. No server.
- Zero setup time. Open the URL, log in, start adding bookings. No onboarding flow needed.
- Mobile-first in intent. Designed to be usable on a phone browser even though it is not yet a PWA.
- PH-first in design. GCash, Maya, Bank transfer as first-class payment methods. Facebook as a first-class booking platform. Turnaround logistics built in.

---

## TIER 3: FILE STRUCTURE

### 3.1 Current Structure

```
booking-tracker/
│
├── index.html      Entire application (805 lines, ~51KB)
│                   Contains: HTML structure, all CSS, all JavaScript
│                   No external dependencies. Works offline.
│
└── CLAUDE.md       This file. Read by Claude Code every session.
```

Single file architecture is intentional. Do not propose splitting unless the owner explicitly requests it. See TIER 1 Rule 1.2.

### 3.2 index.html Internal Structure

```
index.html
│
├── style               Lines 11 to 137     All CSS
├── LOGIN               Lines 139 to 148    Login screen HTML
├── APP                 Lines 150 to 196    App shell, header, occupancy bar, calendar, detail panel
├── ADD                 Lines 197 to 223    Add booking modal
├── TURNAROUND          Lines 224 to 230    Same-day turnaround warning modal
├── EDIT                Lines 231 to 257    Edit booking modal
├── EXTEND              Lines 258 to 260    Extend stay modal
├── CANCEL              Lines 261 to 263    Cancel booking modal
├── CANCEL CONFIRM      Lines 264 to 270    Full cancel double-confirm modal
├── MAINTENANCE         Lines 271 to 281    Block dates modal
├── ALL BOOKINGS        Lines 282 to 298    All bookings list modal
├── IMPORT FILE         Lines 299 to 301    Hidden file input for import
├── IMPORT CONFIRM      Lines 302 to 315    Import confirm modal with validation
├── WHAT'S NEW          Lines 316 to 326    v1.1.0 release notes modal
│
└── script              Lines 327 to 803    All application logic
    ├── AUTH            SHA-256 login, logout
    ├── DATA            localStorage save/load
    ├── HELPERS         fmt12, dRange, addDays, getters, class mappers
    ├── OCCUPANCY       Monthly occupancy calculation
    ├── CALENDAR        renderCal — builds all 7 tile states
    ├── TURNAROUND      showTurn — split tile detail view
    ├── DETAIL          showDet — booking detail panel
    ├── BLOCK DETAIL    showBlk — maintenance block detail
    ├── CLEANER TAPS    tapCl, tapRd — two-tap cleaner flow
    ├── ADD             openAdd, saveAdd, commitPend, commitBk
    ├── EDIT            openEdit, saveEdit
    ├── EXTEND          openExt, confExt
    ├── CANCEL          openCan, tgP, reqCan, execFull, confPart
    ├── MAINTENANCE     openMaint, openEditBlk, saveMaint, delBlk
    ├── ALL BOOKINGS    openList, renderList, pickBk
    ├── EXPORT/IMPORT   doExport, triggerImport, readImport, confirmImport
    └── WHAT'S NEW      openWN
```

### 3.3 localStorage Schema

```
bt_b   Bookings array
       Fields: id, name, mobile, email, ci, co, ciS, coS, ciE, ciL,
               coE, coL, platform, pay, method, notes, cd, ur, at

bt_bl  Blocks array
       Fields: id, from, to, reason, notes
```

---

## TIER 4: CURRENT STATE

### 4.1 Authentication

- Username: admin (hardcoded placeholder)
- Password: stored with owner, not included in this file for security
- Auth uses SHA-256 via crypto.subtle (intentional soft gate for personal use only)
- Real authentication with Supabase will replace this in Phase 3
- Do not treat this as a secure auth system
- Session lives in JS memory only, clears on tab close

### 4.2 Full Feature List (all verified working as of v1.0.0)

**Calendar**
- 7 tile states: empty, available, booked, checkout, maintenance, turnaround, today
- Click tiles to open detail panel or add booking
- Navigate months with arrows
- Check-in and checkout arrow chips on tiles
- Turnaround split tile with urgent pulsing amber border

**Occupancy Bar**
- Shows booked days as fraction and percentage with fill bar
- Counts mid-stay, checkout days, and maintenance blocks
- Updates when navigating months and after any booking change

**Add Booking**
- Full form: name, mobile, email, check-in, check-out, 6 timing fields, platform, payment status, payment method, notes
- Pre-fills check-in date from calendar tile tap
- Hard conflict check for overlapping bookings or blocks
- Soft turnaround warning modal

**Edit Booking**
- All fields editable except dates
- Dates changed only via Extend or Cancel flow

**Extend Stay**
- Conflict check before opening
- Extension payment toggle
- Auto-flips fully paid to partially paid if extension is unpaid
- Resets cleaner and unit ready on extend

**Cancel Booking**
- Full cancel with double confirm
- Partial cancel by day checkboxes, trims outer range

**Cleaner Two-Tap Flow**
- Tap 1: Cleaner contacted
- Tap 2: Unit ready, locked until cleaner confirmed
- Urgent alert on turnaround days
- Resets on extend

**Payment Tracking**
- Status: Fully paid, Partially paid, No payment
- Method: GCash, Maya, Via app, Bank transfer, Cash, Pending
- All colour coded in detail panel

**Turnaround Detection**
- Same-day checkout and check-in triggers split tile
- Urgent alert and warning modal on new booking

**Maintenance Blocks**
- Block date ranges with reason and notes
- Conflict check with existing bookings
- Editable and deletable from detail panel

**All Bookings List**
- Searchable by name, platform, method, mobile
- Sort: newest, oldest, name A-Z, name Z-A, upcoming check-ins
- Click to navigate calendar to that booking

**Repeat Guest Detection**
- Badge and count if guest name appears more than once
- Red dot on calendar chip

**Data Persistence**
- All data saved to localStorage after every mutation
- Loaded on login, falls back to empty state for new users
- nid recalculated on every load

### 4.3 Known Limitations

- localStorage is device-specific, no multi-device sync yet
- Password is frontend only, real auth comes in Phase 3
- Partial cancel trims outer range only, no gap support yet
- Single property only

---

## TIER 5: ROADMAP

**MVP: Complete — v1.0.0**

**v1.1.0: Complete**
- Password removed from source, SHA-256 hash constant
- Silent save failure now shows visible error banner
- Export and Import JSON backup with validation and confirm modal
- What's New modal

**v1.2.0: Guest Masterlist — NEXT**
- Guest profile modal, full screen, opened from header button
- Search by name, mobile, email
- Filter chips: All, Repeat, VIP, Flagged
- Guest card showing name, total stays, last stay date, platform badges, tag color dot
- Tap card opens full profile: all stays, total revenue, payment methods, notes, host rating

**v1.3.0: Navigation — PENDING**
- Bottom navigation bar: Home, Guests, Reports, Settings
- Settings tab absorbs: Export, Import, Clear Demo, What's New, Password
- Header cleaned up

**Phase 1 remaining — PENDING**
- Monthly income summary (becomes Reports tab in v1.3.0)
- Next check-in banner on home screen
- PWA installable on phone home screen
- Multi-device sync via Supabase free tier

**Phase 2: Guest Intelligence — PENDING**
- Quick reply message templates
- Expense tracking per booking
- Partial cancel gap support

**Phase 3: Growth and Monetisation — PENDING**
- Multi-property support
- Real authentication with Supabase
- iCal auto-pull from Airbnb, Booking.com, Agoda
- Subscription billing and landing page

**Phase 4: AI Assistant — PENDING**
- Monthly host report in plain language
- Guest message drafts based on booking details
- Pricing suggestions based on occupancy and local market data
- Anomaly alerts for unusual booking patterns
- Formal monthly PDF report
- Present to Connectt.io as portfolio piece

---

## TIER 6: VERSION HISTORY

| Version | Date | Summary |
|---|---|---|
| v1.1.0 | May 2026 | Password removed from source, replaced with pre-computed SHA-256 hash. Silent save failure now shows visible error banner. Export and import JSON backup added with file validation and confirm modal. What's New modal added. |
| v1.0.0 | May 2026 | MVP complete. Login, calendar, full booking lifecycle, cleaner flow, payment tracking, turnaround detection, localStorage persistence, all bookings list, maintenance blocks, occupancy tracker. 23 checks passing. |

Next release: v1.2.0

---

*End of CLAUDE.md — Do not modify TIER 1 without explicit owner instruction.*
