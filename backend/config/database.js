const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/judiciary-staff-management';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    
    // Exit process with failure if in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Function to check database health
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Function to seed initial data
const seedDatabase = async () => {
  try {
    const { User, CircuitCourt, MagisterialCourt } = require('../models');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Creating default admin user...');
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@judiciary.gov',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Default admin user created successfully');
      
      // Create sample circuit court
      const circuitCourt = new CircuitCourt({
        name: 'First Judicial Circuit Court',
        location: 'Charleston, WV',
        address: {
          street: '100 State Street',
          city: 'Charleston',
          state: 'WV',
          zipCode: '25301'
        },
        phone: '(304) 558-0145',
        email: 'info@firstcircuit.wv.gov',
        jurisdiction: 'Kanawha County',
        chiefJudge: 'Hon. John Smith',
        administratorId: adminUser._id,
        createdBy: adminUser._id
      });
      
      await circuitCourt.save();
      console.log('Sample circuit court created successfully');
      
      // Create sample magisterial court
      const magisterialCourt = new MagisterialCourt({
        name: 'Charleston Magisterial Court',
        location: 'Charleston, WV',
        address: {
          street: '200 Court Street',
          city: 'Charleston',
          state: 'WV',
          zipCode: '25301'
        },
        phone: '(304) 558-0200',
        email: 'info@charlestonmagistrate.wv.gov',
        circuitCourtId: circuitCourt._id,
        magistrateId: adminUser._id,
        jurisdiction: 'Charleston District',
        courtType: 'municipal',
        createdBy: adminUser._id
      });
      
      await magisterialCourt.save();
      console.log('Sample magisterial court created successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  seedDatabase
};