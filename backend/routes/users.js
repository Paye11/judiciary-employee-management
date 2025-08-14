const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, param } = require('express-validator');
const { User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by username, firstName, lastName, or email
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('courtId')
      .populate('circuitCourtId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single user
router.get('/:id', [
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check access permissions - users can view their own profile, admins can view all
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new user (admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['admin', 'circuit', 'magisterial']).withMessage('Invalid role'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('courtId').optional().isInt({ min: 1 }).withMessage('Invalid court ID'),
  body('circuitCourtId').optional().isInt({ min: 1 }).withMessage('Invalid circuit court ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      username,
      password,
      role,
      name,
      email,
      courtId,
      circuitCourtId
    } = req.body;

    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = users.find(u => u.email === email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Validate role-specific requirements
    if (role === 'circuit' && !courtId) {
      return res.status(400).json({
        success: false,
        message: 'Court ID is required for circuit court users'
      });
    }

    if (role === 'magisterial' && (!courtId || !circuitCourtId)) {
      return res.status(400).json({
        success: false,
        message: 'Both court ID and circuit court ID are required for magisterial court users'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      id: getNextUserId(),
      username,
      password: hashedPassword,
      role,
      name,
      email,
      courtId: courtId || undefined,
      circuitCourtId: circuitCourtId || undefined,
      createdAt: new Date()
    };

    users.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user
router.put('/:id', [
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('username').optional().notEmpty().withMessage('Username cannot be empty'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('role').optional().isIn(['admin', 'circuit', 'magisterial']).withMessage('Invalid role'),
  body('courtId').optional().isInt({ min: 1 }).withMessage('Invalid court ID'),
  body('circuitCourtId').optional().isInt({ min: 1 }).withMessage('Invalid circuit court ID')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[userIndex];

    // Check access permissions
    // Admins can update any user, users can update their own profile (limited fields)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Non-admin users can only update limited fields
    if (req.user.role !== 'admin') {
      const allowedFields = ['name', 'email'];
      const requestedFields = Object.keys(req.body);
      const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
      
      if (unauthorizedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `You can only update: ${allowedFields.join(', ')}`
        });
      }
    }

    // Check if username already exists (excluding current user)
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = users.find(u => u.username === req.body.username && u.id !== userId);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email already exists (excluding current user)
    if (req.body.email && req.body.email !== user.email) {
      const existingEmail = users.find(u => u.email === req.body.email && u.id !== userId);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Validate role-specific requirements (admin only)
    if (req.user.role === 'admin' && req.body.role) {
      if (req.body.role === 'circuit' && !req.body.courtId && !user.courtId) {
        return res.status(400).json({
          success: false,
          message: 'Court ID is required for circuit court users'
        });
      }

      if (req.body.role === 'magisterial' && 
          (!req.body.courtId && !user.courtId || !req.body.circuitCourtId && !user.circuitCourtId)) {
        return res.status(400).json({
          success: false,
          message: 'Both court ID and circuit court ID are required for magisterial court users'
        });
      }
    }

    // Update user data
    const updatedUser = {
      ...user,
      ...req.body,
      updatedAt: new Date()
    };

    users[userIndex] = updatedUser;

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user password
router.put('/:id/password', [
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  body('currentPassword').if((value, { req }) => req.user.role !== 'admin').notEmpty().withMessage('Current password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[userIndex];

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify current password for non-admin users
    if (req.user.role !== 'admin') {
      let isValidPassword = false;
      if (user.password.startsWith('$2a$')) {
        isValidPassword = await bcrypt.compare(currentPassword, user.password);
      } else {
        isValidPassword = currentPassword === user.password;
      }

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    users[userIndex] = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', [
  authenticateToken,
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    
    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    const { password, ...userWithoutPassword } = deletedUser;

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = {
      total: users.length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        circuit: users.filter(u => u.role === 'circuit').length,
        magisterial: users.filter(u => u.role === 'magisterial').length
      },
      recentlyCreated: users.filter(u => {
        const createdDate = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate >= thirtyDaysAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;