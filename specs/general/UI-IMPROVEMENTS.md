# UI/UX Improvements

## Summary

Reviewed the mobile rooms interface shown in the screenshot. The screenshot corresponds to [apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx](apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx), not [apps/frontend/src/screens/GameScreen/GameScreen.tsx](apps/frontend/src/screens/GameScreen/GameScreen.tsx). The dominant issues are decorative shell noise, duplicated framing in the header, and overloaded room cards.

Additional project-wide consistency pass completed across shared frontend UI:

- standardized repeated 42px icon controls into a shared [apps/frontend/src/components/IconButton/IconButton.tsx](apps/frontend/src/components/IconButton/IconButton.tsx)
- tightened shared button sizing and alert/modal button rhythm to reduce oversized stacked CTAs
- removed duplicated room-state copy where player counts were shown both in a badge and again in the room meta line
- widened the Rooms title header enough to avoid unnecessary truncation on narrow phones

Installed skills used for this audit:

- `react-native-design`
- `game-ui-design`
- `ui-ux-reviewer`

## Critical Issues

### Issue: Decorative background competes with the primary task

**Current State**: [apps/frontend/src/components/ScreenContainer/ScreenContainer.tsx](apps/frontend/src/components/ScreenContainer/ScreenContainer.tsx) injects multiple large ambient shapes and a bottom scrim behind every screen.
**Problem**: On a compact phone viewport these shapes read as arbitrary blocks behind the content. They compete with the room list before the user has scanned a single actionable element.
**Recommendation**: Disable default decorations for the rooms screen or replace them with one subtle, low-contrast glow localized to the hero/header area.
**Impact**: Restores visual hierarchy and makes the room list the clear focal point.
**Implementation Notes**: Add a lean `ScreenContainer` variant for utility/list screens, or pass `showDecorations={false}` from [apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx](apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx) and decorate locally only when needed.

### Issue: Header chrome is double-framed and wastes vertical space

**Current State**: [apps/frontend/src/components/ScreenHeader/ScreenHeader.tsx](apps/frontend/src/components/ScreenHeader/ScreenHeader.tsx) renders a large icon tile and also wraps `rightContent` in an extra capsule, while [apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx](apps/frontend/src/screens/RoomsScreen/RoomsScreen.tsx) passes another framed profile button inside it.
**Problem**: This creates stacked shapes in the top-right corner and pushes the room content lower than necessary. The header looks ornamental instead of functional.
**Recommendation**: Split the header into a compact toolbar plus a lean hero block, and remove the outer `rightContent` wrapper for screens that already pass a standalone button.
**Impact**: More room for primary content and a cleaner, calmer top area.
**Implementation Notes**: Add a compact `ScreenHeader` variant for list screens and keep only one framed surface per control.

### Issue: Room cards duplicate status and action semantics

**Current State**: [apps/frontend/src/screens/RoomsScreen/components/RoomList/RoomList.tsx](apps/frontend/src/screens/RoomsScreen/components/RoomList/RoomList.tsx) uses multiple badges, pills, metadata lines, and action buttons to express essentially one state. The active-game card and in-room card both repeat “return” semantics in more than one place.
**Problem**: Cards feel heavier than the actions they represent. Scanning slows down because the same state is expressed by chips, labels, and CTA text at once.
**Recommendation**: Keep one status chip, one metadata row, and one primary CTA per card. If the user is already in a room, show one `Return` action only and remove duplicate “return” badges.
**Impact**: Faster scanning, lower cognitive load, and more obvious actions.
**Implementation Notes**: Rework the room-card hierarchy before changing colors or shadows. Fix structure first, then styling.

## High Priority Improvements

- Increase tiny room-status pills from `11px` to at least `14px` to satisfy handheld game readability guidance.
- Move the primary create-room action closer to the thumb zone on compact screens instead of embedding it in a dense section bar.
- Make the active-game card visually distinct through layout priority, not by stacking more badges.
- Give the empty state one direct action path, not just explanatory copy.
- Continue replacing ad-hoc inline `Pressable` icon controls with the shared [apps/frontend/src/components/IconButton/IconButton.tsx](apps/frontend/src/components/IconButton/IconButton.tsx) where the same 42px framed control pattern appears.
- Continue collapsing repeated small CTA styles into shared button variants instead of screen-local helper functions.

## Medium Priority Enhancements

- Standardize radius and shadow language across list cards, pills, and buttons.
- Reduce hero/header height so the first room card is visible without feeling buried.
- Replace decorative framing around the profile button with one cleaner icon-button treatment.

## Low Priority Suggestions

- Add subtle press feedback on room cards and action buttons.
- Reduce accent yellow usage to one primary action per viewport.
- Add avatar or host identity cues only if they support faster room selection.

## Positive Observations

- The screen already has clear primary user tasks: join a room, return to a room, or create a room.
- Touch target heights are mostly acceptable for mobile.
- The data model is simple enough that a cleaner hierarchy can be implemented without a large architectural change.
- The frontend now has a clearer baseline for shared UI rhythm because icon controls and modal/alert button sizing are less ad-hoc than before.
