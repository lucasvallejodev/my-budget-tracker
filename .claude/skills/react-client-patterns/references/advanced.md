> Summary: three effect rules for React 19.2: read the latest callback with `useEffectEvent` (`advanced-use-latest`), never list an Effect Event as a dependency (`advanced-effect-event-deps`), and run app-wide initialization once per load (`advanced-init-once`).

# Advanced effect patterns

`useEffectEvent` is stable in React 19.2, which the web app uses. It replaces the older "store the handler in a ref and update the ref in an effect" pattern; do not write that pattern in new code.

## advanced-use-latest

An effect that calls a callback prop re-runs every time the parent passes a new function. Wrap the callback in `useEffectEvent`: the effect then depends only on the values that should restart it, and still calls the latest callback.

Avoid:

```tsx
const SEARCH_DEBOUNCE_MS = 300;

export function PayeeSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <Input
      aria-label="Search payees"
      value={query}
      onChange={event => setQuery(event.target.value)}
    />
  );
}
```

Prefer:

```tsx
const SEARCH_DEBOUNCE_MS = 300;

export function PayeeSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const search = useEffectEvent(onSearch);

  useEffect(() => {
    const timer = setTimeout(() => search(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Input
      aria-label="Search payees"
      value={query}
      onChange={event => setQuery(event.target.value)}
    />
  );
}
```

## advanced-effect-event-deps

The function returned by `useEffectEvent` changes identity on purpose and must not appear in a dependency array; listing it re-runs the effect on every render and fails the React Hooks lint rule. Depend on the reactive values; call the Effect Event only from inside the effect or from subscriptions the effect creates.

Avoid:

```tsx
const notifyChange = useEffectEvent(onChange);

useEffect(() => {
  const media = window.matchMedia(ReducedMotionQuery);

  media.addEventListener('change', notifyChange);

  return () => media.removeEventListener('change', notifyChange);
}, [notifyChange]);
```

Prefer:

```tsx
const notifyChange = useEffectEvent(onChange);

useEffect(() => {
  const media = window.matchMedia(ReducedMotionQuery);

  media.addEventListener('change', notifyChange);

  return () => media.removeEventListener('change', notifyChange);
}, []);
```

## advanced-init-once

Components remount (navigation, `key` changes) and Strict Mode runs effects twice in development, so `useEffect(() => …, [])` is not "once per app load". App-wide setup (migrating stored form memory, registering a global listener) needs a module-level guard or a top-level call in the module that owns it.

Avoid:

```tsx
export function ApplicationShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    migrateRememberedFields();
  }, []);
}
```

Prefer:

```tsx
let rememberedFieldsMigrated = false;

const migrateRememberedFieldsOnce = (): void => {
  if (rememberedFieldsMigrated) return;

  rememberedFieldsMigrated = true;
  migrateRememberedFields();
};

export function ApplicationShell({ children }: { children: ReactNode }) {
  useEffect(migrateRememberedFieldsOnce, []);
}
```

A stored preference that changes how the page looks needs the pre-paint script in `rendering-hydration-no-flicker` ([rendering.md](rendering.md)) instead.
