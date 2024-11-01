# SE212 Interface

An editor for George, for [SE212 (Logic and Computation](https://student.cs.uwaterloo.ca/~se212/notes.html) at the University of Waterloo.
- Local assignment and project files, persisted in local storage
- Tabs for opening multiple files
- Fully customizable layout with collapsible and resizeable panels
- Keyboard shortcuts for all major features
- Multiplayer collaboration with workspaces

# Running Locally

## Frontend

We use Next.js 14 + Typescript, as well as these libraries:
- Monaco editor
- Y.js
- Socket.io
- Tanstack Query
- TailwindCSS
- Shadcn UI

Set up environment variables in `frontend/.env.local`:

```
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

Run the frontend:

```
cd frontend
npm i
npm run dev
```

## Backend

We use a Typescript + Express + Node.js server for our HTTP and WebSockets server. We also use Y.js and Socket.io.

Set up environment variables in `backend/.env`:

```
DATABASE_URL="file:./dev.db"
```

Run the backend:

```
cd backend
npm i
npm run dev
```

### Prisma

1. Compile the Prisma Schema

```
npx prisma generate
```

2. Run a migration to create your database tables with Prisma Migrate

```
npx prisma migrate dev --name init
```

3. (Optional) Run the seed to initialize it with some values

```
npx prisma db seed
```

4. Explore the data in Prisma Studio

```
npx prisma studio
```
