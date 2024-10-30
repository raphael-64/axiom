# Running the Backend

We use a Typescript + Express + Node.js server. Run the backend using:

```
cd backend
npm i
npm run build
npm run dev
```

# Prisma

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