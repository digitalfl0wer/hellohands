# HelloHands UI 2.0 Documentation Index

> Quick navigation to all UI 2.0 planning and migration documents

---

## 📖 Document Overview

This folder contains the complete HelloHands UI 2.0 specification, analysis, and implementation plan.

---

## 🎯 Core Documents (Read First)

### 1. **@create-prd.md** — UI 2.0 Product Requirements
**What:** Complete product specification for HelloHands UI 2.0 refresh
**Includes:**
- Problem & Goals
- User personas (Adult/Kid modes)
- Success metrics
- Key experiences (permissions, HUDs, onboarding, gamification)
- Palma mascot spec
- Visual palettes (Adult A2, Kid K2)
- Accessibility requirements

**Read if:** You need to understand WHAT we're building and WHY

---

### 2. **@generate-tasks.md** — Cursor Task List
**What:** Phase-by-phase task breakdown (Phases 0-10)
**Includes:**
- Foundation (tokens, reduced-motion, assets)
- Entry & Permissions
- Layout & IA
- HUDs & Overlays
- Onboarding & Calibration
- Mode Behaviors (Adult/Kid)
- Recovery Patterns
- Progress & Gamification
- Backgrounds & Motion
- Accessibility & QA
- Analytics & Attribution
- Palma Mascot

**Read if:** You're ready to START BUILDING

---

### 3. **@process-task-list.md** — Execution Workflow
**What:** Template for tracking task execution
**Includes:**
- Branch naming conventions (`feat/ui2/*`)
- Progress tracking template
- Acceptance criteria checklist

**Read if:** You need to TRACK PROGRESS during implementation

---

## 🔍 Analysis Documents (Read Second)

### 4. **@ui2-migration-analysis.md** — Comprehensive Gap Analysis
**What:** Deep dive comparing UI 2.0 requirements vs current state
**Includes:**
- 12 area-by-area gap analyses (theme, permissions, layout, HUDs, etc.)
- PRD update recommendations (what to add to existing PRDs)
- Task list additions (Sections 18-29 for `task-list.md`)
- New file structure (21 new components + 4 state files)
- Migration strategy (6-week phased rollout)
- Open questions for stakeholders

**Read if:** You need to understand the FULL SCOPE of changes

---

### 5. **@ui2-update-summary.md** — Quick Reference
**What:** One-page overview of changes needed
**Includes:**
- What's new in UI 2.0 (8 big additions)
- PRD updates required (line-level)
- Task list additions (33 new tasks)
- New files to create (28 total)
- Files to modify (8 total)
- Key gaps (with effort estimates)
- 6-week timeline
- Open questions

**Read if:** You need a QUICK SUMMARY without full details

---

### 6. **@ui2-comparison-table.md** — Side-by-Side Comparison
**What:** Visual comparison tables (current vs UI 2.0)
**Includes:**
- Component inventory (20 components, status for each)
- State management comparison
- Hooks comparison
- Styles & assets comparison
- Flows & screens comparison
- Accessibility features comparison
- Analytics events comparison
- Technical debt identified
- Effort estimation (75 hours / 2 weeks)
- Risk assessment
- Compatibility matrix
- Quick wins (easy tasks to start)
- Blockers (design dependencies)
- Task dependencies (with diagram)
- Feature flag strategy
- Testing checklist (24 items)

**Read if:** You want DETAILED COMPARISON TABLES and VISUAL BREAKDOWN

---

## 🛠️ Implementation Guide (Read Third)

### 7. **@ui2-action-plan.md** — Step-by-Step Implementation
**What:** Day-by-day practical roadmap for 6-week implementation
**Includes:**
- Pre-implementation checklist
- 32 days of detailed tasks (what to build each day)
- Code snippets and examples
- Branch commands for each phase
- Acceptance criteria per task
- Rollout plan (internal QA → beta → full launch)
- Success metrics to track post-launch
- Known issues & workarounds
- Documentation updates checklist
- Final launch checklist

**Read if:** You're ACTIVELY IMPLEMENTING and need daily guidance

---

## 📂 Existing PRD Files (Context)

### `PRD/hellohands-prd-current.md`
Current product requirements for HelloHands MVP
**Needs updates:** Add UI 2.0 goals, flows, and features (see analysis docs)

### `PRD/Tasks/task-list.md`
Current MVP task tracker (Sections 0-17)
**Needs updates:** Add Sections 18-29 (33 new UI 2.0 tasks)

### `PRD/create-PRD.md`
Original PRD template (foundation)

### `PRD/ASL-prd.md`
ASL Video Data pipeline requirements (orthogonal to UI 2.0)

### `PRD/Tasks/ASL-tasks.md`
MS-ASL pipeline task breakdown (orthogonal to UI 2.0)

---

## 🗺️ Recommended Reading Order

### **For Product/Design Stakeholders:**
1. `@create-prd.md` (full spec)
2. `@ui2-update-summary.md` (quick overview)
3. Review open questions in summary

### **For Developers Starting Implementation:**
1. `@ui2-update-summary.md` (quick context)
2. `@ui2-comparison-table.md` (what exists vs what's needed)
3. `@ui2-action-plan.md` (day-by-day guide)
4. `@generate-tasks.md` (task reference)

### **For Project Managers:**
1. `@ui2-update-summary.md` (scope)
2. `@ui2-migration-analysis.md` (full gaps + risks)
3. `@ui2-action-plan.md` (timeline + rollout)

### **For QA/Accessibility Auditors:**
1. `@create-prd.md` (Section 5J: Accessibility requirements)
2. `@ui2-comparison-table.md` (testing checklist)
3. `@ui2-action-plan.md` (Phase 8: Accessibility & QA)

---

## 🎯 Key Numbers

| Metric | Value |
|--------|-------|
| **New Components** | 21 |
| **Components to Update** | 3 |
| **New State Files** | 4 |
| **New Hooks** | 1 |
| **New Tasks** | 33 |
| **Estimated Effort** | 75 hours (2 weeks, 1 dev) |
| **Implementation Timeline** | 6 weeks (phased) |
| **Lottie Assets Needed** | 14+ files |
| **Sticker Assets Needed** | 12-16 files |

---

## 🚧 Critical Path

1. **Theme Tokens v2** (blocks all visual work)
2. **Reduced-Motion Hook** (blocks HUDs, Palma, animations)
3. **Assets Registry** (blocks Palma, stickers)
4. **Permissions Screen** (blocks entry flow)
5. **Kid Mode Engine** (blocks Kid-specific features)

---

## ❓ Unresolved Questions (Needs Stakeholder Input)

1. **Asset Creation:** Who's responsible for Lottie animations? Timeline?
2. **Kid Palette:** Confirm final hex values for K2
3. **Mascot Style:** Hand-sprite vs spark buddy?
4. **Sticker Count:** 12 or 16 for v1? Rarity tiers?
5. **Voice Wake Phrase:** Enabled or tap-to-talk only?
6. **Feature Flag:** Ship under `VITE_UI2_ENABLED=1` initially?
7. **Onboarding Persistence:** Skip carousel for repeat users?

---

## 📊 Success Criteria (Post-Launch)

- [ ] Time-to-first-scan < 15s (Adult), < 30s (Kid)
- [ ] Lesson completion rate +15% vs current
- [ ] Error exits (permission denied) < 5%
- [ ] Reduced-motion compatibility verified
- [ ] Accessibility: VoiceOver/NVDA spot checks pass
- [ ] No regression in existing MVP flows

---

## 🔗 Quick Links

**Planning Docs (This Folder):**
- [UI 2.0 PRD](@create-prd.md)
- [Task List](@generate-tasks.md)
- [Process Guide](@process-task-list.md)
- [Migration Analysis](@ui2-migration-analysis.md)
- [Update Summary](@ui2-update-summary.md)
- [Comparison Table](@ui2-comparison-table.md)
- [Action Plan](@ui2-action-plan.md)

**Current State Docs:**
- [Current PRD](PRD/hellohands-prd-current.md)
- [Current Tasks](PRD/Tasks/task-list.md)
- [ASL Pipeline PRD](PRD/ASL-prd.md)

**Implementation Reference:**
- [README.md](../README.md)
- [Design System Tokens](../src/styles/tokens.css)
- [Tailwind Config](../tailwind.config.ts)

---

## 📝 Document Maintenance

**Owner:** Brie
**Last Updated:** 2025-11-13
**Version:** 1.0

**Update Triggers:**
- Stakeholder decisions on open questions
- Asset creation timeline confirmed
- Phase completion milestones
- Scope changes or additions

---

## 💡 Tips for Using These Docs

1. **Overwhelmed?** Start with `@ui2-update-summary.md` (1-page overview)
2. **Need details?** Use `@ui2-comparison-table.md` (visual tables)
3. **Ready to build?** Use `@ui2-action-plan.md` (day-by-day guide)
4. **Need full context?** Read `@ui2-migration-analysis.md` (comprehensive)
5. **Tracking progress?** Use `@process-task-list.md` (execution template)

---

## 🎉 Let's Build UI 2.0!

All planning documents are complete and ready for implementation. Review, approve, and let's ship a delightful, accessible, kid-friendly ASL learning experience! 🚀

---

**Questions or Feedback?**
Reach out to the team or update this index as decisions are made.

