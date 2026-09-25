# Student API

REST API built with Bun, Elysia, Prisma, and PostgreSQL.

## Requirements

- [Bun](https://bun.sh/) installed
- A PostgreSQL database, such as Vercel Postgres/Neon
- The database connection string

## Setup

Install dependencies:

```bash
bun install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set `DATABASE_URL` to your PostgreSQL connection string:

```env
DATABASE_URL=postgres://user:password@host/database?sslmode=require
```

Generate Prisma Client and synchronize the database schema:

```bash
bun run db:generate
bun run db:push
```

Only run `db:push` against a database you control. For production databases, review schema changes and use Prisma migrations instead of applying changes blindly.

## Start The API

Development mode with automatic restart:

```bash
bun run dev
```

The API runs at `http://localhost:3000`.

To create a production bundle:

```bash
bun build src/index.ts --target bun --outfile dist/index.js
bun dist/index.js
```

## API Endpoints

All endpoints use the `/api/v1` version prefix.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/students` | List all students |
| GET | `/api/v1/students/:studentId` | Get one student |
| POST | `/api/v1/students` | Create or replace a student |
| PUT | `/api/v1/students/:studentId` | Update a student |
| DELETE | `/api/v1/students/:studentId` | Delete a student |

### Student request body

```json
{
	"studentId": "67070183",
	"firstName": "Sarin",
	"lastName": "Diddy",
	"birthDate": "2000-01-01",
	"gender": "male"
}
```

Allowed `gender` values are `male`, `female`, and `other`.

The `PUT` request takes `studentId` from the URL, so its body does not include `studentId`:

```json
{
	"firstName": "Pzeed",
	"lastName": "Diddy",
	"birthDate": "1999-12-31",
	"gender": "other"
}
```

Swagger documentation is available at:

```text
http://localhost:3000/swagger
```
