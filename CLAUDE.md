# CLAUDE.md — Booking Tracker Project

> This file is read automatically by Claude Code every session.
> It contains the full context needed to work on this project.
> Last updated: 2026-05-29 | Version: v1.4.0

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
├── index.html      Entire application (1168 lines, ~76KB)
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
├── style               Lines 11 to 204     All CSS (color system: bg=type, border=time, chip=payment; hover group; legend; responsive)
├── LOGIN               Lines 206 to 216    Login screen HTML
├── APP                 Lines 217 to 290    App shell, header, occupancy bar, legend (4-section), calendar grid, detail panel
├── ADD                 Lines 291 to 317    Add booking modal
├── TURNAROUND          Lines 318 to 324    Same-day turnaround warning modal
├── OVERWRITE WARNING   Lines 325 to 331    Unpaid booking overwrite confirm modal (v1.3.0)
├── EDIT                Lines 332 to 358    Edit booking modal
├── EXTEND              Lines 359 to 361    Extend stay modal
├── CANCEL              Lines 362 to 364    Cancel booking modal
├── CANCEL CONFIRM      Lines 365 to 371    Full cancel double-confirm modal
├── MAINTENANCE         Lines 372 to 382    Block dates modal
├── ALL BOOKINGS        Lines 383 to 399    All bookings list modal
├── IMPORT FILE         Lines 400 to 402    Hidden file input for import
├── IMPORT CONFIRM      Lines 403 to 416    Import confirm modal with validation
├── WHAT'S NEW          Lines 417 to 435    Release notes modal
├── GUEST MASTERLIST    Lines 436 to 457    Guest Masterlist modal (list + profile views)
├── NOTIFICATIONS BELL  Lines 458 to 464    Alerts bell modal — 4-section notification panel (v1.3.0)
│
└── script              Lines 465 to 1168   All application logic
    ├── AUTH            SHA-256 login, logout
    ├── DATA            localStorage save/load
    ├── HELPERS         fmt12, dRange, addDays, getters, class mappers, isUnpaid, payChipClass, dirClass,
    │                   hvOn(sel), hvOff() — hover group highlight with 60ms debounce (v1.4.0)
    ├── OCCUPANCY       Monthly occupancy calculation
    ├── CALENDAR        renderCal — fully rewritten v1.4.0: 15 tile states, data-bid/data-blid on every tile,
    │                   hover groups, ext badge, cont-i/cont-o cross-month indicators, split turnaround halves
    ├── TURNAROUND      showTurn — split tile detail view
    ├── DETAIL          showDet — booking detail panel
    ├── BLOCK DETAIL    showBlk — maintenance block detail
    ├── CLEANER TAPS    tapCl, tapRd — two-tap cleaner flow
    ├── ADD             openAdd, saveAdd, commitPend, commitBk, confirmOw (v1.3.0)
    ├── EDIT            openEdit, saveEdit
    ├── EXTEND          openExt, confExt
    ├── CANCEL          openCan, tgP, reqCan, execFull, confPart
    ├── MAINTENANCE     openMaint, openEditBlk, saveMaint, delBlk
    ├── ALL BOOKINGS    openList, renderList, pickBk
    ├── GUESTS          openGM, buildGuests, gmFilt, renderGM, openGMProf, gmBack
    ├── EXPORT/IMPORT   doExport, triggerImport, readImport, confirmImport
    ├── ALERTS BELL     openBell (v1.3.0)
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

### 4.2 Full Feature List (all verified working as of v1.4.0)

**Calendar — Color System + Hover Groups**
- **15 tile states:** pm (past empty), pbk (past ended booked), pco (past ended checkout), av (available future), av.td (today empty), bk (confirmed future), co (future checkout), yel (unpaid/pending future), yel.td (today unpaid), og.pog (ongoing past days), og.td (ongoing today), og (ongoing future paid), og.og-upd (ongoing future unpaid — ext badge), mn2 (maintenance), tr (turnaround)
- **Channel 1 — Tile bg = type:** white #FFFFFF available; blue #DBEAFE booked/checkout; yellow #FEF9C3 unpaid/pending; #DCFCE7 past ongoing; #4ADE80 today ongoing; #86EFAC ongoing future; #F3F4F6 maintenance/past-empty; #F9FAFB past ended
- **Channel 2 — Tile border = time:** today=#1D4ED8 blue ring (always wins, even on yel.td via 3-class specificity); ongoing=#16A34A green; ongoing unpaid/ext=#C2410C orange; turnaround=pulsing #E8A020 amber (never overridden); default transparent or light gray
- **Channel 3 — Chip bg = payment:** .cpf #15803D/white fully paid; .cpp #C2410C/white partial; .cpn #991B1B/white unpaid; .cpd #4B5563/white pending. Past fully-paid chips at opacity 0.5 (.cfaded); past unpaid/partial chips at full opacity so outstanding debt stays visible
- **3D card depth:** today+future tiles raised (drop shadow); past empty flat (no shadow); past ended/ongoing-past inset shadow
- **Hover group highlight (v1.4.0):** `data-bid` on every booked tile, `data-blid` on maintenance tiles. Mouseenter calls `hvOn(sel)` — all tiles with matching bid get `.hv-on` (blue border, scale 1.03, lift shadow, z-index 10); calendar grid gets `.hv-active` dimming all other tiles to opacity 0.45. `hvOff()` clears with 60ms debounce. Skipped on touch devices. **Turnaround fix:** outer `.dy.tr` also receives `.hv-on` when either half is in the group — tile lifts as one unit; `overflow:visible` on `.dy.tr.hv-on` unclips shadow and scale
- **Cross-month indicators (v1.4.0):** `← cont.` label on d===1 if booking started in prior month; `cont. →` label on d===days if booking ends in next month
- **Ext badge (v1.4.0):** ongoing future tiles where booking is not fully paid show dark pill badge "ext" — proxy for extension unpaid state until `originalCo` field added in future version
- **Split turnaround tile:** `.dy.tr` is flex-column; `.tr-top` (outgoing) and `.tr-bot` (incoming) each have `data-bid` and independent inline background reflecting their payment state (#FEF9C3 unpaid, #86EFAC ongoing, #DBEAFE confirmed)
- **Legend (v1.4.0):** 3-section redesign — Tile color swatches, Payment chip real samples, Border meaning squares, italic hover note
- **Responsive (v1.4.0):** `@media(min-width:768px)` — `.wp` 900px, `.dy` 82px min-height, `.dn2` 14px, `.ch` 11px, legend gap 10px
- Click tiles to open detail panel or add booking; navigate months with arrows

**Occupancy Bar**
- Shows booked days as fraction and percentage with fill bar
- Counts mid-stay, checkout days, and maintenance blocks
- Updates when navigating months and after any booking change

**Add Booking**
- Full form: name, mobile, email, check-in, check-out, 6 timing fields, platform, payment status, payment method, notes
- Pre-fills check-in date from calendar tile tap
- Check-in date picker min=today (past dates blocked); check-out min auto-updates when check-in changes (v1.3.2)
- Hard conflict check for overlapping bookings or blocks
- Soft turnaround warning modal
- Unpaid overwrite prompt: if conflict is an unpaid/pending booking, offer to overwrite instead of hard error (v1.3.0)

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

**Guest Masterlist**
- Full guest list built dynamically from bt_b — no new storage keys
- Search by name, mobile, or email
- Filter chip: All / Repeat
- Guest card shows name, stay count, next/last date, platform badges, payment summary
- Tap card opens profile: contact info, summary stats, full stay history newest-first
- Stay history shows dates, nights, platform, payment status, method, and notes per stay
- "Booking amount field coming in future version" notice in profile

**Notification Bell (v1.3.0)**
- 🔔 Alerts button in header opens 4-section panel
- Section 1: Cleaner Reminder — nearest upcoming checkout with contact status
- Section 2: Unpaid Bookings — future bookings with pay=none
- Section 3: Pending Reservations — future bookings with method=Pending
- Section 4: Upcoming Confirmed — future fully paid bookings sorted by check-in
- Each row tappable: closes bell and navigates calendar to that booking

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

**v1.2.0: Guest Masterlist — Complete**
- Guest profile modal opened from header 👥 Guests button
- Search by name, mobile, email
- Filter chips: All, Repeat
- Guest card showing name, total stays, next/last date, platform badges, payment summary
- Tap card opens full profile: contact info, summary stats, full stay history newest-first

**v1.3.0: Calendar Polish + Alerts — Complete**
- Past tile visual states: empty=gray no-click, booked=muted pink, checkout=muted amber
- Ongoing bookings pulse green (started past, ends future)
- Unpaid/pending bookings show dotted amber border on all their tiles
- Unpaid overwrite prompt when adding a booking over an unpaid conflict
- Notification bell (🔔 Alerts): cleaner reminders, unpaid, pending, confirmed sections

**v1.3.1: Three-Channel Color System + 3D Card Depth — Complete**
- Three-channel tile design: background=type of day, border=time status, chip bg=payment status
- Adds .rsv pending/reserved tile state (light purple bg) for bookings with method=Pending
- Ongoing bookings: green border + green bg on ALL days including future days of the stay
- Past days of ongoing bookings are flat/inset; today+future days are raised cards
- 3D card depth: today+future tiles raised with drop shadow; past empty flat; past bookings inset
- Today blue ring always wins over ongoing green; turnaround amber pulse never overridden
- Payment chips: .cpf green, .cpp amber, .cpn red, .cpd gray — replaces dotted .upd border
- Turnaround tile shows independent payment chip per guest (was a single tile-level indicator)
- Legend updated: new Pending/Reserved swatch + chip colour mini-row with real chip samples

**v1.3.2: Calendar Visual Polish — Complete**
- Unified booked/checkout tile color: checkout amber (#FEF3E2) replaced with soft blue (#DBEAFE) — all booked days (check-in, mid-stay, checkout) now same color; Checkout swatch removed from legend
- Past date visual hierarchy: past-empty=#EFEFEF flat/no-shadow, past-booked/checkout=#EDF4FF inset, past-ongoing=.og.pog #DCF0E4; all past date numbers gray (#BBBBBB) normal weight
- Chips saturated with white text: .cpf #1B7E35/white, .cpp #E65100/white, .cpn #C62828/white, .cpd #616161/white; direction classes (.cid/.cod) de-colored so chip bg shows through cleanly
- Date picker blocks past dates: aci.min=TD set in openAdd(); aci onchange updates aco.min=aD(value,1) dynamically

**v1.4.0: Calendar UX Overhaul — Complete**
- 5-area visual overhaul: CSS and JS only, zero data/storage changes
- New color system: white available, blue confirmed, yellow unpaid/pending, green ongoing spectrum, near-white past
- Hover group highlight: data-bid/data-blid, hvOn/hvOff helpers, .hv-on lift+scale, .hv-active dimming, turnaround outer-tile fix
- Cross-month indicators: ← cont. and cont. → on boundary tiles
- Ext badge proxy for ongoing-future unpaid/partial tiles
- Legend redesign: 3 sections (tile color / payment chip / border meaning) with real chip samples
- Responsive calendar: @media(min-width:768px) expands tiles, font sizes, legend gap, wrapper to 900px

**v1.5.0: Navigation — NEXT**
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
| v1.4.0 | May 2026 | Calendar UX overhaul — 5 areas, CSS+JS only, zero data changes. Area 1: new color system (white av, blue bk/co, yellow yel, green og spectrum, near-white past, chip colors cpf=#15803D/cpp=#C2410C/cpn=#991B1B/cpd=#4B5563 white text, cfaded opacity 0.5 for past paid). Area 2: hover group highlight — data-bid/data-blid on all tiles, hvOn(sel)/hvOff() 60ms debounce, .hv-on scale 1.03 blue border lift, .hv-active dims non-hovered to 0.45; turnaround outer .dy.tr gets hv-on so full tile lifts (.dy.tr.hv-on overflow:visible unclips shadow). Area 3: ← cont. / cont. → cross-month boundary labels. Area 4: legend redesign 3 sections (tile color, payment chip, border meaning) + italic note. Area 5: @media(min-width:768px) responsive — 900px wrapper, 82px tiles, 14px dn2, 11px chip. 1168 lines. |
| v1.3.2 | May 2026 | Calendar visual polish. Unified booked+checkout tile to soft blue (#DBEAFE/#EDF4FF) — checkout amber removed, Checkout legend swatch removed. Past date hierarchy: past-empty=#EFEFEF flat, past-booked/checkout=#EDF4FF inset, past-ongoing=.og.pog #DCF0E4; all gray #BBBBBB date nums normal weight. Chips saturated white text: cpf=#1B7E35, cpp=#E65100, cpn=#C62828, cpd=#616161; .cid/.cod de-colored. Date picker min=TD in openAdd(), aci onchange updates aco.min. 1073 lines. |
| v1.3.1 | May 2026 | Three-channel color system and 3D card depth. Channel 1 bg=type (adds .rsv pending/reserved, light purple). Channel 2 border=time (ongoing green on all days, today blue ring always wins). Channel 3 chip=payment (.cpf/.cpp/.cpn/.cpd replaces .upd dotted border). Past tiles flat/inset, today+future tiles raised. Turnaround shows independent payment chip per guest. Adds payChipClass() and dirClass() helpers. Legend chip mini-row. 1070 lines. |
| v1.3.0 | May 2026 | Calendar polish and alerts. Past tile visual states (gray/muted pink/muted amber). Ongoing bookings pulse green. Unpaid/pending tiles get dotted amber border. Unpaid overwrite prompt in saveAdd. 🔔 Alerts bell with 4-section notification panel. 1057 lines. |
| v1.2.0 | May 2026 | Guest Masterlist added. Header 👥 Guests button opens full guest view built from existing bt_b data. List view with search and Repeat filter. Profile view with contact info, stay summary, and full stay history. What's New updated. 954 lines. |
| v1.1.0 | May 2026 | Password removed from source, replaced with pre-computed SHA-256 hash. Silent save failure now shows visible error banner. Export and import JSON backup added with file validation and confirm modal. What's New modal added. |
| v1.0.0 | May 2026 | MVP complete. Login, calendar, full booking lifecycle, cleaner flow, payment tracking, turnaround detection, localStorage persistence, all bookings list, maintenance blocks, occupancy tracker. 23 checks passing. |

Next release: v1.5.0 (Navigation)

---

*End of CLAUDE.md — Do not modify TIER 1 without explicit owner instruction.*
