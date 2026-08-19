# Full Project UI Design Refinement Report

Date: 2026-08-20
Scope: Rendered frontend audit and design direction refinement
Status: Audit only. No new UI edits were made in this pass.

## Executive Summary

The application has a strong product idea and a clear information architecture, but the interface currently reads as several good-looking screens assembled from different design eras. The most visible symptoms are poorly balanced empty cards, compressed timeline rows, inconsistent type hierarchy, and default-looking typography.

The key issue is not a lack of decoration. It is a lack of shared composition rules:

- Content is often centered inside boxes without a meaningful vertical rhythm.
- Fixed or sibling-driven card heights create large dead areas.
- Metadata competes with primary content instead of supporting it.
- Pages mix tokenized styles with legacy slate/indigo utility styles.
- `Geist` is used globally as the only type family, so every surface has the same visual voice.
- Custom spacing tokens conflict with Tailwind utilities, causing dimensions such as `w-4` to resolve incorrectly unless explicitly repaired.

Recommended final direction: quiet, editorial academic software. Use one expressive display face for page titles and one highly legible UI face for controls and body copy. Make cards content-sized by default, use intentional empty states, and reserve strong color for active intelligence rather than every container.

## 1. Critical Findings

### 1.1 Dashboard timeline is compressed

File: `src/app/dashboard/page.tsx`

The timeline puts a long course title and start time in one non-wrapping row. This creates visual crowding and makes the card feel like a table row trapped inside a timeline card. The attached example shows the title and time competing for the same horizontal space while room and end time sit in a second line with tiny icons.

Improve by:

- Giving the course title its own line.
- Moving the start time into a compact time rail or top-right metadata block.
- Treating room and end time as secondary metadata with a consistent icon-label gap.
- Allowing long course names to wrap to two lines instead of truncating early.
- Keeping the timeline dot and connector visually subordinate to the class content.

### 1.2 Empty Campus Brain card has dead space

File: `src/app/dashboard/page.tsx`

The empty Campus Brain preview is approximately 242px tall while its icon and message occupy roughly 60px. The result looks unfinished rather than intentionally empty.

Improve by:

- Replacing equal-height behavior with a compact empty state around 140-160px.
- Adding a clear action such as `Explore Campus Brain` or `Share an observation`.
- Using a short title and supporting sentence with deliberate line lengths.
- Aligning the empty state vertically with the adjacent Pulse card through shared padding, not forced height.

### 1.3 Typography feels default and undifferentiated

Files: `src/app/layout.tsx`, `src/app/globals.css`

The entire product uses Geist for display, body, labels, and metadata. Geist is clean, but using one family everywhere removes hierarchy and makes the product feel like a starter dashboard.

Improve by:

- Choosing a display face with more character for page titles and hero statements.
- Keeping a neutral UI sans for forms, navigation, data, and chat.
- Defining explicit font tokens: `--font-display`, `--font-ui`, and `--font-mono`.
- Defining a small set of semantic text classes rather than mixing raw utility sizes.
- Auditing Bengali rendering separately; the display face must have a compatible Bengali fallback.

Suggested direction: a restrained editorial display face paired with a highly readable sans UI face. Do not use decorative typography for data-dense surfaces.

## 2. High-Priority Findings

### 2.1 Cards do not share one sizing contract

Observed across Dashboard, Campus Brain, Pulse, Courses, Routine, and Profile:

- Some cards use `rounded-3xl`, others use tokenized radii.
- Some surfaces are padded by content, others are stretched by grid siblings.
- Empty cards and populated cards do not have the same internal rhythm.
- Headers, content, and footer metadata do not follow a common vertical grid.

Recommended card contract:

- Standard card padding: 20px desktop, 16px mobile.
- Header-to-content gap: 16px.
- Content-to-footer gap: 20px.
- Radius: 12px or 16px, consistently.
- Border first; shadow only for elevated or interactive states.
- No fixed height unless the component is explicitly a fixed-format board.

### 2.2 Page headers are still not one system

Campus Brain and Pulse use a newer tokenized style. Courses, Routine, Profile, and experience creation still contain older large heading and slate utility patterns.

Recommended `PageHeader` contract:

- Eyebrow: optional, 11px uppercase.
- Title: 32px desktop, 26px mobile.
- Description: 15px, max-width 560px.
- Action: vertically aligned to title block, never floating at an unrelated baseline.
- Header bottom spacing: 32px; section spacing: 32px.

The existing `PageHeader.tsx` should become the real implementation instead of a mostly unused primitive.

### 2.3 Forms mix visual languages

Login, onboarding, Profile, and experience creation use different card surfaces, labels, helper text, and button treatments.

Recommended form contract:

- Label: 12-13px semibold, 8px gap to control.
- Control: 48-52px height, 12px radius, 16px horizontal padding.
- Helper text: 11-12px, muted, 4-6px below control.
- Field group gap: 20-24px.
- Error text should occupy a predictable block and never shift nearby controls unexpectedly.
- Icon-leading inputs should use a shared field wrapper and fixed 20px icon size.

### 2.4 The project has a utility-token collision

File: `src/app/globals.css`

The custom `--spacing` setup caused classes such as `w-4`, `h-4`, and `w-64` to resolve to 4px and 64px instead of their expected Tailwind dimensions. This was the root cause of invisible field icons and the collapsed sidebar width.

The current override patch reduces the immediate damage, but it is not an ideal long-term design-system strategy.

Recommended fix:

- Remove the custom spacing token names that collide with Tailwind's default spacing scale, or rename them to semantic names such as `--space-1`, `--space-2`, and `--space-4`.
- Stop mixing `--spacing-32` and raw Tailwind utilities in the same component.
- Add a small visual regression check for icon and sidebar dimensions.

### 2.5 Chat has a separate visual language

`ChatShell` intentionally has a specialized layout, but its sidebar, navigation density, composer, and message spacing should share the same tokens as `AppShell`.

Improve by:

- Sharing the same sidebar width contract and collapse control.
- Sharing icon sizes and active-state treatment.
- Giving the chat header a consistent page identity block.
- Keeping the composer compact but giving the disclaimer a stable, low-emphasis position.
- Treating evidence as a structured secondary layer, not another competing card stack.

## 3. Medium-Priority Findings

### Dashboard

- The Copilot hero is visually strong but oversized relative to the timeline below it.
- `Today` uses an all-caps micro-heading while other sections use different heading scales.
- Course list rows rely on hover-only chevrons; touch users need a visible affordance or full-row link treatment.
- The Pulse and Brain previews should share a consistent header height and footer/action alignment.

### Campus Brain

- Shared knowledge should have stronger visual dominance than personal contributions.
- Empty states need a direct contribution action, not only an explanation.
- Privacy and freshness metadata should be grouped into one quiet footer row.

### Campus Pulse

- The live badge and action button compete in the header on smaller widths.
- Domain cards need a consistent title/status/evidence hierarchy.
- Contradiction state should be visually distinct but not louder than the signal itself.

### Courses

- Enrollment and catalog cards currently feel like a separate legacy application.
- Credits should be a compact summary metric, not a visually dominant floating badge.
- Drop actions need stronger destructive hierarchy and consistent touch targets.

### Routine

- Course title, code, room, and time need a stronger information order.
- The timeline marker is decorative but does not currently establish a clear reading path.
- On mobile, course titles should wrap while metadata flows beneath them.

### Profile

- Identity card and edit form need a shared vertical alignment and less oversized empty padding.
- Verified status should be a quiet trust marker, not equal in weight to identity.
- Editable fields should use the same field component as onboarding.

## 4. Low-Priority Polish

- Normalize hover transitions to the existing 150ms/250ms motion tokens.
- Remove arbitrary one-off radii and shadows after the component contracts are established.
- Use icon-only buttons only where the icon is familiar and the tooltip/aria label is present.
- Reduce uppercase tracking in places where it makes text feel noisy.
- Keep decorative gradients limited to hero/auth surfaces; operational pages should remain calm.

## 5. Recommended Design System

### Typography

- Display: expressive editorial face, 32-56px depending on context.
- UI: neutral sans, 13-16px.
- Metadata: 11-12px with restrained contrast.
- Bengali: verify native glyph quality and line-height before selecting a display face.

### Spacing

Use semantic tokens only:

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-12`: 48px

### Surfaces

- Base page: soft neutral background.
- Standard card: white, subtle border, no heavy shadow.
- Elevated card: white, soft shadow, used sparingly.
- Knowledge card: emerald tint only where the content is genuinely shared knowledge.
- Alert card: amber/red only for conflict or action-required states.

### Controls

- Primary button: brand fill, 48px minimum height.
- Secondary button: white or neutral surface, clear border.
- Ghost button: no border, only for low-risk navigation.
- Destructive button: reserved for destructive actions, never used as generic secondary styling.

## 6. Implementation Order

1. Remove or rename spacing-token collisions.
2. Establish display/UI font tokens and test Bengali fallback.
3. Make `PageHeader`, `Card`, `EmptyState`, `Field`, and `Button` real shared primitives.
4. Repair dashboard timeline and empty-state sizing.
5. Normalize Courses, Routine, Profile, and experience creation to the shared primitives.
6. Reconcile AppShell and ChatShell visual contracts.
7. Refine Chat message/evidence/composer hierarchy.
8. Run desktop and mobile visual regression checks.
9. Review contrast, focus states, wrapping, and touch targets.

## 7. Verification Plan

Use only the requested viewports:

- Desktop: 1280x800
- Large desktop: 1440x900
- Mobile: 390x844

For every route, check:

- No horizontal overflow.
- No text clipping or unintended truncation.
- Empty states use content-sized composition.
- Card content is vertically balanced.
- Icons are at least 16px for metadata and 20-24px for feature actions.
- Typography hierarchy is visually obvious without relying on color alone.
- Focus and active states remain visible.
- Bengali and Banglish content retain comfortable line-height.

## Final Assessment

Current state: **Functionally strong, visually inconsistent, and still carrying starter-dashboard patterns.**

The product will feel significantly more professional when the team stops treating each page as an independent composition and instead enforces shared contracts for typography, card height, empty states, forms, and metadata. The dashboard timeline and empty Campus Brain card should be the first implementation targets because they expose the core spacing and hierarchy problems most clearly.
