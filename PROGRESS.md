# MuralTechGSM - Progress Notes
Last updated: May 4, 2026

## ✅ COMPLETED

### Frontend
- Full site cloned from GSM Hamza and rebranded to MuralTechGSM
- Static files moved to `public/` folder (index.html, css/style.css, js/script.js)
- Dark/Light theme, search, filters, favorites, download tracking all working

### Backend
- Node.js + Express server (`server.js`)
- Full REST API with routes for:
  - Auth (register, login, JWT)
  - Files (CRUD, search, filter, download tracking, ratings)
  - Categories
  - Favorites
  - Payments (Stripe)
  - Admin dashboard
  - File uploads (Cloudinary)
- Database schema created (`api/config/schema.sql`)
- All dependencies installed (`node_modules/`)

### Database (Neon PostgreSQL) ✅ DONE
- Project created on Neon (free tier)
- Schema initialized successfully (all tables + seed categories created)
- Connection string: `postgresql://neondb_owner:npg_dI7WcFfHbKg4@ep-still-heart-anvooaqk-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require`

### Deployment (Vercel) ✅ DONE
- Repo pushed to: https://github.com/CyTesla/muraltechgsm
- Live site: https://muraltechgsm.vercel.app
- Vercel environment variables added:
  - ✅ DATABASE_URL
  - ✅ JWT_SECRET
  - ✅ JWT_EXPIRES_IN
  - ✅ NODE_ENV
  - ✅ FRONTEND_URL

---

## ⏳ NEXT STEPS (Pick up from here)

### 1. Cloudinary Setup (File Storage) — NEXT
- Go to https://cloudinary.com
- Sign up free (use GitHub login)
- Get from dashboard:
  - Cloud Name
  - API Key
  - API Secret
- Add to Vercel environment variables:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
- Add to local .env file too

### 2. Stripe Setup (Payments)
- Go to https://stripe.com
- Sign up free
- Go to Developers → API Keys
- Get Secret Key (sk_test_...)
- Get Webhook Secret (whsec_...)
- Add to Vercel environment variables:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
- Add to local .env file too

### 3. Final Testing
- Test register/login at https://muraltechgsm.vercel.app
- Test file upload via admin
- Test download tracking
- Test Stripe payment flow (test mode)

### 4. Admin Account
- After Cloudinary + Stripe are set up
- Create first admin user via API or directly in Neon dashboard

---

## Project File Locations
- Local: `M:\.MTP_FOLDER\MTP_Website\gsm-hamza-clone\`
- GitHub: https://github.com/CyTesla/muraltechgsm
- Live: https://muraltechgsm.vercel.app
- Neon DB: https://console.neon.tech
- Vercel: https://vercel.com/cytesla/muraltechgsm

## Local .env file
Located at: `M:\.MTP_FOLDER\MTP_Website\gsm-hamza-clone\.env`
(Already has DATABASE_URL and JWT_SECRET filled in)
(Still needs CLOUDINARY and STRIPE values)
