# 🚀 Deployment Guide

> Complete deployment instructions for CommunityConnect AI

---

## 📋 Table of Contents

- [Environments](#environments)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Firebase Hosting Setup](#firebase-hosting-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## 🌐 Environments

### Development Environment

| Property | Value |
|----------|-------|
| **URL** | http://localhost:5179 |
| **Type** | Local development server |
| **Purpose** | Testing and development |
| **Database** | Firebase (Development project) |

### Production Environments

| Environment | URL | Purpose |
|------------|-----|---------|
| **Primary** | https://gsc26-dashboard-xyz.web.app | Primary Firebase Hosting domain |
| **Secondary** | https://gsc26-dashboard-xyz.firebaseapp.com | Firebase default domain |

---

## 💻 Local Development

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
Firebase CLI installed
```

### Setup Steps

```bash
# 1. Navigate to web-dashboard
cd web-dashboard

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your Firebase credentials
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_PROJECT_ID=your_project_id
# etc.

# 5. Start development server
npm run dev
```

The app will be available at **http://localhost:5179**

### Development Workflow

```bash
# Run with hot module replacement
npm run dev

# Build for testing
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

---

## 🚀 Production Deployment

### Prerequisites

1. Firebase project created
2. Firebase CLI installed and authenticated
3. Access to Firebase console
4. Vercel account (optional, for alternative hosting)

### Deploy to Firebase Hosting

#### Step 1: Build the project

```bash
cd web-dashboard
npm run build
```

This creates a `dist/` folder with optimized production build.

#### Step 2: Initialize Firebase (if not done)

```bash
firebase init hosting
```

Select:
- **Public directory**: `web-dashboard/dist`
- **Configure as single-page app**: Yes
- **Automatic builds with GitHub**: No (for now)

#### Step 3: Deploy

```bash
firebase deploy --only hosting
```

#### Step 4: Verify deployment

```bash
firebase open hosting:site
```

This opens your app at:
- **Primary**: https://gsc26-dashboard-xyz.web.app
- **Secondary**: https://gsc26-dashboard-xyz.firebaseapp.com

---

## 🔧 Firebase Hosting Setup

### Project Structure

```
GSC26/
├── firebase.json           # Root Firebase config
├── web-dashboard/
│   ├── firebase.json       # App-specific config
│   ├── .firebaserc         # Firebase project reference
│   └── dist/               # Build output (after npm run build)
```

### Firebase Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": "web-dashboard/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Firebase Project Reference (`.firebaserc`)

```json
{
  "projects": {
    "default": "gsc26-dashboard-xyz"
  }
}
```

---

## 🔐 Environment Variables

### Development (.env)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=gsc26-dashboard-xyz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gsc26-dashboard-xyz
VITE_FIREBASE_STORAGE_BUCKET=gsc26-dashboard-xyz.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=497572973759
VITE_FIREBASE_APP_ID=1:497572973759:web:535502933827b4eeec4a0a
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_API_URL=http://localhost:5179
```

### Production

Environment variables should be set in Firebase Console:
- **Firebase Project Settings** → **Environment variables**
- Or use `.env` for build-time variables (Vite)

---

## 🐛 Troubleshooting

### Issue: Port 5179 already in use

```bash
# Find process using port 5179
netstat -ano | findstr :5179

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### Issue: Firebase deployment fails

```bash
# Check Firebase status
firebase projects:list

# Re-authenticate
firebase login

# Check hosting config
firebase hosting:sites:list
```

### Issue: Build fails with env variables

```bash
# Verify .env file exists
cat web-dashboard/.env

# Check Vite env prefix
# Make sure VITE_ prefix is used for client-side vars
```

### Issue: Hot reload not working

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

---

## 📊 Deployment Checklist

- [ ] Environment variables configured
- [ ] Build succeeds without errors
- [ ] Local testing on http://localhost:5179 passes
- [ ] Production build preview works
- [ ] Firebase project initialized
- [ ] `.firebaserc` configured correctly
- [ ] `firebase.json` contains correct paths
- [ ] SPA rewrite rule configured
- [ ] Deployment successful
- [ ] Both URLs accessible and working

---

## 🔗 Related Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [React Production Build](https://react.dev/learn/start-a-new-react-project#production-grade-tooling)

---

<div align="center">

**Last Updated**: April 2026

</div>