# Aurea Market — Product Requirements Document

## Original Problem Statement
"can you make me a 3d marketplace website i gonna be sell everything like discord nitro and all games accounts"

## Overview
Aurea Market is a premium 3D digital-goods gaming marketplace for selling Discord Nitro, game accounts, game keys and gift cards. Buyers browse, add to cart and place orders; a single admin manages products and views orders.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). All routes under `/api`.
- **Frontend**: React 19 + Tailwind + shadcn/ui, react-three-fiber/drei 3D hero, framer-motion, lenis smooth scroll.
- **Auth**: JWT Bearer token (localStorage `nn_token`), bcrypt hashing, admin seeded on startup.

## Design
Theme: "Tactical Stealth & Luxury" — obsidian black + amber/gold accent. Fonts: Clash Display (headings), Manrope (body), JetBrains Mono (labels). 3D hero = matte-black metal access card that tilts toward cursor.

## User Personas
- **Buyer**: browses catalog, filters/searches, adds to cart, checks out via order request (Discord/Telegram handle for delivery).
- **Admin**: logs in, manages products (CRUD), views stats and orders.

## Implemented (2026-07-14)
- Product catalog with 8 seeded products, category filter + search, product detail pages.
- Cart (localStorage) with qty controls; mock checkout order flow (no payment).
- 3D hero (access card), ticker marquee, trust bar.
- Admin: JWT login, protected dashboard, stats, product CRUD table, orders list.
- Backend tested 19/19; frontend all critical flows pass.

## Credentials
Admin: admin@aureamarket.gg / Admin@12345

## Backlog
- P1: Real payments (Stripe) instead of mock order flow.
- P1: Server-side price/stock validation on order creation; decrement stock.
- P2: Order status management (mark delivered) + email/Discord delivery of credentials.
- P2: Refresh-token flow, shorter access-token TTL, migrate to FastAPI lifespan handlers.
- P2: Domain-relevant product imagery (generated Discord Nitro / brand art).

## Next Tasks
Await user feedback on the new look; if approved, prioritize Stripe payments.
