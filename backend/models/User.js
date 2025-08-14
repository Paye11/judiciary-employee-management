const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'circuit', 'magisterial'],
    default: 'magisterial'
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'courtType',
    required: function() {
      return this.role !== 'admin';
    }
  },
  courtType: {
    type: String,
    enum: ['CircuitCourt', 'MagisterialCourt'],
    required: function() {
      return this.role !== 'admin';
    }
  },
  circuitCourtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CircuitCourt',
    required: function() {
      return this.role === 'magisterial';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find by username or email
userSchema.statics.findByCredentials = async function(identifier) {
  const user = await this.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  });
  return user;
};

module.exports = mongoose.model('User', userSchema);