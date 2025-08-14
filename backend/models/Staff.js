const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'courtType',
    required: true
  },
  courtType: {
    type: String,
    required: true,
    enum: ['CircuitCourt', 'MagisterialCourt']
  },
  employeeId: {
    type: String,
    unique: true,
    trim: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_leave'],
    default: 'active'
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
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
staffSchema.index({ email: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ courtId: 1, courtType: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ position: 1 });
staffSchema.index({ name: 1 });

// Virtual for full name (if needed for display)
staffSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for court info
staffSchema.virtual('court', {
  ref: function() {
    return this.courtType;
  },
  localField: 'courtId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

// Static method to find active staff
staffSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Static method to find by court
staffSchema.statics.findByCourt = function(courtId, courtType) {
  return this.find({ courtId: courtId, courtType: courtType }).sort({ name: 1 });
};

// Static method to find by position
staffSchema.statics.findByPosition = function(position) {
  return this.find({ position: new RegExp(position, 'i'), status: 'active' }).sort({ name: 1 });
};

// Static method to search staff
staffSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { position: searchRegex },
      { department: searchRegex },
      { employeeId: searchRegex }
    ],
    status: 'active'
  }).sort({ name: 1 });
};

// Instance method to get full staff info with related data
staffSchema.methods.getFullInfo = async function() {
  await this.populate([
    { path: 'court' },
    { path: 'supervisor', select: 'name position email' },
    { path: 'createdBy', select: 'name username' },
    { path: 'lastModifiedBy', select: 'name username' }
  ]);
  return this;
};

// Pre-save middleware to generate employee ID if not provided
staffSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(6, '0')}`;
  }
  
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // This should be set by the controller
  }
  
  next();
});

// Pre-save middleware to validate court exists
staffSchema.pre('save', async function(next) {
  if (this.isModified('courtId') || this.isModified('courtType')) {
    const CourtModel = mongoose.model(this.courtType);
    const court = await CourtModel.findById(this.courtId);
    if (!court || !court.isActive) {
      return next(new Error('Invalid or inactive court'));
    }
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);