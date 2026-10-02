# Birthday Reminder

A full-stack web application to manage birthdays, get automated email and browser notifications, and draft heartfelt AI-generated messages.

## Tech Stack
- **Backend**: Node.js, Express, MySQL 8, Luxon, Zod, Nodemailer, @anthropic-ai/sdk, node-cron
- **Frontend**: React, Vite, React Router, plain CSS

## Setup & Local Development

### 1. Database (MySQL 8)
Create a MySQL database and run the schema file to initialize the tables:
```bash
mysql -u root -p < server/src/db/schema.sql
```

### 2. Environment Variables
You need two `.env` files. Start by copying the examples:

**Server (`server/.env`)**
```env
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=birthday_reminder
DB_PORT=3306
# Must be at least 32 characters
JWT_SECRET=must_be_at_least_32_characters_long_super_secret_key!
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_anthropic_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM="Birthday Reminder <noreply@yourdomain.com>"
CRON_SCHEDULE="30 8 * * *"
NODE_ENV=development
ADMIN_TOKEN=your_admin_secret_token
```

**Client (`client/.env`)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Install Dependencies & Start
Run these from the root directory:

```bash
# Install dependencies for both apps
cd server && npm install
cd ../client && npm install
cd ..

# Run both in development (open two terminals)
npm run dev:server
npm run dev:client
```

### 4. Running Tests
The backend utilities and cron behaviors are unit-tested using Vitest.
```bash
npm run test
```

## Deployment Guide

Because the Node backend contains a stateful cron scheduler (`node-cron`), the server must run continuously in the background. Serverless functions (like Vercel functions or AWS Lambda) are **not** suitable for this backend unless you externalize the cron trigger.

**Recommended Setup:**
1. **Database**: A managed MySQL 8 database (e.g., PlanetScale, AWS RDS, DigitalOcean).
2. **Server (Express)**: Deploy on a continuous host like Render, Railway, Heroku, or a standard VPS. Set `NODE_ENV=production` and ensure all secrets are configured in the host's environment variables dashboard.
3. **Frontend (Vite/React)**: 
   - Build the client: `npm run build:client`
   - You can serve the resulting `client/dist` directory statically via Vercel, Netlify, or AWS S3/CloudFront.
   - Set `VITE_API_BASE_URL` to your live server URL (e.g. `https://api.yourdomain.com/api`).
