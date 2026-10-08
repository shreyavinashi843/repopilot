# Contributing to RepoPilot

Thanks for considering a contribution. This is a small open-source MVP; concise pull requests are preferred.

## Workflow

1. Fork the repository.
2. Create a branch: `git checkout -b feat/short-description`.
3. Install dependencies: `npm install`.
4. Run the development server: `npm run dev`.
5. Make your changes with TypeScript strict mode in mind.
6. Run tests: `npm test`.
7. Run lint and typecheck: `npm run lint`, `npm run typecheck`.
8. Submit a pull request describing what changed and how you verified it.

## Guidelines

- Keep functions small with clear responsibilities.
- Avoid `any` unless absolutely necessary.
- Do not commit secrets (`.env`, `.env.local` are ignored).
- Do not add fake users, testimonials, analytics, or fabricated claims.
- Mock or isolate external API calls in tests.
- Update docs (README/docs page) when behavior changes.
