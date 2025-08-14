const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Staff, User, CircuitCourt, MagisterialCourt } = require('../models');
const { authenticateToken, requireAdmin, checkCourtAccess } = require('../middleware/auth');

const router = express.Router();

// Get all staff (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, courtType, courtId, search, page = 1, limit = 50 } = req.query;
    let query = {};

    // Filter by employment status
    if (status) {
      query.status = status;
    }

    // Filter by court type
    if (courtType) {
      query.courtType = courtType === 'circuit' ? 'CircuitCourt' : 'MagisterialCourt';
    }

    // Filter by court ID
    if (courtId) {
      query.courtId = courtId;
    }

    // Search functionality
    if (search) {
      const staff = await Staff.search(search)
        .populate('courtId')
        .populate('supervisor', 'name position')
        .populate('createdBy', 'name username')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      const total = await Staff.search(search).countDocuments();
      
      return res.json({
        success: true,
        data: staff,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    }

    // Regular query with pagination
    const staff = await Staff.find(query)
      .populate('courtId')
      .populate('supervisor', 'name position')
      .populate('createdBy', 'name username')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Staff.countDocuments(query);

    res.json({
      success: true,
      data: staff,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get staff by court
router.get('/court/:courtType/:courtId', [
  authenticateToken,
  param('courtType').isIn(['circuit', 'magisterial']).withMessage('Invalid court type'),
  param('courtId').isMongoId().withMessage('Invalid court ID')
], checkCourtAccess, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courtType, courtId } = req.params;
    const { status, search, page = 1, limit = 50 } = req.query;

    const courtTypeModel = courtType === 'circuit' ? 'CircuitCourt' : 'MagisterialCourt';
    let query = {
      courtId: courtId,
      courtType: courtTypeModel
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    let staff;
    let total;

    // Search functionality
    if (search) {
      staff = await Staff.find({
        ...query,
        $or: [
          { name: new RegExp(search, 'i') },
          { position: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { employeeId: new RegExp(search, 'i') }
        ]
      })
      .populate('courtId')
      .populate('supervisor', 'name position')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
      total = await Staff.countDocuments({
        ...query,
        $or: [
          { name: new RegExp(search, 'i') },
          { position: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { employeeId: new RegExp(search, 'i') }
        ]
      });
    } else {
      staff = await Staff.find(query)
        .populate('courtId')
        .populate('supervisor', 'name position')
        .sort({ name: 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      total = await Staff.countDocuments(query);
    }

    res.json({
      success: true,
      data: staff,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get staff by court error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get staff by status
router.get('/status/:status', [
  authenticateToken,
  param('status').isIn(['active', 'retired', 'dismissed', 'on-leave']).withMessage('Invalid status')
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

    const { status } = req.params;
    let filteredStaff = staffData.filter(staff => staff.employmentStatus === status);

    // Apply court access restrictions for non-admin users
    if (req.user.role !== 'admin') {
      if (req.user.role === 'circuit') {
        filteredStaff = filteredStaff.filter(staff => {
          if (staff.courtType === 'circuit') {
            return staff.courtId === req.user.courtId;
          }
          // For magisterial courts, check if they belong to this circuit
          const { circuitCourts } = require('../data/sampleData');
          const circuit = circuitCourts.find(c => c.userId === req.user.id);
          return circuit && circuit.magisterialCourts.some(m => m.id === staff.courtId);
        });
      } else if (req.user.role === 'magisterial') {
        filteredStaff = filteredStaff.filter(staff => 
          staff.courtType === 'magisterial' && staff.courtId === req.user.courtId
        );
      }
    }

    res.json({
      success: true,
      data: filteredStaff,
      total: filteredStaff.length
    });
  } catch (error) {
    console.error('Get staff by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single staff member
router.get('/:id', [
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Invalid staff ID')
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

    const staffId = parseInt(req.params.id);
    const staff = staffData.find(s => s.id === staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      let hasAccess = false;
      
      if (req.user.role === 'circuit') {
        if (staff.courtType === 'circuit' && staff.courtId === req.user.courtId) {
          hasAccess = true;
        } else if (staff.courtType === 'magisterial') {
          const { circuitCourts } = require('../data/sampleData');
          const circuit = circuitCourts.find(c => c.userId === req.user.id);
          hasAccess = circuit && circuit.magisterialCourts.some(m => m.id === staff.courtId);
        }
      } else if (req.user.role === 'magisterial') {
        hasAccess = staff.courtType === 'magisterial' && staff.courtId === req.user.courtId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this staff member'
        });
      }
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new staff member
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('Name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('courtType').isIn(['circuit', 'magisterial']).withMessage('Invalid court type'),
  body('courtId').isInt({ min: 1 }).withMessage('Invalid court ID'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('education').notEmpty().withMessage('Education is required'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Invalid salary')
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

    const {
      name,
      position,
      courtType,
      courtId,
      phone,
      email,
      education,
      salary
    } = req.body;

    // Check if user has permission to add staff to this court
    if (req.user.role !== 'admin') {
      let hasAccess = false;
      
      if (req.user.role === 'circuit') {
        if (courtType === 'circuit' && parseInt(courtId) === req.user.courtId) {
          hasAccess = true;
        } else if (courtType === 'magisterial') {
          const { circuitCourts } = require('../data/sampleData');
          const circuit = circuitCourts.find(c => c.userId === req.user.id);
          hasAccess = circuit && circuit.magisterialCourts.some(m => m.id === parseInt(courtId));
        }
      } else if (req.user.role === 'magisterial') {
        hasAccess = courtType === 'magisterial' && parseInt(courtId) === req.user.courtId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to add staff to this court'
        });
      }
    }

    // Check if email already exists
    const existingStaff = staffData.find(s => s.email === email);
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const newStaff = {
      id: getNextStaffId(),
      name,
      position,
      courtType,
      courtId: parseInt(courtId),
      phone,
      email,
      education,
      employmentStatus: 'active',
      salary: salary || 0,
      hireDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    staffData.push(newStaff);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: newStaff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update staff member
router.put('/:id', [
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Invalid staff ID'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('education').optional().notEmpty().withMessage('Education cannot be empty'),
  body('employmentStatus').optional().isIn(['active', 'retired', 'dismissed', 'on-leave']).withMessage('Invalid employment status'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Invalid salary')
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

    const staffId = parseInt(req.params.id);
    const staffIndex = staffData.findIndex(s => s.id === staffId);

    if (staffIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const staff = staffData[staffIndex];

    // Check access permissions
    if (req.user.role !== 'admin') {
      let hasAccess = false;
      
      if (req.user.role === 'circuit') {
        if (staff.courtType === 'circuit' && staff.courtId === req.user.courtId) {
          hasAccess = true;
        } else if (staff.courtType === 'magisterial') {
          const { circuitCourts } = require('../data/sampleData');
          const circuit = circuitCourts.find(c => c.userId === req.user.id);
          hasAccess = circuit && circuit.magisterialCourts.some(m => m.id === staff.courtId);
        }
      } else if (req.user.role === 'magisterial') {
        hasAccess = staff.courtType === 'magisterial' && staff.courtId === req.user.courtId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to update this staff member'
        });
      }
    }

    // Check if email already exists (excluding current staff)
    if (req.body.email && req.body.email !== staff.email) {
      const existingStaff = staffData.find(s => s.email === req.body.email && s.id !== staffId);
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update staff data
    const updatedStaff = {
      ...staff,
      ...req.body,
      updatedAt: new Date()
    };

    // Handle status change dates
    if (req.body.employmentStatus && req.body.employmentStatus !== staff.employmentStatus) {
      if (req.body.employmentStatus === 'retired') {
        updatedStaff.retirementDate = new Date();
      } else if (req.body.employmentStatus === 'dismissed') {
        updatedStaff.dismissalDate = new Date();
      }
    }

    staffData[staffIndex] = updatedStaff;

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete staff member (admin only)
router.delete('/:id', [
  authenticateToken,
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Invalid staff ID')
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

    const staffId = parseInt(req.params.id);
    const staffIndex = staffData.findIndex(s => s.id === staffId);

    if (staffIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const deletedStaff = staffData.splice(staffIndex, 1)[0];

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
      data: deletedStaff
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get staff statistics
router.get('/stats/overview', authenticateToken, (req, res) => {
  try {
    let filteredStaff = [...staffData];

    // Apply court access restrictions for non-admin users
    if (req.user.role !== 'admin') {
      if (req.user.role === 'circuit') {
        filteredStaff = filteredStaff.filter(staff => {
          if (staff.courtType === 'circuit') {
            return staff.courtId === req.user.courtId;
          }
          // For magisterial courts, check if they belong to this circuit
          const { circuitCourts } = require('../data/sampleData');
          const circuit = circuitCourts.find(c => c.userId === req.user.id);
          return circuit && circuit.magisterialCourts.some(m => m.id === staff.courtId);
        });
      } else if (req.user.role === 'magisterial') {
        filteredStaff = filteredStaff.filter(staff => 
          staff.courtType === 'magisterial' && staff.courtId === req.user.courtId
        );
      }
    }

    const stats = {
      total: filteredStaff.length,
      active: filteredStaff.filter(s => s.employmentStatus === 'active').length,
      retired: filteredStaff.filter(s => s.employmentStatus === 'retired').length,
      dismissed: filteredStaff.filter(s => s.employmentStatus === 'dismissed').length,
      onLeave: filteredStaff.filter(s => s.employmentStatus === 'on-leave').length,
      byCourtType: {
        circuit: filteredStaff.filter(s => s.courtType === 'circuit').length,
        magisterial: filteredStaff.filter(s => s.courtType === 'magisterial').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;