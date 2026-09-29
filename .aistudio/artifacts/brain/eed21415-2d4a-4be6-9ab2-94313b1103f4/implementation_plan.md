# Architectural Roadmap: System-Wide Mobile UI & Ergonomics Polish

## Executive Overview
Debonair LTD (Unit-02) Industrial Engineering Daily Control is deployed on industrial tablets, handheld smartphones on the sewing floors, and supervisory mobile terminals across 34 production lines. This implementation plan establishes a complete, production-grade architectural roadmap to enhance touch ergonomics, viewport responsiveness, thumb-zone accessibility, and handheld data entry speed across all core views.

---

## 1. Core Ergonomic & Handheld Architecture Standards

### 1.1 Touch Targets & Thumb-Zone Grid
- **Minimum Tap Target:** Enforce a strict minimum of `44x44px` (or `48x48px` where gloves/fast shop-floor interaction occurs) for all clickable controls, toggles, selectors, and dropdown triggers (`touch-manipulation`, active states `active:scale-[0.98]`).
- **Thumb Zone Optimization:** Position high-frequency primary actions (hourly output submission, checklist confirmation, line filtering, audio/voice entry) within the lower third of the mobile screen.
- **Hardware Safe Areas:** Support `env(safe-area-inset-bottom)`, `env(safe-area-inset-top)`, and notch padding across modern iOS Safari and Android Chrome wrappers (`pb-safe`, `pt-safe`).

### 1.2 Handheld Form Input & Numeric Keypads
- **Numeric & Cycle-Time Fields:** Explicitly set `inputMode="decimal"` or `inputMode="numeric"` on all SMV, target pcs, actual pcs, hourly counts, operator headcounts, and cycle study time inputs so handheld devices summon the large numeric pad instead of the full QWERTY keyboard.
- **Auto-Capitalization & Spellcheck Disabling:** Set `autoCapitalize="none"`, `autoCorrect="off"`, and `spellCheck={false}` on code inputs, PINs, line IDs, employee numbers, and operator ticket IDs.
- **Auto-Advance & Stepper Ergonomics:** Provide rapid tap increment/decrement (`+`, `-`, `+5`, `+10`) controls beside small numeric inputs for one-handed shop floor adjustment.

### 1.3 Mobile Bottom Sheet & Drawer Paradigm
- **Sheet vs Centered Modal:** Convert full-screen or overflowing desktop modal dialogues on viewport `< 640px` into smooth bottom sheets with drag handles, rounded top edges (`rounded-t-3xl`), sticky footers, and independent scrollable bodies (`max-h-[85vh]`).
- **Sticky Submit Actions:** Form submission and primary CTA buttons remain sticky at the bottom of the viewport so users never need to scroll through long tables to confirm actions.

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Universal Shell & Navigation Ergonomics
- **Mobile Persistent Bottom Navigation Bar:**
  - Introduce an ergonomic, semi-transparent mobile navigation dock anchored at the bottom edge (`fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-md border-t pb-safe`).
  - Provide quick 1-tap switching between top daily modules: **Cockpit / Lines**, **Hourly Entry**, **Checklists**, **Simulator**, and **More / Settings**.
- **Top Bar Adaptation:**
  - Collapse expansive top desktop status badges and pill chips into a compact, responsive header on `< 768px`.
  - Provide a clean slide-over drawer for secondary factory diagnostics, sync status, and offline telemetry indicators.
- **Quick-Action Floating Action Button (FAB):**
  - Implement a thumb-reachable floating action trigger on mobile for instantaneous telemetry logging ("Log Hourly Output" / "Report Downtime") without hunting through navigation decks.

### Phase 2: Shop Floor Telemetry & Quick Entry Modals
- **TelemetryQuickEntryModal & Hourly Output Logging:**
  - Convert the multi-line grid table on mobile into swipeable line cards with large, high-contrast numeric steppers (`+1`, `+5`, `-1`).
  - Add quick target completion pills (e.g. `25%`, `50%`, `75%`, `100%`, `110%`).
  - Ensure the numeric keypad does not conceal the input field using `scroll-margin` and flex layout.
- **Working Minutes & Pitch Balancing Handheld Views:**
  - Transform dense multi-column SMV pitch balance tables into compact collapsible accordion cards showing line efficiency, bottleneck alerts, and cycle variance at a glance.

### Phase 3: Daily Checklist & 5S Quality Audits
- **Checklist Touch Optimizations:**
  - Replace tiny desktop checkboxes with tactile touch pads with full card tap areas: green (Pass / Verified), yellow (Warning / Needs Action), red (Critical Downtime / Stop).
  - Add quick-note voice input or predefined quick-chip responses ("Needle Broken", "Bundle Missing", "Operator Absent", "Motor Tripped").
- **Offline Inspection Mode Banner:**
  - Compact mobile badge displaying pending offline audit syncs with single-tap manual flush.

### Phase 4: Line Data Page & Hourly Production Tables
- **Responsive Table-to-Card Flip:**
  - When viewed on screen widths under 768px, render lines either in an ergonomic horizontal swipe carousel or stacked card deck with sticky line headers (`Line 01`, `Line 02`, etc.).
  - Color-coded efficiency progress bars with high-contrast text visible in bright factory floor lighting.
- **Sticky Column Freezing:**
  - For tabular analytics views, freeze the primary column (`Line / Station Name`) while allowing horizontal touch pan on telemetry columns (`Output`, `Target`, `DHU%`, `Eff%`, `WIP`).

### Phase 5: Visual Floor Plan & IE Simulator
- **Visual Floor Plan Pinch & Pan:**
  - Enhance `VisualFloorPlan.tsx` and `FloorPlanLineSetup.tsx` with smooth touch drag-and-pan gestures, double-tap zoom reset, and touch-optimized line selection badges.
- **IE Line Simulator Mobile Mode:**
  - Stack the simulation inputs, workstation breakdown, and pitch graph vertically with large slider handles (`touch-none`, expanded hit areas).
  - Display critical bottleneck alerts and capacity buffers in sticky bottom summary cards.

### Phase 6: System Administration & Settings Deck
- **Settings & Permission Matrix Mobile Layout:**
  - Adjust `SettingsTabbedDeck.tsx` and `SettingsControlCenterPage.tsx` tab rails with horizontal swipe indicators and sticky category headers.
  - Convert multi-user matrix tables into search-and-filter user cards with segmented role control pills.

---

## 3. Verification & Acceptance Criteria
1. **Device Viewport Testing:** Validated across 360x640px (handheld Android), 390x844px (iPhone standard), 412x915px (Samsung Galaxy), and 768x1024px (iPad/Factory Tablet).
2. **Keypad Usability:** Opening numeric keyboards never occludes the active input field or primary save action.
3. **Touch Latency & Feedback:** Zero 300ms tap delay (via `touch-manipulation`), instant ripple/scale feedback on all buttons.
4. **No Horizontal Body Overflow:** Complete prevention of unwanted horizontal window bounce or layout tearing on viewport edges (`overflow-x-clip`, proper container boundaries).
5. **Lint & Build Pass:** Complete compilation through `npm run lint` and `npm run build` without regression.
