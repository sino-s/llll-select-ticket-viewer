# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + Preact + TypeScript application.

- `src/main.tsx` mounts the Preact app.
- `src/app.tsx` contains the primary UI component.
- `src/app.css` and `src/index.css` hold component and global styles.
- `src/assets/` stores bundled image assets imported by TypeScript.
- `public/` stores static files served from the site root, such as `icons.svg` and `favicon.svg`.
- `rawdata/raw.json` is the local source data input for the viewer.
- `vite.config.ts` and `tsconfig*.json` define build behavior.

Keep feature code under `src/`. Prefer colocating component-specific assets and styles near the component as the app grows.

## Build, Test, and Development Commands

Use `pnpm` because the repository includes `pnpm-lock.yaml`.

- `pnpm install` installs dependencies.
- `pnpm dev` starts the Vite development server with HMR.
- `pnpm build` runs `tsc -b` and produces the production Vite build.
- `pnpm preview` serves the production build locally for final checks.

## Coding Style & Naming Conventions

Write TypeScript and JSX using the existing style: two-space indentation, single quotes, no semicolons, and ESM imports. Components should use PascalCase (`TicketViewer`), hooks and helpers should use camelCase (`parseTicketData`), and CSS classes should be short, descriptive kebab-case when practical.

The TypeScript config rejects unused locals and parameters. Keep imports tidy and remove dead code before building. Use Preact APIs directly unless compatibility with React-oriented packages requires `preact/compat`.

## Testing Guidelines

No dedicated test framework is configured yet. For current changes, use `pnpm build` as the required verification step. If adding non-trivial parsing or filtering logic, add focused tests in a future setup and name them after the unit under test, for example `ticket-filter.test.ts`.

When changing UI behavior, also run `pnpm dev` or `pnpm preview` and manually verify the main viewer flow in a browser.

## Commit & Pull Request Guidelines

The current history only contains `initial commit`; keep new commit subjects short, imperative, and scoped, for example `Add ticket filter controls` or `Update raw data parser`.

Pull requests should include:

- A concise summary of the user-visible change.
- Verification steps run, especially `pnpm build`.
- Screenshots or short recordings for visual UI changes.
- Notes about any changes to `rawdata/raw.json` or other data inputs.

## Agent-Specific Instructions

Do not overwrite generated or user-provided data in `rawdata/` without confirming the source. Keep edits narrowly scoped, and avoid adding new tooling unless it is needed for this viewer.
