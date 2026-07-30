const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection verification
const PORT = process.env.PORT || 5000;

db.query('SELECT NOW()')
  .then(res => console.log(`PostgreSQL connected successfully at ${res.rows[0].now}`))
  .catch(err => console.error('PostgreSQL connection error:', err.message));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

app.get('/', (req, res) => {
  res.send('BiblioTech SQL API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
