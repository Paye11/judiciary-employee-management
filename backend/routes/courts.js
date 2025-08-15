const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { User, CircuitCourt, MagisterialCourt } = require('../models');
const { authenticateToken, requireAdmin, requireCircuitOrAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get all circuit courts
router.get('/circuit', authenticateToken, async (req, res) => {
  try {
    // Check if database is available
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Fallback data when database is not available
      const fallbackCourts = [
        {
          _id: 'fallback-circuit-1',
          name: 'First Judicial Circuit Court',
          location: 'Monrovia',
          isActive: true,
          administratorId: {
            name: 'Administrator',
            email: 'admin@judiciary.gov.lr',
            username: 'admin'
          }
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackCourts,
        total: fallbackCourts.length,
        message: 'Database unavailable - showing fallback data'
      });
    }

    let query = { isActive: true };

    // Non-admin users can only see their own court or courts under their jurisdiction
    if (req.user.role === 'circuit') {
      query.administratorId = req.user.userId;
    } else if (req.user.role === 'magisterial') {
      // Magisterial courts can see their parent circuit court
      const user = await User.findById(req.user.userId);
      if (user && user.circuitCourtId) {
        query._id = user.circuitCourtId;
      }
    }

    const courts = await CircuitCourt.find(query)
      .populate('administratorId', 'name email username')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: courts,
      total: courts.length
    });
  } catch (error) {
    console.error('Get circuit courts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single circuit court
router.get('/circuit/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid court ID')
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

    const courtId = req.params.id;
    const court = await CircuitCourt.findById(courtId)
      .populate('administratorId', 'name email username')
      .populate('magisterialCourts');

    if (!court || !court.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Circuit court not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      if (req.user.role === 'circuit' && court.administratorId._id.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this court'
        });
      }
      if (req.user.role === 'magisterial') {
        const user = await User.findById(req.user.userId);
        if (!user || !user.circuitCourtId || user.circuitCourtId.toString() !== courtId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this court'
          });
        }
      }
    }

    res.json({
      success: true,
      data: court
    });
  } catch (error) {
    console.error('Get circuit court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new circuit court (admin only)
router.post('/circuit', [
  authenticateToken,
  requireAdmin,
  body('name').notEmpty().withMessage('Court name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const { name, location, username, password, adminName, address, phone, website, jurisdiction, chiefJudge, description } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }



    // Create new user for circuit court administrator
    const newUser = new User({
      username,
      password,
      name: adminName || `${name} Administrator`,
      role: 'circuit',
      createdBy: req.user.userId
    });

    await newUser.save();

    // Create new circuit court
    const newCourt = new CircuitCourt({
      name,
      location,
      address: address || {},
      phone,
      website,
      jurisdiction,
      chiefJudge,
      description,
      administratorId: newUser._id,
      createdBy: req.user.userId
    });

    await newCourt.save();

    // Update user's courtId
    newUser.courtId = newCourt._id;
    newUser.courtType = 'CircuitCourt';
    await newUser.save();

    // Populate the court with administrator info
    await newCourt.populate('administratorId', 'name email username');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Circuit court created successfully',
      data: {
        court: newCourt,
        administrator: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      }
    });

  } catch (error) {
    console.error('Create circuit court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update circuit court
router.put('/circuit/:id', [
  authenticateToken,
  requireCircuitOrAdmin,
  param('id').isInt({ min: 1 }).withMessage('Invalid court ID'),
  body('name').optional().notEmpty().withMessage('Court name cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty')
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

    const courtId = parseInt(req.params.id);
    const courtIndex = circuitCourts.findIndex(c => c.id === courtId);

    if (courtIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Circuit court not found'
      });
    }

    const court = circuitCourts[courtIndex];

    // Check access permissions
    if (req.user.role === 'circuit' && court.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to update this court'
      });
    }

    // Update court data
    const updatedCourt = {
      ...court,
      ...req.body,
      updatedAt: new Date()
    };

    circuitCourts[courtIndex] = updatedCourt;

    res.json({
      success: true,
      message: 'Circuit court updated successfully',
      data: updatedCourt
    });
  } catch (error) {
    console.error('Update circuit court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get magisterial courts for a circuit court
router.get('/circuit/:circuitId/magisterial', [
  authenticateToken,
  param('circuitId').isInt({ min: 1 }).withMessage('Invalid circuit court ID')
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

    const circuitId = parseInt(req.params.circuitId);
    const circuit = circuitCourts.find(c => c.id === circuitId);

    if (!circuit) {
      return res.status(404).json({
        success: false,
        message: 'Circuit court not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      if (req.user.role === 'circuit' && circuit.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this court data'
        });
      }
      if (req.user.role === 'magisterial' && circuit.id !== req.user.circuitCourtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this court data'
        });
      }
    }

    res.json({
      success: true,
      data: circuit.magisterialCourts,
      total: circuit.magisterialCourts.length
    });
  } catch (error) {
    console.error('Get magisterial courts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new magisterial court
router.post('/circuit/:circuitId/magisterial', [
  authenticateToken,
  requireCircuitOrAdmin,
  param('circuitId').isInt({ min: 1 }).withMessage('Invalid circuit court ID'),
  body('name').notEmpty().withMessage('Court name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const circuitId = parseInt(req.params.circuitId);
    const { name, username, password } = req.body;

    const circuitIndex = circuitCourts.findIndex(c => c.id === circuitId);
    if (circuitIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Circuit court not found'
      });
    }

    const circuit = circuitCourts[circuitIndex];

    // Check access permissions
    if (req.user.role === 'circuit' && circuit.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to create magisterial court for this circuit'
      });
    }

    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }



    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
    const newUserId = getNextUserId();
    const newCourtId = getNextCourtId();

    const newUser = {
      id: newUserId,
      username,
      password: hashedPassword,
      role: 'magisterial',
      name,
      circuitCourtId: circuitId,
      courtId: newCourtId,
      createdAt: new Date()
    };

    // Create magisterial court entry
    const newMagisterialCourt = {
      id: newCourtId,
      name
    };

    users.push(newUser);
    circuit.magisterialCourts.push(newMagisterialCourt);
    circuit.updatedAt = new Date();

    // Return data without sensitive user info
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Magisterial court created successfully',
      data: {
        court: newMagisterialCourt,
        user: userWithoutPassword,
        circuitCourt: circuit
      }
    });
  } catch (error) {
    console.error('Create magisterial court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete circuit court (admin only)
router.delete('/circuit/:id', [
  authenticateToken,
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Invalid court ID')
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

    const courtId = parseInt(req.params.id);
    const courtIndex = circuitCourts.findIndex(c => c.id === courtId);

    if (courtIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Circuit court not found'
      });
    }

    const court = circuitCourts[courtIndex];

    // Remove associated user account
    const userIndex = users.findIndex(u => u.id === court.userId);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }

    // Remove magisterial court users
    court.magisterialCourts.forEach(magCourt => {
      const magUserIndex = users.findIndex(u => u.courtId === magCourt.id && u.role === 'magisterial');
      if (magUserIndex !== -1) {
        users.splice(magUserIndex, 1);
      }
    });

    const deletedCourt = circuitCourts.splice(courtIndex, 1)[0];

    res.json({
      success: true,
      message: 'Circuit court and associated accounts deleted successfully',
      data: deletedCourt
    });
  } catch (error) {
    console.error('Delete circuit court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get court statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    let accessibleCircuits = [...circuitCourts];
    let totalMagisterialCourts = 0;

    // Apply access restrictions for non-admin users
    if (req.user.role === 'circuit') {
      accessibleCircuits = accessibleCircuits.filter(court => court.userId === req.user.id);
    } else if (req.user.role === 'magisterial') {
      accessibleCircuits = accessibleCircuits.filter(court => court.id === req.user.circuitCourtId);
    }

    // Count magisterial courts
    accessibleCircuits.forEach(circuit => {
      totalMagisterialCourts += circuit.magisterialCourts.length;
    });

    const stats = {
      circuitCourts: accessibleCircuits.length,
      magisterialCourts: totalMagisterialCourts,
      totalCourts: accessibleCircuits.length + totalMagisterialCourts
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get court stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;