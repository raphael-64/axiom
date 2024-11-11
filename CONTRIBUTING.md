# Contributing to Axiom

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/ishaan1013/axiom.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions in the [README](README.md#running-locally)

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `style`: Formatting changes
- `refactor`: Code restructuring

### Code Style

- Use TypeScript
- Follow existing code formatting (Prettier)
- Keep components small and focused
- Use meaningful variable names

## Pull Requests

1. Update your branch with main: `git rebase main`
2. Push to your fork: `git push origin feature/your-feature-name`
3. Create a PR with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - List of tested browsers/devices

## Project Structure

```
axiom/
├── frontend/           # Next.js frontend
│   ├── app/           # Pages and routing
│   ├── components/    # React components
│   └── lib/          # Utilities and helpers
└── backend/           # Express backend
    ├── src/          # Source code
    └── prisma/       # Database schema
```

Notable files:

- Frontend
  - `frontend/lib/lang.ts` - Language definition
  - `frontend/components/editor/index.tsx` - Editor component
  - `frontend/components/editor/explorer.tsx` - File explorer
  - `frontend/lib/query.ts` - [Tanstack Query](https://tanstack.com/query/latest) hooks; _write all query and mutation logic here_
  - `frontend/lib/actions.ts` - Data fetching helpers; _write all data fetching logic here_
- Backend
  - `backend/src/index.ts` - Backend entry point and HTTP route handling
  - `backend/src/socketio.ts` - Socket.io event handling for workspace collaboration
  - `backend/src/utils.ts` - Prisma client operations; _write all database operations here_
  - `backend/prisma/schema.prisma` - Prisma database schema

## Need Help?

- Check existing [issues](https://github.com/ishaan1013/axiom/issues)
- Create a new issue
- Ask Ishaan (i2dey@uwaterloo.ca) or Rajan (r34agarw@uwaterloo.ca)
