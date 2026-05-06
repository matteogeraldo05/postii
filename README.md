# Postii

A Wii Message Board-inspired shared message board built with React, TypeScript, Vite, and Supabase.

## Features

- **Post notes** — write short messages that appear as pinned note cards on the board
- **Drag & drop** — reposition cards freely; positions persist to the database
- **Calendar view** — browse posts by date
- **Daily cap** — max 10 posts per day; past dates are read-only
- **Bad word filtering** — profanity is automatically censored before saving
- **Custom cursor** — Wii-style pointer with grab state on drag
- **Wii-authentic UI** — original fonts, sounds, and animations

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Supabase (Postgres + realtime)

## Getting Started

```bash
npm install
npm run dev
```

Requires a Supabase project with a `notes` table containing `id`, `content`, `x`, `y`, and `created_at` columns.

## Asset Credits

All images, fonts, and audio are property of **Nintendo**. This project is a fan-made recreation for educational and personal use only and is not affiliated with or endorsed by Nintendo.
