const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Book = require('./models/Book');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bibliotech';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany();
    await Book.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    await User.create([
      { username: 'admin', password: adminPassword, role: 'admin' },
      { username: 'testuser', password: userPassword, role: 'user' }
    ]);

    await Book.create([
      {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt and David Thomas',
        genre: 'Software Engineering',
        isbn: '978-0135957059',
        stock: 5,
        aiSummary: ''
      },
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        genre: 'Software Engineering',
        isbn: '978-0132350884',
        stock: 2,
        aiSummary: ''
      }
    ]);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed database', err);
    process.exit(1);
  }
};

seedDatabase();
