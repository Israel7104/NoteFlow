# Copilot project instructions for NoteFlow

## Stack

- Expo + React Native + TypeScript strict
- Expo Router for navigation
- Zustand with persist + AsyncStorage
- React Native Paper for UI system
- FlashList for large lists
- Zod for validation

## Architecture

- app/: routes/screens
- components/: reusable UI
- store/: state and business actions
- types/: data contracts and type guards
- constants/: theme tokens

## Rules

- No any unless strictly unavoidable.
- Keep domain logic out of presentational components.
- Use typed actions in store and selectors in screens.
- Preserve light/dark support via useColorScheme and theme tokens.
- Prefer small focused commits by feature.

## Performance

- Use FlashList for lists and set estimatedItemSize.
- Avoid expensive operations inside renderItem.
- Use memoized filtering where needed.

## Navigation

- Tabs for top-level sections.
- Dynamic stack routes for details.
- Modal route for creation flow.
