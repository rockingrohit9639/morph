# @morph-ui/core

A tiny, framework-agnostic library that makes UIs adapt to individual user habits. Track interactions, rank by frecency, surface what matters — zero settings pages needed.

**4.5KB** · Zero dependencies · Works anywhere JS runs

## Install

```bash
npm install @morph-ui/core
# or
pnpm add @morph-ui/core
```

## Quick start

```ts
import { morph } from '@morph-ui/core'

// Record user interactions
morph.track('sidebar', 'dashboard')
morph.track('sidebar', 'tasks')
morph.track('sidebar', 'tasks')

// Get items ranked by frecency (most used + most recent first)
morph.rank('sidebar')
// → [{ id: 'tasks', score: 2.0, rank: 1, isActive: true },
//    { id: 'dashboard', score: 1.0, rank: 2, isActive: true }]

// Check if a specific item is still actively used
morph.isActive('sidebar', 'dashboard') // → true
```

## How it works

Morph uses a **frecency algorithm** — a combination of frequency and recency with exponential decay. Items used often and recently score high. Items ignored gradually fade.

```
score = oldScore × e^(-daysSinceLastUse × decayConstant) + 1
```

- Use something daily → score keeps growing
- Stop using it → score fades naturally over days/weeks
- One accidental click → barely moves the needle

All data stays in `localStorage` by default. No server, no tracking, no privacy concerns.

## API

### `morph.track(group, id)`

Record an interaction. Call this when a user clicks, opens, or engages with an item.

```ts
morph.track('sidebar', 'settings')
```

### `morph.rank(group)`

Get all tracked items in a group, sorted by frecency score (highest first). Applies read-time decay — scores reflect current relevance, not stored values.

```ts
const items = morph.rank('sidebar')
// [{ id: 'tasks', score: 8.7, rank: 1, isActive: true },
//  { id: 'dashboard', score: 3.2, rank: 2, isActive: true },
//  { id: 'settings', score: 0.4, rank: 3, isActive: false }]
```

Returns `MorphRankedItem[]`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | The item identifier |
| `score` | `number` | Current decayed frecency score |
| `rank` | `number` | Position in group (1 = most used) |
| `isActive` | `boolean` | Whether score is above the active threshold |

### `morph.isActive(group, id)`

Check if a specific item is still "active" (decayed score above threshold). Returns `false` for items that were never tracked.

```ts
morph.isActive('sidebar', 'dashboard') // → true or false
```

### `morph.reset(group)`

Clear all tracked data for a group.

```ts
morph.reset('sidebar')
```

### `morph.configure(config)`

Swap storage backend or tune decay behavior.

```ts
morph.configure({
  storage: myCustomStorage,       // swap storage backend
  defaults: {
    decayConstant: 0.05,          // how fast scores fade (higher = faster)
    activeThreshold: 1.0,         // minimum score to be "active"
  },
  groups: {
    commands: { decayConstant: 0.1 },  // per-group overrides
  },
})
```

## Use cases

**Sidebars** — frequently used sections float to the top, unused ones collapse

```ts
const items = morph.rank('sidebar-nav')
const sorted = navItems.sort((a, b) => {
  const rankA = items.find(i => i.id === a.id)?.rank ?? Infinity
  const rankB = items.find(i => i.id === b.id)?.rank ?? Infinity
  return rankA - rankB
})
```

**Command palettes** — most-used commands surface first

**Dashboards** — widgets you check daily stay prominent, ignored ones de-emphasize

**Navigation menus** — adapts to what each user actually uses

**Settings panels** — frequent settings at the top, rest collapses into "Advanced"

**CLI tools** — surface most-used subcommands first in help output

## Custom storage

The storage interface is intentionally simple and sync. Implement `MorphStorage` to use any backend:

```ts
import type { MorphStorage } from '@morph-ui/core'

const myStorage: MorphStorage = {
  get(key) { /* return string | null */ },
  set(key, value) { /* store string */ },
  delete(key) { /* remove key */ },
  keys(prefix) { /* return keys matching prefix */ },
}

morph.configure({ storage: myStorage })
```

For async backends (Cloudflare KV, databases, etc.), use an in-memory cache that hydrates on init and flushes writes in the background.

## Multiple instances

The default export is a singleton. For multiple independent instances:

```ts
import { Morph } from '@morph-ui/core'

const appMorph = new Morph()
const editorMorph = new Morph()
```

## What Morph stores

Each tracked item persists three fields:

```json
{
  "lastUsed": 1746523200000,
  "useCount": 14,
  "score": 8.73
}
```

Keys in localStorage follow the format `morph:<group>:<id>`.

## Morph vs analytics (PostHog, Mixpanel, etc.)

| | Analytics tools | Morph |
|---|---|---|
| Who benefits | Product team | End user |
| Data goes to | External server | localStorage (never leaves device) |
| Latency | Weeks (analyze → redesign → ship) | Instant |
| Granularity | Aggregate (all users) | Individual (this user) |
| Privacy | Requires consent | No GDPR concerns |

They're complementary — analytics tells you what to build, Morph makes what you built adapt to each person.

## License

MIT
