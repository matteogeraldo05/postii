<a name="top"></a>

<div align="center">

# 🎮 Postii

**A Wii Message Board-inspired shared sticky note board**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)

*Post it. Drag it. Leave your mark.*

</div>

---

## ✨ Features

| Feature | Description |
|:---|:---|
| 📝 **Post Notes** | Write short messages that appear as pinned note cards on the board |
| 🖱️ **Drag & Drop** | Reposition cards freely — positions persist to the database |
| 📅 **Calendar View** | Browse posts by date, just like the Wii Message Board |
| 🚦 **Daily Cap** | Max 10 posts per day; past dates are read-only |
| 🤬 **Bad Word Filter** | Profanity is automatically censored before saving |
| 🎯 **Custom Cursor** | Wii-style pointer with grab state on drag |
| 🎨 **Wii-Authentic UI** | Original fonts, sounds, and animations |

---

## 🛠️ Tech Stack

```
React 19 + TypeScript   →  UI & type safety
Vite 8                  →  Lightning-fast builds
Tailwind CSS 4          →  Utility-first styling
Supabase                →  Postgres database + realtime sync
```

---

## 🚀 Getting Started

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

### Database Schema

```sql
create table notes (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,
  x          float not null default 0,
  y          float not null default 0,
  created_at timestamptz not null default now()
);
```

---

## 🗂️ Project Structure

```
postii/
├── src/
│   ├── components/     # UI components (Board, NoteCard, Calendar…)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client & utilities
│   └── assets/         # Fonts, sounds, images (Nintendo)
├── public/
└── vite.config.ts
```

---

## 📃 Asset Credits

> All images, fonts, and audio are property of **Nintendo**.  
> This project is a fan-made recreation for **educational and personal use only** and is not affiliated with or endorsed by Nintendo.