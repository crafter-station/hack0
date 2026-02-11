# Contributing

Thanks for contributing to hack0.dev! This guide will help you get started.

## Setup

```bash
bun install
cp .env.example .env
# Add required environment variables (see .env.example for full list)
bun run dev
```

Required environment variables: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `TRIGGER_SECRET_KEY`

## Code Style

We use **Biome** for linting and formatting (not ESLint/Prettier):
- **Tabs** for indentation
- **Double quotes** for strings
- **TypeScript strict mode** enabled
- Avoid `any` type without justification
- No comments unless absolutely necessary (code should be self-documenting)

Run checks before committing:
```bash
bun run check        # Check linting + formatting
bun run lint:fix     # Auto-fix issues
bun run build        # Ensure production build works
```

## Pull Request Process

1. **Create a branch** from `main` following the pattern: `your-name/HCK0-XX`
2. **Make focused changes** - keep PRs small and single-purpose
3. **Use conventional commits**:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `chore:` - Maintenance tasks
   - `refactor:` - Code improvements
   - `docs:` - Documentation changes
4. **Reference the issue** in commits: `feat: add event filters (HCK0-56)`
5. **Test locally** - run `bun run build` and verify functionality
6. **Create PR** with:
   - Clear title: `HCK0-XX: Description`
   - Description explaining what/why/how
   - `Closes #XX` in the body to auto-link the issue

## Commands Reference

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun run check        # Check linting + formatting
bun run lint:fix     # Lint and fix

bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed sample data
```

## Getting Help

- **Bug reports or feature requests**: [Open an issue](https://github.com/crafter-station/hack0/issues)
- **Questions about the codebase**: Check existing issues or start a discussion
- **General questions**: Reach out via GitHub issues

## Project Structure

- `app/` - Next.js App Router pages
- `components/` - React components (including shadcn/ui)
- `lib/` - Utilities, database schema, server actions
- `trigger/` - Background jobs (Trigger.dev)

Read `CLAUDE.md` for detailed architecture and patterns.
