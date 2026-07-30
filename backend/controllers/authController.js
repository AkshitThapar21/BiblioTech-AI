const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// @route   POST api/auth/register
// @desc    Register a user
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user exists using parameterized SQL query
    const userCheck = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'user';

    // Insert user into PostgreSQL users table using RETURNING clause
    const insertResult = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, userRole]
    );

    const newUser = insertResult.rows[0];

    const payload = { user: { id: newUser.id, role: newUser.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, role: newUser.role, username: newUser.username });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Query user by username using raw SQL
    const userResult = await db.query(
      'SELECT id, username, password, role FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
};
