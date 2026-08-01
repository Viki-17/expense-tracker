# Contributing to KaiKanakku

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/kaikanakku.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Make your changes
6. Type-check: `npx tsc -b`
7. Submit a pull request

## Development Guidelines

### Performance

This app targets low-end Android devices via Capacitor WebView. Performance is critical:

- Wrap computed values in `useMemo`
- Wrap callback props in `useCallback`
- Use `react-window` virtualization for lists with 100+ items
- Database queries must use indexed queries — never filter the full table
- Charts must cap data points to 90 for all-time ranges
- Page transitions use `transform`/`opacity` only and respect `prefers-reduced-motion`

### Code Style

- TypeScript strict mode
- Tailwind CSS with semantic tokens (`canvas`, `surface`, `label`, etc.)
- Relative imports only (no path aliases)
- No comments unless necessary (code should be self-documenting)
- Follow existing patterns in neighboring files

### Commit Messages

Use conventional commit format:

```
feat: add budget rollover feature
fix: correct SMS parser regex for HDFC NEFT messages
perf: memoize category breakdown calculation
refactor: extract transaction row into separate component
```

## Pull Request Process

1. Ensure your code type-checks: `npx tsc -b`
2. Test in dark mode (the app is always dark)
3. If adding a new route, follow the lazy import pattern in `App.tsx`
4. Update the README if adding new scripts or changing the project structure
5. Keep PRs focused — one feature or fix per PR

## Reporting Bugs

Open an issue with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Device/browser info (especially for Android WebView issues)
- Screenshots if applicable

## Feature Requests

Open an issue describing:

- What you want to achieve
- Why it's useful
- Any implementation ideas you have

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
