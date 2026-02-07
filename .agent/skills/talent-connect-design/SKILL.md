---
description: Design System and Visual Standards for the Talent Connect Application
---

# Talent Connect Design System

This skill defines the visual identity, typography standards, and structural UI rules for the Talent Connect application. All new screens and refactors MUST adhere to these standards to maintain a premium, cohesive look.

## 1. Typography Core Rules

### Font Family
- **Primary Font**: 'Inter', sans-serif.
- Configured as default in `tailwind.config.js`.

### No Uppercase
- Avoid `uppercase` class for all UI elements (buttons, badges, labels, headers).
- Use **Title Case** or **Sentence Case** instead.

### Letter Spacing (Tracking)
- **Standard**: `tracking-normal` (0px).
- **Forbidden**: `tracking-tight`, `tracking-tighter`, `tracking-wider`, `tracking-widest`.
- Remove any tracking utilities from all elements.

### Font Weight Normalization
- **Rule**: All text smaller than **14px** MUST use `font-normal`.
- **Affected Classes**: `text-xs` (12px), `text-[10px]`, `text-[11px]`, `text-[8px]`.
- **Exceptions**: Only use `font-bold` for prices or high-hierarchy titles >= 14px.

## 2. Global Styles (CSS Variables)

Defined in `index.css`:
- `.meta`: `text-[10px] font-normal tracking-normal`
- `.heading-3xl`: `text-3xl font-bold` (Ensure `tracking-normal`)
- `.btn-primary`: Should be clean, no uppercase.

## 3. Header & Profile Components

### Profile Header Structure (Provider/Client)
- **Top Padding**: `pt-12` for the info section below the cover/avatar area.
- **Hierarchy**:
  1. Name (`heading-3xl`)
  2. Rating Stars (Row of Lucide `Star` icons, size 12, `text-warning`)
  3. Metadata Badges (Verified/Location) using `.meta` + `font-normal`.

### Elevation & Interaction
- Use `backdrop-blur-md` for sticky headers.
- Use `interactive` class for touch-friendly elements.
- Soft borders: `border-border-subtle`.

## 4. Implementation Checklist

- [ ] Is the font weight regular for text < 14px?
- [ ] Is `uppercase` removed?
- [ ] Is letter-spacing reset to 0px?
- [ ] Does the header use reduced top padding (`pt-12`)?
- [ ] Are rating stars visible below the name in profiles?
