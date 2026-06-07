# CLAUDE.md — Booking Tracker Project

> This file is read automatically by Claude Code every session.
> It contains the full context needed to work on this project.
> Last updated: 2026-06-07 | Version: v1.6.0-A2 (in progress)

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
- **Verify spec logic against existing codebase patterns before implementing.** If a formula, date range calculation, or logic check in the spec conflicts with how the same operation is handled elsewhere in the codebase, or would produce incorrect results when traced through, stop and flag the discrepancy before writing any code. Propose the correct implementation with reasoning and wait for confirmation. Never silently implement a spec that you can verify is wrong.

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

When v1.7.0 Supabase is built, the data architecture must enforce these principles structurally:

- The shared `guests` table contains only an anonymous internal ID and system timestamps. Nothing else.
- All guest attributes (name, mobile, email) live in `guest_property_profiles` which is scoped per host per property.
- A guest using different phone numbers with different hosts is intentional and correct. Each host sees only the number their guest used with them.
- Row Level Security policies must be written and verified before any data goes into Supabase. No exceptions.
- The AI agent for cross-property intelligence is a separate service with its own permission layer. It is never part of the main app codebase.

### Note for Claude Code

Never propose a feature, data structure, or Supabase schema that violates these principles even if it would be technically simpler or more efficient. Privacy by design means building it right from the start, not adding privacy as a layer on top later.

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
├── index.html      HTML shell (452 lines, ~27KB) — v1.5.4
│                   Contains: HTML structure only. Links styles.css and app.js.
│                   No external dependencies. Works offline.
│
├── styles.css      All CSS (257 lines, ~22KB) — extracted from index.html in v1.5.4
│                   Loaded via <link> tag inside <head>. Cache-busted with ?v=1.5.4
│
├── app.js          All JavaScript (1338 lines, ~75KB) — extracted from index.html in v1.5.4
│                   Loaded via <script src> before </body>. Cache-busted with ?v=1.5.4
│
└── CLAUDE.md       This file. Read by Claude Code every session.
```

**Note:** The app was previously a single index.html file. In v1.5.4 it was split into three files for maintainability. The `<style>` block that was inside `<body>` in v1.5.3 is now a proper `<link rel="stylesheet">` inside `<head>`. Zero logic changes in this refactor.

### 3.2 index.html Internal Structure

CSS and JavaScript are now in separate files (styles.css, app.js). index.html is the HTML shell only.

```
index.html (452 lines)
│
├── head                Lines 1 to 9        DOCTYPE, meta tags, title, <link rel="stylesheet" href="styles.css?v=1.5.4">
├── LOGIN               Lines 12 to 22      Login screen HTML
├── APP                 Lines 23 to 141     App shell, header, occupancy bar, legend, calendar grid, detail panel, bottom nav
├── ADD                 Lines 142 to 177    Add booking modal
├── TURNAROUND          Lines 178 to 184    Same-day turnaround warning modal
├── OVERWRITE WARNING   Lines 185 to 191    Unpaid booking overwrite confirm modal (v1.3.0)
├── EDIT                Lines 192 to 218    Edit booking modal
├── EXTEND              Lines 219 to 221    Extend stay modal
├── CANCEL              Lines 222 to 224    Cancel booking modal
├── CANCEL CONFIRM      Lines 225 to 231    Full cancel double-confirm modal
├── MAINTENANCE         Lines 232 to 242    Block dates modal
├── ALL BOOKINGS        Lines 243 to 264    All bookings list modal
├── IMPORT FILE         Lines 265 to 267    Hidden file input for import
├── IMPORT CONFIRM      Lines 268 to 281    Import confirm modal with validation
├── WHAT'S NEW          Lines 282 to 305    Release notes modal
├── IMPORTANT NOTICES   Lines 306 to 317    Smart notices panel (v1.5.0)
├── SETTINGS            Lines 318 to 384    Property profile/settings modal (v1.5.0)
├── WELCOME             Lines 438 to 449    First-time welcome nudge modal (v1.5.0)
│
└── script              Line 450            <script src="app.js?v=1.5.4"></script>
                                            All application logic is in app.js (1338 lines)
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
               coE, coL, platform, pay, method, notes, cd, ur, at, type,
               ratePerNight (number|null, optional — nightly rate in ₱),
               extensionRate (number|null, optional — different rate for extended nights),
               originalCo (string|null, optional — original checkout date before extension,
                           set only when extensionRate is also set),
               guestProfileId (number|undefined — links to bt_gp profile id),
               rating (number|undefined — 1–5 star rating, set after guest checks out),
               tags (string[]|undefined — selected review tags, set with rating),
               reviewNotes (string|undefined — private host notes, set with rating)

bt_bl  Blocks array
       Fields: id, from, to, reason, notes

bt_p   Profile object
       Fields: name, addr, type, bed, bath, occ, ci, co, eciAllow, eciFee,
               lcoAllow, lcoFee, pmGC, pmMy, pmBt, pmCs, fullPay, dpPct,
               expHrs, minNights, noSmoke, noPets, noParty, customRule,
               hostName, hostMob, gcash, pencilExpiryHrs, recontact[],
               defaultRate (number|null, optional — default nightly rate in ₱,
                            pre-fills rate field on new bookings),
               cleanerMob (string, optional — cleaner phone number for one-tap SMS),
               calSettings (object, optional — calendar display preferences):
                 tickerEnabled (boolean, default true — show next check-in ticker banner)
                 hoverEnabled (boolean, default true — enable booking group highlight)
                 hoverMode (string "hover"|"click", default "hover" — highlight trigger mode)

bt_bh  Booking history archive (cancelled pencil bookings + cancelled confirmed bookings)
       Fields: same as bt_b entries + cancelReason + archivedAt (timestamp)
       cancelReason values:
         Pencil: "host_cancelled" | "booking_confirmed" | "expired"
         Confirmed: "confirmed_cancelled_full" | "confirmed_cancelled_partial"
       Additional fields for confirmed_cancelled_full: cancelledBy ("host")
       Additional fields for confirmed_cancelled_partial: originalCi, originalCo, cancelledDays (array)

bt_gp  Guest profiles array (v1.6.0-A1b)
       Fields mapping to Supabase guests table (shared, anonymous):
         id (Number), createdAt (Number)
       Fields mapping to Supabase guest_property_profiles table (private per host):
         name (String), mobiles (Array), email (String),
         isBlacklisted (Boolean), blacklistReason (String), blacklistDate (Number|null — Date.now() timestamp),
         averageRating (Number|null — mean of all rated confirmed stays across bk+bh),
         tags (String[] — union of all tags from rated stays), notes (String), hasConfirmed (Boolean)
       Relationship tracking (localStorage only — becomes joins in Supabase):
         linkedBookingIds (Array), linkedHistoryIds (Array), mergedProfileIds (Array)
       Sync points:
         commitBk() — creates/links profile on every new booking (all creation paths)
         archiveBk() — moves bookingId from linkedBookingIds to linkedHistoryIds
         saveEdit()  — propagates name/mobile/email changes to profile
         confirmPcl() — sets hasConfirmed=true when pencil converts to confirmed
         migrateToGP() — one-time migration on first load when gp is empty

bt_gpnid  Next guest profile ID counter (integer string)
          Loaded on login, safety-recalculated to max(stored, max profile id + 1)

Module-level variables added in v1.6.0-C:
  repMonth (string|null) — null = current month, "YYYY-MM" = specific month, "all" = all time
  repView  (string)      — "bookings" or "nights"; controls bar graph metric

Module-level variables added in v1.6.0-A2:
  selectedGPId           — integer|null — profileId of the gp profile selected via searchGP() dropdown;
                           cleared in openAdd(), closeAdd(), and on "different person" in repeat guest modal
  pendingBookingForRepeat — object|null — holds the uncommitted booking while repeat guest modal is open
  pendingRating          — object — keyed by bookingId; stores pending star count (number),
                           pending tags (array, key = bookingId+'t'), pending notes (string, key = bookingId+'n')

bt_bell  Bell last-seen timestamp (integer, milliseconds)
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

### 4.2 Full Feature List (all verified working as of v1.5.5)

**Calendar — Color System + Hover Groups**
- **13 tile states (v1.5.1):** pm (past empty), pbk (past ended booked), pco (past ended checkout), av (available future), av.td (today empty), bk (confirmed future — any payment status), co (future checkout), og.pog (ongoing past days), og.td (ongoing today), og (ongoing future paid), og.og-upd (ongoing future unpaid — orange border), mn2 (maintenance), tr (turnaround). Yellow tiles (yel/yel.td) removed in v1.5.1.
- **Channel 1 — Tile bg = type:** white #FFFFFF available; green #BBF7D0 confirmed booked/checkout (v1.5.1); #DCFCE7 past ongoing; #4ADE80 today ongoing; #86EFAC ongoing future; #F3F4F6 maintenance/past-empty; #F9FAFB past ended
- **Channel 2 — Tile border = time:** today=#F59E0B gold ring (v1.5.1, always wins); ongoing=#16A34A green; ongoing unpaid=#C2410C orange; turnaround=pulsing #E8A020 amber (never overridden); default transparent or light gray
- **Channel 3 — Chip bg = payment:** .cpf #15803D/white fully paid; .cpp #C2410C/white partial; .cpn #991B1B/white unpaid; .cpd #4B5563/white pending. Past fully-paid chips at opacity 0.5 (.cfaded); past unpaid/partial chips at full opacity so outstanding debt stays visible
- **Payment badge (v1.5.1):** `.upd-bdg` "!" badge (orange, top-left) on all future confirmed unpaid/partial tiles when `prof.fullPay===false`. Replaces ext badge and yellow tile as payment attention signal.
- **3D card depth:** today+future tiles raised (drop shadow); past empty flat (no shadow); past ended/ongoing-past inset shadow
- **Hover group highlight (v1.4.0, gold in v1.5.1):** `data-bid` on every booked tile, `data-blid` on maintenance tiles. Mouseenter calls `hvOn(sel)` — all tiles with matching bid get `.hv-on` (gold #F59E0B border, scale 1.03, lift shadow, z-index 10); calendar grid gets `.hv-active` dimming all other tiles to opacity 0.45. `hvOff()` clears with 60ms debounce. Skipped on touch devices. `.dy.td.hv-on` gets darker amber #D97706. **Turnaround fix:** outer `.dy.tr` also receives `.hv-on` when either half is in the group — tile lifts as one unit; `overflow:visible` on `.dy.tr.hv-on` unclips shadow and scale
- **Cross-month indicators (v1.4.0):** `← cont.` label on d===1 if booking started in prior month; `cont. →` label on d===days if booking ends in next month
- **Split turnaround tile:** `.dy.tr` is flex-column; `.tr-top` (outgoing) and `.tr-bot` (incoming) each have `data-bid` and independent inline background reflecting stay type (#86EFAC ongoing, #BBF7D0 confirmed — v1.5.1)
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

**Guest Masterlist (v1.6.0-A2 — rebuilt from bt_gp)**
- Guest list reads from gp[] array (bt_gp). buildGuests() looks up linked bk/bh entries via profile.linkedBookingIds and profile.linkedHistoryIds
- Sort: non-blacklisted by stay count descending; blacklisted profiles at bottom
- Filter chips: All / Confirmed / Pencil Only / 🚫 Blacklisted / ⭐ Unrated
- Guest card shows initials avatar, name, stay count, next/last date, platform badges, average rating stars, Blacklisted badge, Pencil only badge
- Merge suggestion banner shown when two profiles share same normalized name but different mobiles; Merge button calls mergeProfiles(id1,id2)
- Tap card calls openGMProf(profileId) — takes integer id, NOT name+mobile
- Profile view shows all linked stays from bk+bh with stayLabel(), rating section per stay (buildRatingHtml), blacklist panel
- Blacklist feature: showBlacklistPanel(id) → confirmBlacklist(id); removeBlacklist(id) → execRemoveBlacklist(id)
- Rating accessible from profile view (inProfile=true) and from booking detail panel (inProfile=false)

**Guest name search dropdown (v1.6.0-A2)**
- Typing 3+ chars in #an triggers searchGP() — matches gp[] by name, shows up to 3 rows with avatar+name+mobile+stay count+blacklist badge
- selectGP(profileId) fills name/mobile/email fields and sets selectedGPId; calls checkBlacklistInForm()
- checkBlacklistInForm() called on #am oninput and after selectGP; shows red #bl-warn-add warning if profile isBlacklisted
- selectedGPId cleared on openAdd(), closeAdd(), and "different person" repeat guest path

**Repeat guest detection (v1.6.0-A2)**
- Triggered in saveAdd() confirmed direct path if rgProfile.hasConfirmed is true
- showRepeatGuest() opens #ov-repeat-guest modal showing last stay, avg rating, notes, mobile diff warning
- "Same person" links booking to existing profile; "Different person" commits a new separate profile
- Pencil bookings never trigger repeat guest modal

**Rating and review system (v1.6.0-A2)**
- buildRatingHtml(b, inProfile) injected into showDet() and openGMProf() stay history
- Only visible for past confirmed bookings (b.co < TD() and b.type !== 'pencil')
- Star tap calls setRatingStar(bookingId, n); tag tap calls toggleRatingTag(tagName, bookingId)
- Conflicting tag pairs auto-deselect: Would host again ↔ Would not host again, Clean ↔ Left a mess, Quiet ↔ Noisy
- saveRating() writes rating/tags/reviewNotes to bk or bh entry, recalculates profile.averageRating and profile.tags
- editRating() temporarily clears b.rating to force rate UI re-render, pre-fills pendingRating state

**Important Notices — Guests to Rate section (v1.6.0-A2)**
- New section at bottom: past confirmed bookings with no rating, sorted by most recent checkout, max 5
- "Rate now" navigates calendar to booking and opens detail panel

**Important Notices (v1.5.0 — full rewrite)**
- 🔔 bell in header opens dynamic notices panel
- Section 1: Cleaner Reminder — all guests checking out on the nearest future checkout date; today's checkouts use amber pulse (.cu) row
- Section 2: Pencil Holds Expiring Soon — pencil bookings with ci within 48 hours
- Section 3: Recently Expired Pencil Bookings — bh entries with cancelReason="expired" in the last 7 days (not tappable)
- Section 4: Upcoming Confirmed Bookings — fully paid confirmed bookings with ci >= today
- Section 5/6: Payment sections — conditional on prof.fullPay; if true: one "Awaiting Payment" section; if false/unset: separate "Awaiting Full Payment" and "Partial Payment — Balance Due" sections
- Re-contact Suggestions — only rendered if prof.recontact has entries; shows displaced pencil guests after a cancellation; auto-cleaned after 7 days via svP()
- Pencil bookings excluded from all payment sections via isConf() guard

**Pencil Booking Type (v1.5.0)**
- Soft hold booking type — dotted amber tile (.dy.pcl), no cleaner flow, no payment fields
- Auto-expiry: pencilExpiryHrs hours before ci (default 24h); expired pencils archived to bt_bh with cancelReason="expired"
- Midnight check via scheduleMidnightCheck(); also checked on login, tab switch, renderCal
- Expiry toast with "View Details" link; expiry details modal
- Pencil panel: multiple pencil holds on same day shown as stacked panel with Confirm/Cancel actions
- Confirm pencil: converts to confirmed, sets payment, cancels other pencil holds on same dates (displaced flow)
- Cancel pencil: archived to bt_bh with cancelReason="host_cancelled"
- Displaced flow: when confirmed booking overlaps pencil holds, all displaced pencils archived with cancelReason="booking_confirmed" and shown to host for contact

**Re-contact Flow (v1.5.0)**
- execFull() after full cancellation checks bh for displaced pencil guests (booking_confirmed) whose dates overlap the cancelled booking
- Adds them to prof.recontact[] with storedAt timestamp
- openNotices() cleans recontact entries older than 7 days on every open

**Bottom Navigation (v1.5.0)**
- Fixed bottom nav bar (#bnav): Home, Guests, Reports, More
- showTab() switches tab panes and active button state
- More tab: All Bookings, Export, Import, What's New, Sign out

**Property Profile / Settings (v1.5.0)**
- ⚙️ button in header opens full settings modal
- Sections: Property Details, Check-in/out Times (with early/late fee toggles), Payment Policy, House Rules, Host Contact
- Saved to bt_p via svP(); loaded on login
- prof.fullPay controls payment section layout in Important Notices
- prof.pencilExpiryHrs controls pencil auto-expiry duration

**Notification Bell (v1.3.0 — superseded by Important Notices in v1.5.0)**
- Legacy openBell() function retained but ov-bell modal marked dormant in HTML
- openNotices() is the active notices function bound to the 🔔 button

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

**v1.5.1: Visual and UX Cleanup — Complete**
- Color system: confirmed tiles changed from blue (#DBEAFE) to green (#BBF7D0); yellow unpaid tiles (.dy.yel) removed entirely; turnaround halves now always green
- Today ring + TODAY badge changed from blue (#1D4ED8) to gold (#F59E0B) across .dy.td, .dy.og.td, .tp2
- Hover group changed from blue to gold (.hv-on); .dy.td.hv-on gets darker amber #D97706
- Payment badge: .upd-bdg "!" (orange, top-left) on future confirmed unpaid/partial tiles when prof.fullPay===false; replaces ext badge
- Pencil tile fixes: single tap → showPclDet in dpanel; multi-pencil → showPclList in dpanel; Edit button in detail view; editPcl() pre-fills form locked to pencil type; saveAdd() edit branch updates record in-place
- closeAdd() helper resets editId and restores type toggle state on cancel
- Welcome modal flag moved from sessionStorage to localStorage (bt_setup_done) — persists across reloads
- Profile fullPay checkbox disables downpayment % field on both open and live toggle
- openAdd() co default fixed to aD(pre||TD,1) — always defaults to day after ci
- Conflict check fixed: gB(ds,null) replaces getConfOn(ds) so checkout-on-new-ci is a turnaround, not a hard error

**v1.5.0: Navigation + Pencil + Intelligence — Complete**
- Bottom navigation bar: Home, Guests, Reports, More
- Property profile/settings modal (⚙️) in header
- First-time welcome nudge for new users
- Pencil booking type: soft holds with dotted amber tiles, displaced guest flow, auto-expiry with toast + history archive (bt_bh)
- All Bookings filter chips: All / Confirmed / Pencil
- Smart Important Notices: real cleaner reminders (all guests on nearest checkout date), pencil expiry alerts, recently expired archive, upcoming confirmed, payment sections (conditional on fullPay policy), re-contact suggestions
- Guest intelligence: dedup by name+mobile, Confirmed/Pencil-Only filter chips, full history from bt_b+bt_bh, stayLabel() for all entry types, Copy buttons for mobile/email
- Cleaner flow excluded from pencil booking detail view
- Re-contact flow: execFull() populates prof.recontact[] when cancellation frees up dates that displaced pencil holds; 7-day auto-cleanup in openNotices()

**v1.6.0: Reports — NEXT**
- Monthly income summary (Reports tab)
- PWA installable on phone home screen

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
| v1.5.5 | Jun 2026 | Critical data protection fix. Cancelled confirmed bookings now archived to bt_bh instead of permanently deleted. execFull() archives with cancelReason="confirmed_cancelled_full" and cancelledBy="host" before removal. confPart() archives a snapshot with cancelReason="confirmed_cancelled_partial", originalCi, originalCo, cancelledDays before any trimming. archivePcl() renamed to archiveBk(b,reason,extra) to support both pencil and confirmed archiving. stayLabel() updated with all 5 cancelReason labels including new confirmed cancel types. Guest Masterlist history now shows complete booking history including cancelled confirmed stays. Export/import of bt_bh already correct — confirmed. |
| v1.5.4 | Jun 2026 | Architectural file split. index.html (452 lines) separated into styles.css (257 lines, 22KB) and app.js (1338 lines, 75KB). CSS moved from inline `<style>` in `<body>` to proper `<link rel="stylesheet">` in `<head>`. Both files cache-busted with ?v=1.5.4 query string. Zero logic changes, zero data structure changes. All 6 browser verification flows pass with zero console errors. |
| v1.5.3 | Jun 2026 | Bug fix release — 18 fixes across data integrity, pencil flow, calendar, and code hygiene. C1: saveProf() now preserves prof.recontact and prof.pencilExpiryHrs across saves. C2/M8: doLogout() clears midnight timer and resets all state globals. C3: confirmOw() checks turnaround before removing overwritten booking, preventing data loss on cancel. M1: pencil edit branch now runs conflict check. M2: openExt() uses strict mid-stay check (b2.ci<nd&&b2.co>nd) not getConfOn, so turnaround-day extensions are no longer blocked. M3: openNotices() runs checkPencilExpiry() first. M4: archivePcl() adds archivedAt timestamp; Section 3 filter uses it. M5: loadData() migrates missing at field; renderList() sort has fallback. M6: renderCal() clears hv-active before innerHTML. M7: TD is now a function (toLocaleDateString en-CA) — local time, no staleness. M8-M10: state cleanup, confirmed-only cG(), turnaround past tile uses .ptr class. L3: openBell() and ov-bell modal removed. L4-L5: nav gold, legend note corrected. L6: minNights validation in confirmed add path. L7: cancelPcl splits into cancelPcl(id)+execCancelPcl(id), no browser confirm(). L8: Section 2 pencil expiry uses local-time calculation. L9: checkPencilExpiry() has reentrancy guard. L10: renderGM/openGMProf use name+mobile for dedup-safe lookup. 2050 lines. |
| v1.5.1 | Jun 2026 | Visual and UX cleanup — green color system replaces blue confirmed tiles; yellow unpaid tiles removed; today ring and TODAY badge changed to gold (#F59E0B); hover group changed to gold with darker amber for today-in-group; payment badge (!) on unpaid/partial future tiles when fullPay=false; pencil tile taps now show in detail panel (showPclList/showPclDet); Edit pencil flow with in-place save; closeAdd() helper; bt_setup_done moved to localStorage; profile fullPay disables dp field; openAdd co default fixed; conflict check uses gB() so turnaround-day ci no longer errors. 2037 lines. |
| v1.5.0 | Jun 2026 | Navigation overhaul — bottom nav bar (Home/Guests/Reports/More), tab system, property profile/settings modal (⚙️), first-time welcome nudge. Pencil booking type — soft holds with dotted amber tiles, displaced guest flow, auto-expiry with toast + history archive (bt_bh), All Bookings filter chips. Smart Important Notices — real cleaner reminders, payment attention, pencil expiry, re-contact suggestions. Guest intelligence — dedup by name+mobile, confirmed/pencil-only filter, full history from bt_b+bt_bh, copy buttons. |
| v1.4.0 | May 2026 | Calendar UX overhaul — 5 areas, CSS+JS only, zero data changes. Area 1: new color system (white av, blue bk/co, yellow yel, green og spectrum, near-white past, chip colors cpf=#15803D/cpp=#C2410C/cpn=#991B1B/cpd=#4B5563 white text, cfaded opacity 0.5 for past paid). Area 2: hover group highlight — data-bid/data-blid on all tiles, hvOn(sel)/hvOff() 60ms debounce, .hv-on scale 1.03 blue border lift, .hv-active dims non-hovered to 0.45; turnaround outer .dy.tr gets hv-on so full tile lifts (.dy.tr.hv-on overflow:visible unclips shadow). Area 3: ← cont. / cont. → cross-month boundary labels. Area 4: legend redesign 3 sections (tile color, payment chip, border meaning) + italic note. Area 5: @media(min-width:768px) responsive — 900px wrapper, 82px tiles, 14px dn2, 11px chip. 1168 lines. |
| v1.3.2 | May 2026 | Calendar visual polish. Unified booked+checkout tile to soft blue (#DBEAFE/#EDF4FF) — checkout amber removed, Checkout legend swatch removed. Past date hierarchy: past-empty=#EFEFEF flat, past-booked/checkout=#EDF4FF inset, past-ongoing=.og.pog #DCF0E4; all gray #BBBBBB date nums normal weight. Chips saturated white text: cpf=#1B7E35, cpp=#E65100, cpn=#C62828, cpd=#616161; .cid/.cod de-colored. Date picker min=TD in openAdd(), aci onchange updates aco.min. 1073 lines. |
| v1.3.1 | May 2026 | Three-channel color system and 3D card depth. Channel 1 bg=type (adds .rsv pending/reserved, light purple). Channel 2 border=time (ongoing green on all days, today blue ring always wins). Channel 3 chip=payment (.cpf/.cpp/.cpn/.cpd replaces .upd dotted border). Past tiles flat/inset, today+future tiles raised. Turnaround shows independent payment chip per guest. Adds payChipClass() and dirClass() helpers. Legend chip mini-row. 1070 lines. |
| v1.3.0 | May 2026 | Calendar polish and alerts. Past tile visual states (gray/muted pink/muted amber). Ongoing bookings pulse green. Unpaid/pending tiles get dotted amber border. Unpaid overwrite prompt in saveAdd. 🔔 Alerts bell with 4-section notification panel. 1057 lines. |
| v1.2.0 | May 2026 | Guest Masterlist added. Header 👥 Guests button opens full guest view built from existing bt_b data. List view with search and Repeat filter. Profile view with contact info, stay summary, and full stay history. What's New updated. 954 lines. |
| v1.1.0 | May 2026 | Password removed from source, replaced with pre-computed SHA-256 hash. Silent save failure now shows visible error banner. Export and import JSON backup added with file validation and confirm modal. What's New modal added. |
| v1.0.0 | May 2026 | MVP complete. Login, calendar, full booking lifecycle, cleaner flow, payment tracking, turnaround detection, localStorage persistence, all bookings list, maintenance blocks, occupancy tracker. 23 checks passing. |

Next release: v1.6.0 (Reports + PWA)

---

*End of CLAUDE.md — Do not modify TIER 1 without explicit owner instruction.*
