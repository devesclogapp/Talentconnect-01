# Design System - Financial App

## 1. Colors

### Dark Theme
```css
/* Backgrounds */
--bg-primary: #0A0E27;
--bg-secondary: #151933;
--bg-tertiary: #1C2039;

/* Accent */
--accent-primary: #C6FF00;
--accent-secondary: #8BC34A;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #8E92BC;
--text-tertiary: #5A5F7D;

/* Semantic */
--success: #4CAF50;
--error: #F44336;
--warning: #FF9800;

/* Borders */
--border-subtle: #252945;
--border-medium: #353B5E;
```

### Light Theme
```css
--bg-primary-light: #FFFFFF;
--bg-secondary-light: #F5F7FA;
--bg-tertiary-light: #E8ECF2;
--text-primary-light: #0A0E27;
--text-secondary-light: #5A5F7D;
--border-subtle-light: #E0E4EB;
```

## 2. Typography

```css
/* Font Family */
--font-primary: 'SF Pro Display', -apple-system, sans-serif;

/* Sizes */
--text-xs: 10px;
--text-sm: 12px;
--text-base: 14px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 40px;

/* Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 3. Spacing (8px Grid)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

## 4. Radius & Shadows

```css
/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;

/* Shadows */
--shadow-md: 0 4px 8px rgba(0,0,0,0.15);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
--glow-accent: 0 0 20px rgba(198,255,0,0.3);
```

## 5. Components

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--accent-primary);
  color: #0A0E27;
  padding: 16px 24px;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  border: none;
  transition: all 0.2s;
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  border: none;
}

.btn-icon--accent {
  background: var(--accent-primary);
}
```

### Cards

```css
/* Base Card */
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-subtle);
}

/* Stat Card */
.card-stat {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.card-stat__label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.card-stat__value {
  font-size: var(--text-3xl);
  color: var(--text-primary);
  font-weight: var(--font-bold);
}

/* Credit Card */
.card-credit {
  background: linear-gradient(135deg, #C6FF00 0%, #8BC34A 100%);
  border-radius: var(--radius-2xl);
  padding: 24px;
  min-height: 200px;
}

/* Transaction Card */
.card-transaction {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-transaction__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--accent-primary);
}
```

### Inputs

```css
.input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: 16px;
  font-size: var(--text-base);
  color: var(--text-primary);
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(198,255,0,0.1);
}
```

### Navigation

```css
/* Bottom Nav */
.bottom-nav {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  padding: 12px 16px;
  display: flex;
  justify-content: space-around;
}

.bottom-nav__item--active {
  color: var(--accent-primary);
}

/* Top Nav */
.top-nav {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
}
```

### Charts

```css
.chart {
  width: 100%;
  height: 200px;
}

.chart-sm { height: 80px; }
.chart-md { height: 120px; }

/* Bar Chart */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100px;
}

.bar-chart__item {
  flex: 1;
  background: var(--accent-primary);
  border-radius: 4px 4px 0 0;
}
```

### Badges

```css
.badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
}

.badge--success {
  background: rgba(76,175,80,0.2);
  color: var(--success);
}

.badge--error {
  background: rgba(244,67,54,0.2);
  color: var(--error);
}
```

### Avatar

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-medium);
}

.avatar-lg { width: 64px; height: 64px; }
```

### Number Pad

```css
.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
}

.numpad__key {
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
}
```

## 6. Layout Patterns

```css
/* Analytics Grid */
.grid-analytics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* Transaction List */
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

## 7. Transitions

```css
--transition-base: 0.2s ease;

.transition-all { transition: all var(--transition-base); }
.hover-scale:hover { transform: scale(1.02); }
.active-press:active { transform: scale(0.98); }
```

## 8. Usage Guidelines

**Color Usage:**
- Accent green: CTAs, active states, positive values
- Background layers: primary → secondary → tertiary for depth
- Text: primary (headings) → secondary (labels) → tertiary (disabled)

**Typography:**
- Display (3xl, 4xl): Large amounts, hero numbers
- Heading (xl, 2xl): Section titles
- Body (sm, base): Regular content

**Spacing:**
- Component padding: 16px, 24px
- Element margins: 8px, 12px, 16px
- Section spacing: 24px, 32px

**Components:**
- All interactive elements need hover/active states
- Minimum touch target: 44x44px
- Use transitions for state changes

## 9. Implementation Example

```html
<!-- Primary Button -->
<button class="btn-primary">Continue</button>

<!-- Stat Card -->
<div class="card card-stat">
  <div class="card-stat__label">Total Balance</div>
  <div class="card-stat__value">$6,324.49</div>
</div>

<!-- Transaction -->
<div class="card-transaction">
  <div class="card-transaction__icon"></div>
  <div>
    <div>Fast Food</div>
    <div>12:44 • Max</div>
  </div>
  <div>-$43.8</div>
</div>
```

---

**Platform:** Mobile-First Financial App  
**Themes:** Dark (primary) + Light  
**Grid:** 8px base unit
