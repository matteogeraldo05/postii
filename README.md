<a name="top"></a>
# Postii - Post a note
<div align="center">
<img src="public/banner.png" alt="Postii banner" width="100%" />
</div>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)


## Project

Postii is a shared message board inspired by the Wii Message Board / Calendar. Anyone can drop a post, drag it around the board, and browse past days through the built in calendar. The UI is faithful to the Wii, and the whole thing runs on a single live Supabase database, so posts from everyone appear in real time.

## Live Demo

https://postii.vercel.app

## Features

- **Live shared board** - everyone posts to the same board in real time
- **Drag & drop notes** - rearrange posts however you like, and the site will update
- **Calendar** - see past day's posts with a Wii style calendar
- **Read-only past days** - notes from previous days can be viewed but not moved, or created
- **10 post daily limit** - only 10 posts per day, resets daily
- **Bad word filter** - profanity is automatically censored before saving
- **Fully anonymous** - No accounts required

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (Postgres + Realtime)
- Hosting: Vercel


## To Set up Locally

```bash
# Clone the repo
git clone https://github.com/your-username/postii.git
cd postii

# Install dependencies
npm install

# Start the dev server
npm run dev
```

> **Requires** a Supabase project with a `notes` table containing `id`, `content`, `x`, `y`, and `created_at` columns.

## 📃 Asset Credits

> All images, fonts, and audio are property of **Nintendo**. and Alan-bur's wii menu 4k Texture pack 
> This project is a fan recreation for **educational and personal use only** and is not affiliated with or endorsed by Nintendo.