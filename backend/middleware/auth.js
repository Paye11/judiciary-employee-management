const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    req.user = user;
    next();
  });
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to check if user has circuit court role or higher
const requireCircuitOrAdmin = (req, res, next) => {
  if (!['admin', 'circuit'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Circuit court or admin access required'
    });
  }
  next();
};

// Middleware to check if user can access specific court data
const checkCourtAccess = (req, res, next) => {
  const { courtId, courtType } = req.params;
  const user = req.user;

  // Admin can access everything
  if (user.role === 'admin') {
    return next();
  }

  // Circuit court users can access their own circuit and magisterial courts under them
  if (user.role === 'circuit') {
    if (courtType === 'circuit' && parseInt(courtId) === user.circuitCourtId) {
      return next();
    }
    // Check if magisterial court belongs to this circuit
    if (courtType === 'magisterial') {
      // For now, allow circuit users to access magisterial courts
      // TODO: Implement proper circuit-magisterial relationship check
      return next();
    }
  }

  // Magisterial court users can only access their own court
  if (user.role === 'magisterial') {
    if (courtType === 'magisterial' && parseInt(courtId) === user.courtId) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied to this court data'
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCircuitOrAdmin,
  checkCourtAccess
};