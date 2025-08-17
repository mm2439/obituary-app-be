# 🕊️ Obituary App Backend - Now Serverless!

## 🚀 **MAJOR UPDATE: Migrated to Netlify Functions + Supabase**

This backend has been completely modernized:
- ✅ **Serverless Architecture** - No more Docker needed!
- ✅ **Supabase Database** - Fully migrated from MySQL
- ✅ **Netlify Functions** - Auto-scaling serverless deployment
- ✅ **GitHub Integration** - Deploy on every push

## 📋 Quick Start (New Way)

### Local Development
```bash
# 1. Clone and install
git clone <repo-url>
cd obituary-app-be
npm install

# 2. Set up environment (no Docker needed!)
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start development server
npm run dev
```

### Deploy to Production
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Connect to Netlify (one-time setup)
# - Go to netlify.com
# - Connect your GitHub repo
# - Set environment variables
# - Deploy automatically!
```

## 🎯 **For Frontend Developers**

Your API is now available at: `https://your-site.netlify.app`

Update your frontend config:
```javascript
// Replace old backend URL with:
const API_BASE_URL = 'https://your-site.netlify.app';
```

## 📚 Complete Documentation

- [**🚀 Netlify Deployment Guide**](docs/NETLIFY_GITHUB_DEPLOYMENT.md) - Complete deployment instructions
- [**📱 Frontend Integration**](docs/FRONTEND_AUTH_API_GUIDE.md) - How to use the API
- [**🔐 Supabase Session Management**](docs/SUPABASE_SESSION_MANAGEMENT.md) - Advanced auth features

## 🧪 Testing

```bash
# Test auth flow
npm run auth:smoke

# Test Netlify functions (after deployment)
npm run test:netlify
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/user` | Register user |
| POST | `/api/auth-login` | Login |
| POST | `/api/auth-logout` | Logout |
| GET | `/api/user/me` | Get profile |
| PATCH | `/api/user/me` | Update profile |

## 🔧 Environment Variables (Netlify)

Set these in Netlify Dashboard:
```
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## 🤝 Contributing (Updated Process)

1. **No more Docker setup needed!**
2. Test with: `npm run auth:smoke`
3. Create branch and push to GitHub
4. Netlify auto-deploys on merge
5. Add `mm2439` as reviewer

**🚀 Your backend is now production-ready with serverless architecture!**
