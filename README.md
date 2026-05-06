# Morph

Frecency-based UI adaptation. Your interface learns what each user actually uses.

Morph is a tiny, framework-agnostic library that makes UIs adapt to individual user habits. Track interactions, rank by frecency, surface what matters — zero settings pages needed.

## How it works

Every complex app has more options than any single user needs. Morph quietly tracks which items each user interacts with and ranks them using a frecency algorithm (frequency + recency). Items used often and recently score higher. Items ignored gradually fade.

No AI. No server. No settings page. The UI just learns.

## Packages

| Package | Description |
|---------|-------------|
| `@morph-ui/core` | Framework-agnostic frecency engine and storage layer |

## Quick example

```ts
import { morph } from '@morph-ui/core'

// Record interactions
morph.track('sidebar', 'dashboard')
morph.track('sidebar', 'tasks')
morph.track('sidebar', 'tasks')

// Get items ranked by frecency
morph.rank('sidebar')
// → [{ id: 'tasks', score: 2.95 }, { id: 'dashboard', score: 1.0 }]

// Check if an item was used recently
morph.isActive('sidebar', 'dashboard') // → true
```

## Use cases

- **Sidebars** — frequently used sections float to the top
- **Command palettes** — most-used commands surface first
- **Dashboards** — widgets you check daily stay prominent
- **Navigation menus** — adapts to what you actually use
- **Settings panels** — frequent settings at the top, rest collapses
- **Toolbars** — each user's go-to tools surface automatically
- **CLI tools** — most-used subcommands first in help output

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## License

MIT
