# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds TypeScript sources; key folders include `api/` for PID API clients, `components/` for React UI blocks, `hooks/` for polling, `contexts/` for theming, and `utils/` for date helpers.
- Styling lives in `src/index.css` with Tailwind presets; shared config sits in `constants.ts` and `types.ts`.
- Deployment assets (`deploy.sh`, `deploy-simple.sh`, `docker-compose.yml`, `Dockerfile`) and docs (`COMPREHENSIVE_DOCUMENTATION.md`, deployment notes) stay in the repo root.

## Build, Test & Development Commands
- `npm run dev` starts the Vite dev server on port 5173 with hot reload.
- `npm run build` performs a strict TypeScript check (`tsc`) then generates the `dist/` production bundle.
- `npm run preview` serves the latest build; run it before deployment pushes.
- `npm run lint` enforces ESLint and TypeScript rules across `.ts`/`.tsx` sources.

## Coding Style & Naming Conventions
- Use TypeScript with React JSX and 2-space indentation; prefer `const` and explicit return types on shared utilities.
- Component files follow `PascalCase.tsx`; hooks live in `hooks/` as `useSomething.ts` with descriptive names.
- Tailwind utility classes stay inline; extract large groups into CSS layers or helper components.
- Run `npm run lint` before committing; no autoformatter ships with the repo.

## Testing Guidelines
- No automated test runner is configured; rely on targeted linting plus manual checks.
- Use `test-arrival-console.js` in the browser console and `test-arrival-browser.html` for interactive arrival checks.
- When adding data-fetching features, mock PID responses via the utilities under `src/api/` and document manual validation steps in PRs.

## Commit & Pull Request Guidelines
- Follow the short, lowercase style seen in history: `feat: add delayed departure timer`, `fix time`, etc.; prepend a clear prefix (`feat`, `fix`, `chore`, `docs`) and keep summaries imperative.
- Group related changes into focused commits that pass `npm run lint` and `npm run build` locally.
- Pull requests should include a purpose summary, UI screenshots or GIFs, environment/config notes (e.g., new `.env` keys), and links to issues.
- Highlight any manual test steps executed so reviewers can repeat them quickly.

## Environment & Deployment Tips
- Copy `.env.example` to `.env` and keep API tokens private; Vite only exposes vars prefixed with `VITE_`.
- For production validation, run `./deploy.sh --env prod` or `docker-compose up --build` to mirror the nginx + Node flow.
- Update `nginx.conf` and Tailwind configs when altering asset paths or introducing new static routes.
