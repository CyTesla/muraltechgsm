# MuralTechGSM

A full-stack mobile firmware and software download platform built with Node.js, Express, PostgreSQL, Cloudinary, and Stripe.

## Features

- User authentication (register/login/JWT)
- File listings with search, filter, pagination
- Free, Paid & Premium file tiers
- Download tracking (views + download counts)
- Star ratings per file
- Favorites system
- Stripe payment integration
- Cloudinary file/image uploads
- Admin dashboard (stats, user management, recent downloads)
- Dark/Light theme toggle
- Fully responsive design

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon free tier)
- **Storage**: Cloudinary (free tier)
- **Payments**: Stripe
- **Deployment**: Vercel (free tier)

## Project Structure

```
muraltechgsm/
├── server.js                    ← Express entry point
├── vercel.json                  ← Vercel deployment config
├── .env.example                 ← Environment variables template
├── api/
│   ├── config/
│   │   ├── db.js                ← PostgreSQL pool
│   │   ├── cloudinary.js        ← Cloudinary config
│   │   └── schema.sql           ← DB schema + seed data
│   ├── middleware/
│   │   ├── auth.js              ← JWT auth guards
│   │   └── validate.js          ← Request validation
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── filesController.js
│   │   ├── favoritesController.js
│   │   ├── paymentsController.js
│   │   ├── adminController.js
│   │   └── uploadController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── categories.js
│   │   ├── favorites.js
│   │   ├── payments.js
│   │   ├── admin.js
│   │   └── upload.js
│   └── utils/initDb.js
├── css/style.css
├── js/script.js
└── index.html
```

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | Auth |
| GET | `/api/files` | Public |
| GET | `/api/files/trending` | Public |
| GET | `/api/files/:slug` | Public |
| POST | `/api/files/:id/download` | Auth |
| POST | `/api/files/:id/rate` | Auth |
| POST | `/api/files` | Admin |
| PUT | `/api/files/:id` | Admin |
| DELETE | `/api/files/:id` | Admin |
| GET | `/api/categories` | Public |
| GET | `/api/favorites` | Auth |
| POST | `/api/favorites/:id` | Auth |
| POST | `/api/payments/checkout` | Auth |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/payments/orders` | Auth |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PUT | `/api/admin/users/:id/role` | Admin |
| POST | `/api/upload` | Admin |

## Setup & Deployment

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/muraltechgsm.git
cd muraltechgsm
npm install
```

### 2. Set up free services
- **Neon** (PostgreSQL): https://neon.tech
- **Cloudinary** (file storage): https://cloudinary.com
- **Stripe** (payments): https://stripe.com

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your credentials
```

### 4. Initialize database
```bash
npm run db:init
```

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
1. Push to GitHub
2. Import repo at https://vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT © MuralTechGSM
