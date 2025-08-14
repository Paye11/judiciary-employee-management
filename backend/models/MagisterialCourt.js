const mongoose = require('mongoose');

const magisterialCourtSchema = new mongoose.Schema({
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
  circuitCourtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CircuitCourt',
    required: true
  },
  magistrateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jurisdiction: {
    type: String,
    trim: true
  },
  courtType: {
    type: String,
    enum: ['municipal', 'district', 'county', 'other'],
    default: 'municipal'
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
  operatingHours: {
    monday: { type: String, trim: true },
    tuesday: { type: String, trim: true },
    wednesday: { type: String, trim: true },
    thursday: { type: String, trim: true },
    friday: { type: String, trim: true },
    saturday: { type: String, trim: true },
    sunday: { type: String, trim: true }
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
magisterialCourtSchema.index({ name: 1 });
magisterialCourtSchema.index({ location: 1 });
magisterialCourtSchema.index({ circuitCourtId: 1 });
magisterialCourtSchema.index({ magistrateId: 1 });
magisterialCourtSchema.index({ isActive: 1 });

// Virtual for staff count
magisterialCourtSchema.virtual('staffCount', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'courtId',
  count: true,
  match: { courtType: 'magisterial' }
});

// Ensure virtual fields are serialized
magisterialCourtSchema.set('toJSON', { virtuals: true });
magisterialCourtSchema.set('toObject', { virtuals: true });

// Static method to find active courts
magisterialCourtSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by circuit court
magisterialCourtSchema.statics.findByCircuitCourt = function(circuitCourtId) {
  return this.find({ circuitCourtId: circuitCourtId, isActive: true }).sort({ name: 1 });
};

// Static method to find by magistrate
magisterialCourtSchema.statics.findByMagistrate = function(magistrateId) {
  return this.findOne({ magistrateId: magistrateId, isActive: true });
};

// Instance method to get full court info with related data
magisterialCourtSchema.methods.getFullInfo = async function() {
  await this.populate([
    { path: 'circuitCourtId', select: 'name location' },
    { path: 'magistrateId', select: 'name email username' },
    { path: 'createdBy', select: 'name username' }
  ]);
  return this;
};

// Pre-save middleware to validate circuit court exists
magisterialCourtSchema.pre('save', async function(next) {
  if (this.isModified('circuitCourtId')) {
    const CircuitCourt = mongoose.model('CircuitCourt');
    const circuitCourt = await CircuitCourt.findById(this.circuitCourtId);
    if (!circuitCourt || !circuitCourt.isActive) {
      return next(new Error('Invalid or inactive circuit court'));
    }
  }
  next();
});

module.exports = mongoose.model('MagisterialCourt', magisterialCourtSchema);