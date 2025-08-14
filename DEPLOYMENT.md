# Deployment Guide

This guide will walk you through deploying the Judiciary Staff Management System using MongoDB Atlas, Render (backend), and Netlify (frontend).

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier available)
- Render account (free tier available)
- Netlify account (free tier available)

## Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project called "Judiciary Staff Management"

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "judiciary-cluster")
5. Click "Create Cluster"

### 1.3 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `judiciary-admin`
5. Generate a secure password and save it
6. Set database user privileges to "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (it should look like: `mongodb+srv://judiciary-admin:<password>@judiciary-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
5. Replace `<password>` with your actual password
6. Add the database name at the end: `mongodb+srv://judiciary-admin:<password>@judiciary-cluster.xxxxx.mongodb.net/judiciary-staff-management?retryWrites=true&w=majority`

## Step 2: Prepare Code for Deployment

### 2.1 Push Code to GitHub
1. Create a new repository on GitHub called "judiciary-staff-management"
2. Initialize git in your project directory:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/judiciary-staff-management.git
   git push -u origin main
   ```

### 2.2 Update Environment Configuration
1. Create a `.env.example` file in the backend directory:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_jwt_secret_here
   BCRYPT_SALT_ROUNDS=12
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up using your GitHub account

### 3.2 Deploy Backend Service
1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `judiciary-staff-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3.3 Configure Environment Variables
In the Render dashboard, add these environment variables:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `MONGODB_URI`: Your MongoDB connection string from Step 1.5
- `JWT_SECRET`: Generate a secure random string (32+ characters)
- `BCRYPT_SALT_ROUNDS`: `12`
- `FRONTEND_URL`: `https://your-netlify-app.netlify.app` (you'll update this after Netlify deployment)

### 3.4 Deploy
1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Note your backend URL (e.g., `https://judiciary-staff-backend.onrender.com`)

## Step 4: Deploy Frontend to Netlify

### 4.1 Create Netlify Account
1. Go to [Netlify](https://netlify.com)
2. Sign up using your GitHub account

### 4.2 Deploy Frontend
1. Click "New site from Git"
2. Choose GitHub and authorize Netlify
3. Select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `frontend`

### 4.3 Configure Custom Domain (Optional)
1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

### 4.4 Update Backend CORS
1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable with your Netlify URL
3. Redeploy the backend service

## Step 5: Verify Deployment

### 5.1 Test Backend
1. Visit `https://your-backend-url.onrender.com/api/health`
2. You should see a JSON response with status "OK" and database connection info

### 5.2 Test Frontend
1. Visit your Netlify URL
2. Try logging in with default credentials:
   - Username: `admin`
   - Password: `admin123`

### 5.3 Test Full Integration
1. Create a new circuit court
2. Add staff members
3. Verify data persistence by refreshing the page

## Step 6: Post-Deployment Configuration

### 6.1 Change Default Passwords
1. Log in as admin
2. Go to profile settings
3. Change the default admin password
4. Update any other default credentials

### 6.2 Configure Security Headers
Netlify automatically applies security headers from the `netlify.toml` file.

### 6.3 Set Up Monitoring
1. **Render**: Monitor your backend service in the Render dashboard
2. **MongoDB Atlas**: Monitor database performance in Atlas dashboard
3. **Netlify**: Monitor frontend deployment and analytics in Netlify dashboard

## Troubleshooting

### Common Issues

1. **Backend won't start**:
   - Check environment variables are set correctly
   - Verify MongoDB connection string
   - Check Render logs for specific errors

2. **Frontend can't connect to backend**:
   - Verify CORS configuration
   - Check that backend URL is correct in frontend
   - Ensure backend is running and accessible

3. **Database connection issues**:
   - Verify MongoDB Atlas network access settings
   - Check database user permissions
   - Ensure connection string is correct

4. **Authentication not working**:
   - Check JWT_SECRET is set
   - Verify token storage in browser
   - Check browser console for errors

### Logs and Debugging

- **Render logs**: Available in the Render dashboard under your service
- **Netlify logs**: Available in the Netlify dashboard under your site
- **MongoDB logs**: Available in MongoDB Atlas under Database > Monitoring
- **Browser console**: Press F12 to open developer tools

## Scaling and Optimization

### Performance Optimization
1. **Database**: Add indexes for frequently queried fields
2. **Backend**: Implement caching for static data
3. **Frontend**: Optimize images and implement lazy loading

### Scaling Options
1. **Render**: Upgrade to paid plans for better performance
2. **MongoDB Atlas**: Scale cluster size as data grows
3. **Netlify**: Upgrade for advanced features and better performance

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Ensure all communications use HTTPS
3. **Database**: Regularly update database user passwords
4. **Dependencies**: Keep all dependencies updated
5. **Monitoring**: Set up alerts for unusual activity

## Backup and Recovery

1. **Database**: MongoDB Atlas provides automatic backups
2. **Code**: Maintain regular commits to GitHub
3. **Configuration**: Document all environment variables and settings

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review service-specific documentation:
   - [Render Documentation](https://render.com/docs)
   - [Netlify Documentation](https://docs.netlify.com)
   - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
3. Check service status pages for outages

---

**Note**: Free tier limitations:
- Render: Services may sleep after 15 minutes of inactivity
- MongoDB Atlas: 512MB storage limit
- Netlify: 100GB bandwidth per month

Consider upgrading to paid plans for production use.