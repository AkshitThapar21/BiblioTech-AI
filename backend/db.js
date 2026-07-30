const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let poolInstance = null;
let isInMemoryFallback = false;

// Create standard PostgreSQL Pool instance
const realPool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.PGHOST || 'localhost',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'bibliotech',
        port: parseInt(process.env.PGPORT || '5432', 10),
      }
);

// Initialize in-memory PostgreSQL emulator as fallback
function createInMemoryDb() {
  console.log('⚡ Starting PostgreSQL In-Memory Fallback Engine (pg-mem)...');
  const mem = newDb();
  
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const cleanedSchema = schemaSql.replace(/DEFAULT \(CURRENT_TIMESTAMP \+ INTERVAL '14 days'\)/g, "DEFAULT CURRENT_TIMESTAMP");
  
  mem.public.none(cleanedSchema);
  
  const { Pool: MemPool } = mem.adapters.createPg();
  const memPool = new MemPool();
  
  // Populate initial seed data into in-memory PostgreSQL instance
  (async () => {
    try {
      const client = await memPool.connect();
      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('admin123', salt);
      const userPass = await bcrypt.hash('user123', salt);

      await client.query(`
        INSERT INTO users (username, password, role) VALUES
        ($1, $2, 'admin'),
        ($3, $4, 'user');
      `, ['admin', adminPass, 'testuser', userPass]);

      await client.query(`
        INSERT INTO books (title, author, genre, isbn, stock, ai_summary) VALUES
        ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 'Software Engineering', '978-0135957059', 5, 'A timeless guide for software developers looking to hone their craft.'),
        ('Clean Code', 'Robert C. Martin', 'Software Engineering', '978-0132350884', 2, 'Essential principles for writing readable, maintainable, and robust code.'),
        ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Software Engineering', '978-0201633610', 4, 'Catalog of reusable object-oriented software patterns.'),
        ('Dune', 'Frank Herbert', 'Science Fiction', '978-0441172719', 8, 'Masterpiece of science fiction set in a distant desert world.');
      `);

      client.release();
      console.log('✅ In-Memory PostgreSQL instance populated with initial tables & seed data!');
    } catch (e) {
      console.error('Error seeding in-memory PostgreSQL:', e.message);
    }
  })();

  return memPool;
}

// Function to safely execute queries
async function query(text, params) {
  if (!poolInstance) {
    try {
      // Test real PostgreSQL connection with short timeout
      const client = await Promise.race([
        realPool.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1000))
      ]);
      client.release();
      poolInstance = realPool;
      console.log('Connected to PostgreSQL database server.');
    } catch (err) {
      isInMemoryFallback = true;
      poolInstance = createInMemoryDb();
    }
  }
  return poolInstance.query(text, params);
}

// Function to safely get client for transactions
async function getClient() {
  if (!poolInstance) {
    try {
      const client = await Promise.race([
        realPool.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1000))
      ]);
      client.release();
      poolInstance = realPool;
    } catch (err) {
      isInMemoryFallback = true;
      poolInstance = createInMemoryDb();
    }
  }
  return poolInstance.connect();
}

module.exports = {
  query,
  getClient,
  get pool() { return poolInstance || realPool; }
};
