# 🚀 Quick Deployment Reference Card

**Essential URLs and Steps for Deploying Your Judiciary Staff Management System**

---

## 📋 Deployment Checklist

- [ ] **Step 1**: MongoDB Atlas Database
- [ ] **Step 2**: GitHub Repository
- [ ] **Step 3**: Render Backend
- [ ] **Step 4**: Netlify Frontend
- [ ] **Step 5**: Test & Secure

---

## 🔗 Essential URLs

| Service | URL | Purpose |
|---------|-----|----------|
| **MongoDB Atlas** | https://www.mongodb.com/cloud/atlas | Database hosting |
| **GitHub** | https://github.com | Code repository |
| **Render** | https://render.com | Backend hosting |
| **Netlify** | https://netlify.com | Frontend hosting |

---

## ⚙️ Environment Variables for Render

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://judiciary-admin:PASSWORD@judiciary-cluster.xxxxx.mongodb.net/judiciary-staff-management?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-make-it-32-characters-long-and-random
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=https://your-site.netlify.app
```

---

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Circuit Admin** | `circuit_admin` | `circuit123` |
| **Magistrate** | `magistrate_1` | `magistrate123` |

**⚠️ Change these passwords immediately after first login!**

---

## 🧪 Test URLs After Deployment

| Test | URL Format | Expected Result |
|------|------------|----------------|
| **Backend Health** | `https://your-backend.onrender.com/api/health` | `{"status":"OK","database":"connected"}` |
| **Frontend** | `https://your-site.netlify.app` | Login page loads |
| **Full Test** | Login with admin credentials | Dashboard appears |

---

## 🚨 Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|----------|
| **CORS Error** | Update `FRONTEND_URL` in Render with exact Netlify URL |
| **Database Connection** | Check MongoDB Atlas network access (0.0.0.0/0) |
| **Service Unavailable** | Wait 15 minutes (free tier wakes up) or check logs |
| **Login Fails** | Verify backend health endpoint first |

---

## 📱 Your Live Application URLs

**After deployment, fill these in:**

- **Frontend**: `https://________________________.netlify.app`
- **Backend**: `https://________________________.onrender.com`
- **Health Check**: `https://________________________.onrender.com/api/health`

---

## 📞 Support Resources

- **Detailed Tutorial**: [STEP_BY_STEP_DEPLOYMENT_TUTORIAL.md](STEP_BY_STEP_DEPLOYMENT_TUTORIAL.md)
- **Complete Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Troubleshooting**: Check service status pages and logs

---

**🎯 Estimated Time: 30-45 minutes**

**💡 Tip**: Keep this reference open while deploying!