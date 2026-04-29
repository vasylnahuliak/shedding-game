## Dev environment tips

- Use Component.tsx, Component.types.ts, Component.settings.ts, Component.test.tsx structure for component
- Use absolute imports (`@/...`) for src-root modules (components, context, hooks, services, shared, types, utils, config, screens). Use relative imports (`./`, `../`) only for siblings or files in the same feature folder.
- Do not use setLayoutAnimationEnabledExperimental because it does not work in the New Arch
- Do not export or re-export component props types from component `index.ts` barrels by default. Keep them internal unless a type is intentionally part of the component's public API and has a real external consumer.

## React Compiler policy

- React Compiler is enabled for this app. Do not introduce `React.memo`, `useMemo`, or `useCallback` by default.
- Prefer plain components, inline derived values, and inline handlers unless there is a documented reason not to.
- Allowed exceptions: `Context.Provider` value identity, third-party APIs that require stable references, measurably expensive computations, or a proven correctness/performance issue.
- If manual memoization is added, include a short code comment explaining why the exception is needed.
