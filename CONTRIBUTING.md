# Contributing to hack0.dev

Thank you for your interest in contributing to hack0.dev! 🎉 We're excited to have you join our community. This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Project-Specific Guidelines](#project-specific-guidelines)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Documentation](#documentation)
- [Communication](#communication)
- [Recognition](#recognition)
- [License](#license)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. By participating in this project, you agree to:

- Be respectful and considerate of others
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

If you encounter any behavior that violates these principles, please report it by opening an issue or contacting the maintainers.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Bun** (latest version) - We use Bun as our package manager
- **Git** (latest version)
- **PostgreSQL** or a **Neon** account (for database)

### Forking and Cloning

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hack0.git
   cd hack0
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/hack0.git
   ```

### Environment Setup

1. Copy the example environment file (if available) or create a `.env` file in the root directory
2. Add the following required environment variables:

   ```env
   # Database
   DATABASE_URL=your_neon_postgresql_connection_string

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key

   # Web Scraping (Firecrawl)
   FIRECRAWL_API_KEY=your_firecrawl_api_key

   # Luma Integration (optional)
   LUMA_API_KEY=your_luma_api_key
   HACK0_LUMA_CALENDAR_API_ID=your_calendar_api_id
   ```

   See [CLAUDE.md](CLAUDE.md#environment-variables) for more details.

3. Install dependencies:
   ```bash
   bun install
   ```

4. Set up the database:
   ```bash
   # Generate migrations (if schema changes exist)
   bun run db:generate

   # Push schema to database (development)
   bun run db:push

   # Or run migrations (production)
   bun run db:migrate

   # Seed database with sample data (optional)
   bun run db:seed
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

   The application should now be running at `http://localhost:3000`

## Development Workflow

### Branch Naming Conventions

Create a new branch for your work using one of these prefixes:

- `feature/` - For new features (e.g., `feature/add-event-search`)
- `fix/` - For bug fixes (e.g., `fix/event-date-display`)
- `docs/` - For documentation updates (e.g., `docs/update-readme`)
- `refactor/` - For code refactoring (e.g., `refactor/event-utils`)
- `style/` - For styling changes (e.g., `style/update-button-colors`)

### Creating a Branch

1. Make sure you're on the main branch and up to date:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. Create and switch to a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. Make your changes following the [Coding Standards](#coding-standards)
2. Test your changes locally
3. Run linting and formatting:
   ```bash
   bun run lint
   bun run check
   bun run format
   ```

### Committing Changes

Write clear, descriptive commit messages. See [Commit Message Guidelines](#commit-message-guidelines) for details.

## Coding Standards

### TypeScript/React Conventions

- Use TypeScript for all new code
- Prefer Server Components by default (Next.js App Router)
- Use `"use client"` directive only when necessary (interactivity, hooks, browser APIs)
- Use functional components with TypeScript interfaces/types
- Prefer named exports over default exports for components

### Biome Configuration

We use [Biome](https://biomejs.dev/) for linting and formatting. Key rules:

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Semicolons**: Not required (Biome handles this)
- **Import organization**: Automatically organized by Biome

Run these commands before committing:

```bash
# Check for issues
bun run check

# Fix linting issues
bun run lint:fix

# Format code
bun run format
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `EventCard.tsx`, `SiteHeader.tsx`)
- **Utilities/Helpers**: kebab-case (e.g., `event-utils.ts`, `slug-utils.ts`)
- **Pages**: Next.js conventions (e.g., `page.tsx`, `layout.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMobile.ts`, `useDebouncedCallback.ts`)

### Component Structure

```tsx
// Server Component (default)
export async function EventList() {
  const events = await getEvents();
  return <div>{/* ... */}</div>;
}

// Client Component (when needed)
"use client";

import { useState } from "react";

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Tailwind CSS Guidelines

- Use Tailwind utility classes for styling
- Follow the design system (grayscale with color accents)
- Use semantic color tokens (e.g., `bg-background`, `text-foreground`)
- Avoid inline styles unless absolutely necessary

### Database Schema Changes

When modifying the database schema:

1. Edit `lib/db/schema.ts`
2. Generate a migration:
   ```bash
   bun run db:generate
   ```
3. Review the generated migration in `drizzle/`
4. Test the migration locally:
   ```bash
   bun run db:push
   ```
5. Include the migration files in your PR

**Never** modify migration files directly after generation.

## Commit Message Guidelines

Write clear, descriptive commit messages:

```
type(scope): brief description

Optional longer description explaining what and why,
not how. Wrap at 72 characters.

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(events): add event search functionality

fix(ui): correct event date display in dark mode

docs: update contributing guidelines
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All linting and formatting checks pass (`bun run check`)
- [ ] Changes are tested locally
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow the guidelines
- [ ] Branch is up to date with `upstream/main`

### PR Checklist Template

When creating a PR, include:

1. **Description**: Clear description of what the PR does and why
2. **Related Issues**: Link to related issues (e.g., "Fixes #123")
3. **Type of Change**:
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
4. **Testing**: How you tested your changes
5. **Screenshots**: If UI changes are involved, include before/after screenshots
6. **Database Changes**: If schema changes, describe them

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All existing tests pass
- [ ] Added new tests (if applicable)

## Screenshots
(If applicable)

## Additional Notes
Any additional information reviewers should know
```

### Review Process

- Maintainers will review your PR
- Address any feedback promptly
- Keep PRs focused and reasonably sized
- Be open to suggestions and constructive criticism

## Issue Guidelines

### Reporting Bugs

When reporting a bug, include:

1. **Clear title**: Brief description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable
7. **Additional context**: Any other relevant information

### Requesting Features

When requesting a feature:

1. **Clear title**: Brief description of the feature
2. **Problem statement**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: Other solutions you've thought about
5. **Additional context**: Mockups, examples, etc.

### Issue Labels

We use labels to categorize issues:

- `good first issue` - Great for newcomers
- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `help wanted` - Extra attention needed
- `question` - Further information requested

## Project-Specific Guidelines

### Architecture Patterns

- **Server Actions**: Use Server Actions for data mutations (see `lib/actions/`)
- **App Router**: Follow Next.js 16 App Router conventions
- **Route Groups**: Use route groups for organization (`(auth)`, `(app)`, `(landing)`)
- **URL State**: Use `nuqs` for type-safe search params
- **Data Fetching**: Prefer Server Components with Server Actions

### Database Migrations

Always use Drizzle migrations for schema changes:

```bash
# 1. Edit lib/db/schema.ts
# 2. Generate migration
bun run db:generate

# 3. Review generated SQL in drizzle/
# 4. Test locally
bun run db:push

# 5. Commit both schema.ts and migration files
```

### Luma Integration

If working with Luma Calendar integration:

- Read [LUMA_INTEGRATION.md](LUMA_INTEGRATION.md) first
- Understand the host resolution system
- Test webhook processing locally if possible
- Follow the drift detection patterns

### Event Data Model

Understanding the event model is crucial:

- **Parent/Child Events**: Multi-day events and conference tracks
- **Event Types**: hackathon, conference, workshop, etc.
- **Status**: upcoming, open, ongoing, ended
- **Formats**: virtual, in-person, hybrid

See [CLAUDE.md](CLAUDE.md#data-model) for detailed information.

### Design System

- **Color Palette**: Grayscale with color accents
  - Green (emerald-500): Active/ongoing events
  - Blue (blue-500): Upcoming events
  - Gray (muted): Ended events
  - Amber: Junior-friendly badge
- **Components**: Use shadcn/ui components from `components/ui/`
- **Layout**: Two-column layout for event detail pages

## Testing & Quality Assurance

### Before Submitting

1. **Linting**: Run `bun run check` and fix all issues
2. **Formatting**: Run `bun run format` to ensure consistent formatting
3. **Build**: Ensure the project builds successfully:
   ```bash
   bun run build
   ```
4. **Manual Testing**: Test your changes in the browser
5. **Database**: Test any database changes with `bun run db:push`

### Testing Checklist

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Formatting is consistent
- [ ] UI changes work in both light and dark modes
- [ ] Responsive design works on mobile
- [ ] Database migrations work correctly
- [ ] No console errors in browser

### Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Documentation

### Updating Documentation

- **CLAUDE.md**: Update if architecture or patterns change significantly
- **README.md**: Update if setup instructions or project overview changes
- **Code Comments**: Add JSDoc comments for new functions/utilities

### JSDoc Example

```typescript
/**
 * Formats an event date range with smart year display.
 * Shows year only when different from current year.
 *
 * @param startDate - Start date of the event
 * @param endDate - End date of the event
 * @returns Formatted date string (e.g., "20 sep" or "20 sep 2025")
 */
export function formatEventDateRange(
  startDate: Date,
  endDate: Date
): string {
  // ...
}
```

## Communication

### Getting Help

- **GitHub Issues**: Use for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Pull Requests**: Use PR comments for code-specific questions

### Response Times

- We aim to respond to issues within 48 hours
- PR reviews typically happen within 3-5 business days
- For urgent issues, mention it in the issue/PR

### Asking Questions

When asking questions:

1. Search existing issues first
2. Be specific about what you're trying to do
3. Include relevant code snippets
4. Provide context about your environment

## Recognition

Contributors are recognized through:

- GitHub contributor list
- Release notes (for significant contributions)
- Project documentation (for major features)

We appreciate all contributions, big and small! Thank you for helping make hack0.dev better.

## License

By contributing to hack0.dev, you agree that your contributions will be licensed under the same license as the project. Please check the project's LICENSE file (if present) for details.

---

**Thank you for contributing to hack0.dev!** 🚀

If you have any questions, don't hesitate to open an issue or reach out to the maintainers.

