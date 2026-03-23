# Invoice Generator

Next.js invoice management app with:

- App Router
- `next-intl` for English and Arabic
- Auth.js / NextAuth credentials authentication
- Prisma with SQLite
- Tailwind CSS utilities

## Setup

1. Install dependencies:
   `npm install`
2. Create the database and Prisma client:
   `npm run db:push`
3. Seed a demo user:
   `npm run db:seed`
4. Start the app:
   `npm run dev`

## Demo Login

- Email: `admin@example.com`
- Password: `password123`

## Environment

Copy `.env.example` to `.env` if needed. The default SQLite setup works locally without extra services.
