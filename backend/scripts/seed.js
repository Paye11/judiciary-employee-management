const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { User, CircuitCourt, MagisterialCourt, Staff } = require('../models');

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/judiciary-staff-management');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// Seed data
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await CircuitCourt.deleteMany({});
        await MagisterialCourt.deleteMany({});
        await Staff.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const adminUser = new User({
            username: 'admin',
            email: 'admin@judiciary.gov',
            password: adminPassword,
            role: 'admin',
            firstName: 'System',
            lastName: 'Administrator',
            isActive: true
        });
        await adminUser.save();
        console.log('✅ Created admin user');

        // Create sample circuit court
        const circuitCourtAdmin = new User({
            username: 'circuit_admin',
            email: 'circuit.admin@judiciary.gov',
            password: await bcrypt.hash('circuit123', 12),
            role: 'circuit',
            firstName: 'Circuit',
            lastName: 'Administrator',
            isActive: true
        });
        await circuitCourtAdmin.save();

        const circuitCourt = new CircuitCourt({
            name: 'First Judicial Circuit',
            location: 'Capital City',
            address: {
                street: '123 Justice Boulevard',
                city: 'Capital City',
                state: 'State',
                zipCode: '12345',
                country: 'Country'
            },
            phone: '+1-555-0100',
            email: 'first.circuit@judiciary.gov',
            website: 'https://firstcircuit.judiciary.gov',
            administratorId: circuitCourtAdmin._id,
            jurisdiction: 'First Judicial Circuit covers the capital region and surrounding counties.',
            chiefJudge: 'Hon. Chief Judge Smith',
            isActive: true,
            establishedDate: new Date('2000-01-01'),
            description: 'The First Judicial Circuit serves the capital region with comprehensive judicial services.'
        });
        await circuitCourt.save();

        // Update circuit court admin with court reference
        circuitCourtAdmin.courtId = circuitCourt._id;
        circuitCourtAdmin.courtType = 'CircuitCourt';
        await circuitCourtAdmin.save();
        console.log('✅ Created sample circuit court');

        // Create sample magisterial court
        const magistrateUser = new User({
            username: 'magistrate_1',
            email: 'magistrate1@judiciary.gov',
            password: await bcrypt.hash('magistrate123', 12),
            role: 'magisterial',
            firstName: 'John',
            lastName: 'Magistrate',
            isActive: true
        });
        await magistrateUser.save();

        const magisterialCourt = new MagisterialCourt({
            name: 'Capital City Magisterial Court',
            location: 'Capital City Downtown',
            address: {
                street: '456 Court Street',
                city: 'Capital City',
                state: 'State',
                zipCode: '12345',
                country: 'Country'
            },
            phone: '+1-555-0200',
            email: 'capital.magistrate@judiciary.gov',
            circuitCourtId: circuitCourt._id,
            magistrateId: magistrateUser._id,
            jurisdiction: 'Capital City and immediate suburbs',
            courtType: 'General',
            isActive: true,
            establishedDate: new Date('2005-01-01'),
            description: 'Handles preliminary hearings, traffic violations, and minor civil matters.',
            operatingHours: {
                monday: '8:00 AM - 5:00 PM',
                tuesday: '8:00 AM - 5:00 PM',
                wednesday: '8:00 AM - 5:00 PM',
                thursday: '8:00 AM - 5:00 PM',
                friday: '8:00 AM - 4:00 PM',
                saturday: 'Closed',
                sunday: 'Closed'
            },
            createdBy: adminUser._id
        });
        await magisterialCourt.save();

        // Update magistrate user with court reference
        magistrateUser.courtId = magisterialCourt._id;
        magistrateUser.courtType = 'MagisterialCourt';
        await magistrateUser.save();
        console.log('✅ Created sample magisterial court');

        // Create sample staff members
        const staffMembers = [
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@judiciary.gov',
                phone: '+1-555-0301',
                position: 'Court Clerk',
                department: 'Administration',
                courtId: circuitCourt._id,
                courtType: 'CircuitCourt',
                hireDate: new Date('2020-01-15'),
                salary: 45000,
                status: 'active',
                address: {
                    street: '789 Elm Street',
                    city: 'Capital City',
                    state: 'State',
                    zipCode: '12345'
                },
                emergencyContact: {
                    name: 'John Smith',
                    relationship: 'Spouse',
                    phone: '+1-555-0302'
                },
                createdBy: adminUser._id
            },
            {
                firstName: 'Robert',
                lastName: 'Johnson',
                email: 'robert.johnson@judiciary.gov',
                phone: '+1-555-0401',
                position: 'Bailiff',
                department: 'Security',
                courtId: magisterialCourt._id,
                courtType: 'MagisterialCourt',
                hireDate: new Date('2019-03-20'),
                salary: 42000,
                status: 'active',
                address: {
                    street: '321 Oak Avenue',
                    city: 'Capital City',
                    state: 'State',
                    zipCode: '12345'
                },
                emergencyContact: {
                    name: 'Mary Johnson',
                    relationship: 'Wife',
                    phone: '+1-555-0402'
                },
                createdBy: adminUser._id
            },
            {
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'sarah.williams@judiciary.gov',
                phone: '+1-555-0501',
                position: 'Court Reporter',
                department: 'Court Services',
                courtId: circuitCourt._id,
                courtType: 'CircuitCourt',
                hireDate: new Date('2021-06-10'),
                salary: 48000,
                status: 'active',
                address: {
                    street: '654 Pine Road',
                    city: 'Capital City',
                    state: 'State',
                    zipCode: '12345'
                },
                emergencyContact: {
                    name: 'David Williams',
                    relationship: 'Brother',
                    phone: '+1-555-0502'
                },
                createdBy: adminUser._id
            }
        ];

        for (const staffData of staffMembers) {
            const staff = new Staff(staffData);
            await staff.save();
        }
        console.log('✅ Created sample staff members');

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📋 Default Login Credentials:');
        console.log('Admin: admin / admin123');
        console.log('Circuit Admin: circuit_admin / circuit123');
        console.log('Magistrate: magistrate_1 / magistrate123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await seedDatabase();
        console.log('\n✅ Seeding process completed successfully!');
    } catch (error) {
        console.error('❌ Seeding process failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('📡 Database connection closed');
        process.exit(0);
    }
};

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { seedDatabase };