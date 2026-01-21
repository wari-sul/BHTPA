# BHTPA Billing System - Deployment Guide

## Prerequisites

- Node.js v18+ LTS
- PostgreSQL v14+
- Git

## Initial Deployment Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd BHTPA
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Copy the example file and edit with your settings:

```bash
cp .env.example .env
nano .env
```

**Critical Settings:**

```env
# Update these values:
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/bhtpa_billing
JWT_SECRET=<generate-strong-random-string>
ADMIN_DEFAULT_PASSWORD=<your-secure-admin-password>
NODE_ENV=production
```

**🔐 Security Note:** 
- Generate a strong random string for `JWT_SECRET` (e.g., use: `openssl rand -base64 32`)
- Set a strong `ADMIN_DEFAULT_PASSWORD` (min 12 characters, mix of letters, numbers, symbols)

### 4. Database Setup

```bash
# Create database (if not exists)
createdb bhtpa_billing

# Run migrations
npx prisma migrate deploy

# Seed initial admin account
npm run seed
```

**Expected Output:**
```
🌱 Starting database seed...
✅ Admin user created/updated:
   Username: admin
   Role: admin
   Email: admin@bhtpa.gov.bd
✅ Database seeding completed successfully!
```

### 5. First Login

**Credentials:**
- Username: `admin`
- Password: (value from `ADMIN_DEFAULT_PASSWORD` in `.env`)

**⚠️ IMMEDIATELY AFTER FIRST LOGIN:**
1. Go to User Management
2. Click "Change Password"
3. Update to a new secure password
4. Create additional user accounts for managers/viewers

### 6. Start Application

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 7. Frontend Setup

```bash
cd ../frontend
npm install

# Update API URL in .env
echo "VITE_API_URL=http://your-server:5000/api" > .env

# Build for production
npm run build

# Preview production build
npm run preview
```

## User Management

### Create Additional Users

After logging in as admin:

1. Navigate to **User Management**
2. Click **"Create New User"**
3. Fill in details:
   - Username
   - Password (temporary)
   - Role (admin/manager/viewer/user)
   - Email

4. Inform the user to change their password on first login

### Role Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage users, clients, contracts, bills, payments |
| **Manager** | Manage clients, contracts, generate bills, approve payments |
| **Viewer** | Read-only access to all data |
| **User** | Standard access to assigned features |

## Security Checklist

- [ ] Strong `ADMIN_DEFAULT_PASSWORD` set in `.env`
- [ ] JWT_SECRET is random and secure (min 32 characters)
- [ ] Admin password changed immediately after first login
- [ ] Default `.env.example` not used in production
- [ ] Database credentials are secure
- [ ] Firewall configured (only allow necessary ports)
- [ ] SSL/TLS enabled for production (HTTPS)
- [ ] Regular database backups configured

## Backup & Maintenance

### Database Backup

```bash
# Manual backup
pg_dump bhtpa_billing > backup_$(date +%Y%m%d).sql

# Restore from backup
psql bhtpa_billing < backup_20260121.sql
```

### Automated Daily Backups (cron)

```bash
# Add to crontab
0 2 * * * pg_dump bhtpa_billing > /backups/bhtpa_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Forgot Admin Password

```bash
# Re-run seed with new password
export ADMIN_DEFAULT_PASSWORD="NewSecurePassword123!"
npm run seed
```

### Database Connection Issues

Check `.env` DATABASE_URL format:
```
postgresql://username:password@host:port/database
```

### PDF Generation Fails

Puppeteer requires Chrome dependencies:

```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# CentOS/RHEL
sudo yum install -y chromium
```

## Support

For issues, contact: admin@bhtpa.gov.bd
