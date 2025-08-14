# Judiciary Staff Management System

A comprehensive web application for managing judiciary staff across circuit and magisterial courts.

## Features

- **Multi-role Authentication**: Admin, Circuit Court, and Magisterial Court access levels
- **Staff Management**: Add, update, view, and manage staff members
- **Court Management**: Manage circuit and magisterial courts
- **Employment Status Tracking**: Active, Retired, Dismissed, On Leave
- **Role-based Access Control**: Different permissions based on user roles
- **RESTful API**: Complete backend API for all operations

## Architecture

### Project Structure
```
Staffmanagement/
├── frontend/          # Frontend application
│   ├── *.html        # HTML pages
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript files
│   ├── package.json  # Frontend dependencies
│   └── server.js     # Frontend server
├── backend/          # Backend API
│   ├── routes/       # API routes
│   ├── middleware/   # Authentication middleware
│   ├── data/         # Sample data
│   ├── package.json  # Backend dependencies
│   └── server.js     # Backend server
├── package.json      # Root project configuration
└── README.md         # Documentation
```

### Frontend
- **Technology**: HTML5, CSS3, JavaScript (ES6+)
- **Server**: Express.js static file server
- **Port**: 8080 (configurable)
- **Location**: `./frontend/`

### Backend
- **Technology**: Node.js with Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, Rate limiting, CORS
- **Port**: 3000 (configurable)
- **Location**: `./backend/`
- **Data Storage**: In-memory (for demo purposes)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd Staffmanagement
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
# Start both frontend and backend concurrently
npm start

# Or start them individually:
npm run start:frontend  # Frontend only (port 8080)
npm run start:backend   # Backend only (port 3000)
```

4. Open your browser and navigate to `http://localhost:8080`

## Deployment

This application can be deployed using:
- **Database:** MongoDB Atlas (cloud database)
- **Backend:** Render (Node.js hosting)
- **Frontend:** Netlify (static site hosting)

📖 **[Complete Deployment Guide](DEPLOYMENT.md)** - Step-by-step instructions for deploying to production.

### Quick Deployment Summary

1. **Set up MongoDB Atlas** - Create a free cluster and get connection string
2. **Deploy Backend to Render** - Connect GitHub repo, configure environment variables
3. **Deploy Frontend to Netlify** - Connect GitHub repo, automatic deployments
4. **Configure Environment Variables** - Set up production secrets and URLs

See the [DEPLOYMENT.md](DEPLOYMENT.md) file for detailed instructions.

## Default Login Credentials

### Administrator
- **Username**: admin
- **Password**: admin123

### Circuit Court
- **Username**: circuit1
- **Password**: circuit123

### Magisterial Court
- **Username**: mag1
- **Password**: mag123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Staff Management
- `GET /api/staff` - Get all staff (with filters)
- `POST /api/staff` - Create new staff member
- `GET /api/staff/:id` - Get staff member by ID
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member
- `GET /api/staff/court/:type/:id` - Get staff by court
- `GET /api/staff/status/:status` - Get staff by status
- `GET /api/staff/stats/overview` - Get staff statistics

### Court Management
- `GET /api/courts/circuit` - Get all circuit courts
- `POST /api/courts/circuit` - Create circuit court
- `GET /api/courts/circuit/:id` - Get circuit court by ID
- `PUT /api/courts/circuit/:id` - Update circuit court
- `DELETE /api/courts/circuit/:id` - Delete circuit court
- `GET /api/courts/circuit/:id/magisterial` - Get magisterial courts
- `POST /api/courts/circuit/:id/magisterial` - Create magisterial court

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `PUT /api/users/:id/password` - Update user password
- `GET /api/users/stats/overview` - Get user statistics

## Environment Configuration

The backend uses environment variables defined in `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configured for specific frontend origin
- **Helmet Security**: Additional HTTP security headers
- **Role-based Access Control**: Different permissions per user role

## Deployment Notes

### For Production Deployment:

1. **Environment Variables**: Update `.env` file with production values
2. **Database**: Replace in-memory storage with a persistent database (MongoDB, PostgreSQL, etc.)
3. **HTTPS**: Configure SSL/TLS certificates
4. **Process Management**: Use PM2 or similar for process management
5. **Reverse Proxy**: Configure Nginx or Apache as reverse proxy
6. **Monitoring**: Add logging and monitoring solutions

### Recommended Production Setup:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start server.js --name "judiciary-backend"

# Start frontend with PM2
cd ..
pm2 start server.js --name "judiciary-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## File Structure

```
Staffmanagement/
├── frontend/                    # Frontend Application
│   ├── css/
│   │   └── style.css           # Main stylesheet
│   ├── js/
│   │   ├── admin-dashboard.js   # Admin dashboard logic
│   │   ├── auth.js             # Authentication & API integration
│   │   ├── circuit-dashboard.js # Circuit court dashboard
│   │   └── magisterial-dashboard.js # Magisterial court dashboard
│   ├── admin-dashboard.html     # Admin dashboard page
│   ├── circuit-dashboard.html   # Circuit court dashboard
│   ├── index.html              # Login page
│   ├── magisterial-dashboard.html # Magisterial court dashboard
│   ├── package.json            # Frontend dependencies
│   ├── package-lock.json       # Frontend lock file
│   └── server.js               # Frontend Express server
├── backend/                     # Backend API
│   ├── data/
│   │   └── sampleData.js       # Sample data for demo
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── courts.js           # Court management routes
│   │   ├── staff.js            # Staff management routes
│   │   └── users.js            # User management routes
│   ├── .env                    # Environment variables
│   ├── package.json            # Backend dependencies
│   ├── package-lock.json       # Backend lock file
│   └── server.js               # Backend Express server
├── package.json                 # Root project configuration
└── README.md                    # Project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team.