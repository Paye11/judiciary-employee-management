const mongoose = require('mongoose');

const circuitCourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  jurisdiction: {
    type: String,
    trim: true
  },
  chiefJudge: {
    type: String,
    trim: true
  },
  administratorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  establishedDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
circuitCourtSchema.index({ name: 1 });
circuitCourtSchema.index({ location: 1 });
circuitCourtSchema.index({ administratorId: 1 });
circuitCourtSchema.index({ isActive: 1 });

// Virtual for magisterial courts
circuitCourtSchema.virtual('magisterialCourts', {
  ref: 'MagisterialCourt',
  localField: '_id',
  foreignField: 'circuitCourtId'
});

// Virtual for staff count
circuitCourtSchema.virtual('staffCount', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'courtId',
  count: true,
  match: { courtType: 'circuit' }
});

// Ensure virtual fields are serialized
circuitCourtSchema.set('toJSON', { virtuals: true });
circuitCourtSchema.set('toObject', { virtuals: true });

// Static method to find active courts
circuitCourtSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by administrator
circuitCourtSchema.statics.findByAdministrator = function(adminId) {
  return this.findOne({ administratorId: adminId, isActive: true });
};

// Instance method to get full court info with related data
circuitCourtSchema.methods.getFullInfo = async function() {
  await this.populate([
    { path: 'administratorId', select: 'name email username' },
    { path: 'magisterialCourts', match: { isActive: true } },
    { path: 'createdBy', select: 'name username' }
  ]);
  return this;
};

module.exports = mongoose.model('CircuitCourt', circuitCourtSchema);