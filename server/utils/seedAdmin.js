require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: 'admin@kukusgallery.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'admin@kukusgallery.com',
        password: 'KukusAdmin2026!',
        role: 'admin'
      });
      console.log('Admin user created: admin@kukusgallery.com / KukusAdmin2026!');
    } else {
      console.log('Admin user already exists');
    }

    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({});
      console.log('Default settings created');
    } else {
      console.log('Settings already exist');
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();
