# Linggo

> A mobile-first English learning platform for Turkish speakers, focused on vocabulary practice, pronunciation support, and lightweight lesson flows.

## What it does

Linggo helps learners build an English study habit through a simple web app experience. The project is designed around fast access, account-based progress, admin-managed content, and a PWA-style interface that can run without a heavy frontend build step.

## Visual

Add one clean product screenshot here: the learner home screen, lesson flow, or admin content view.

## Demo

No public demo link is documented yet. Run the app locally and open:

- App: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
- Health check: `http://localhost:5173/healthz`

## Tech Stack

- Node.js 22+
- SQLite via `node:sqlite`
- Vanilla JavaScript modules
- PWA assets
- Nodemailer
- Docker
- PM2 or reverse-proxy deployment

## Installation

```bash
npm install
npm start
```

Copy `.env.example` to `.env` and fill the required values before production use. SMTP settings are required for production email flows.

## Status

Active personal project. The README is intentionally kept short so the product, setup, and current state are easy to scan.
