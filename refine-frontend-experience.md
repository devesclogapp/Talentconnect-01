# Task: Refine Frontend Experience (Accessibility, Modularization, Transitions)

Refining the Talent Connect frontend by improving typography accessibility, modularizing dashboard components, and adding smooth page transitions.

## Phase 1: Accessibility Refinement (Typography)
- [ ] Define standardized typography tokens in `index.css` (min 11px for micro-texts).
- [ ] Update `ClientDashboard.tsx` micro-texts.
- [ ] Update `ProviderDashboard.tsx` micro-texts.
- [ ] Update `AdminDashboard.tsx` micro-texts.

## Phase 2: ERP Modularization
- [ ] Create `components/admin/StatCard.tsx`.
- [ ] Create `components/admin/InboxItem.tsx`.
- [ ] Create `components/admin/RiskActionModal.tsx`.
- [ ] Create `components/admin/CommunicationModal.tsx`.
- [ ] Refactor `AdminDashboard.tsx` to use new components.
- [ ] Create `components/dashboard/StatCard.tsx` (generic for Provider/Client).
- [ ] Refactor `ProviderDashboard.tsx` and `ClientDashboard.tsx`.

## Phase 3: Flow Micro-interactions
- [ ] Create a `PageTransition` wrapper component.
- [ ] Integrate animations into `AppRoutes.tsx`.
- [ ] Add staggered entry animations to dashboard cards.

## Final Review
- [ ] Run `ux_audit.py` to verify accessibility.
- [ ] Verify build and lint.
