# CLAUDE instructions for NoteFlow

Stack: Expo SDK 54, React Native, TypeScript strict, Expo Router, Zustand, AsyncStorage, FlashList, Zod, React Native Paper.

Project rules:

1. Keep route code in app/ and reusable UI in components/.
2. Keep state/actions in store/ with typed interfaces from types/.
3. Never introduce any unless strictly required.
4. Respect dark/light theme tokens from constants/theme.ts.
5. Use FlashList + estimatedItemSize for list screens.
6. Validate form data with Zod before writing to store.
7. Prefer simple, testable functions and avoid duplicated business logic.
