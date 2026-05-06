# Morph

A framework-agnostic TypeScript library that makes UIs adapt to individual user habits using frecency (frequency + recency). No AI, no server, no settings page — the UI just learns.

## Project structure

```
packages/
  core/          @morph-ui/core — frecency engine + storage layer, zero dependencies
```

Monorepo managed with pnpm workspaces. Biome for linting/formatting.

## Core concept

Complex UIs have more options than any user needs. Morph tracks which items a user interacts with and ranks them using exponential decay scoring. Items used often and recently score higher. Ignored items fade.

## API design

```ts
import { morph } from '@morph-ui/core'

morph.track(group, id)        // record an interaction
morph.rank(group)             // all items in group sorted by frecency
morph.isActive(group, id)     // used recently? (boolean)
morph.reset(group)            // clear a group
morph.configure({ storage })  // swap storage backend
```

Storage key format: `morph:<group>:<id>`

Each item stores:
```json
{ "lastUsed": 1746523200000, "useCount": 14, "score": 8.73 }
```

## Frecency algorithm

On each `track()` call:
```ts
const daysSinceLastUse = (now - lastUsed) / 86400000
const decay = Math.exp(-daysSinceLastUse * decayConstant)
score = oldScore * decay + 1
```

Default decay constant: 0.05 (configurable per group).

Score decay is applied at **read time** (`rank()` / `isActive()`), not write time. This means rankings update naturally over time even without new interactions.

## Storage interface

v1 uses localStorage. The storage layer is swappable — any object implementing get/set/delete by key works:

```ts
interface MorphStorage {
  get(key: string): string | null
  set(key: string, value: string): void
  delete(key: string): void
  keys(prefix: string): string[]
}
```

## Guidelines

- Zero runtime dependencies in core — keep it tiny
- All public API must be fully typed
- Prefer pure functions internally; side effects only at the storage boundary
- Every public method needs a test
- Use vitest for testing; mock localStorage in tests
- Don't add framework-specific code to the core package
- The React adapter (`@morph-ui/react`) will be a separate package added later
- Formatting: tabs, 100 char line width (biome handles this)

## Commands

```bash
pnpm install          # install deps
pnpm build            # build all packages
pnpm test             # run tests
pnpm lint             # biome check
pnpm lint:fix         # biome check --write
```
