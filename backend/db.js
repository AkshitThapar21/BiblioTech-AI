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
async function createInMemoryDb() {
  console.log('⚡ Starting PostgreSQL In-Memory Fallback Engine (pg-mem)...');
  const { newDb, DataType } = require('pg-mem');
  const mem = newDb();

  const roundImpl = (val, digits) => {
    if (val === null || val === undefined) return null;
    const factor = Math.pow(10, digits || 0);
    return Math.round(Number(val) * factor) / factor;
  };
  mem.public.registerFunction({
    name: 'round',
    args: [DataType.float, DataType.integer],
    returns: DataType.float,
    implementation: roundImpl
  });
  mem.public.registerFunction({
    name: 'round',
    args: [DataType.bigint, DataType.integer],
    returns: DataType.float,
    implementation: roundImpl
  });
  mem.public.registerFunction({
    name: 'round',
    args: [DataType.decimal, DataType.integer],
    returns: DataType.float,
    implementation: roundImpl
  });
  
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const cleanedSchema = schemaSql.replace(/DEFAULT \(CURRENT_TIMESTAMP \+ INTERVAL '14 days'\)/g, "DEFAULT CURRENT_TIMESTAMP");
  
  mem.public.none(cleanedSchema);
  
  const { Pool: MemPool } = mem.adapters.createPg();
  const memPool = new MemPool();
  
  // Populate initial seed data into in-memory PostgreSQL instance
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
      INSERT INTO books (title, author, genre, isbn, stock) VALUES
      ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 'Software Engineering', '978-0135957059', 5),
      ('Clean Code', 'Robert C. Martin', 'Software Engineering', '978-0132350884', 2),
      ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Software Engineering', '978-0201633610', 4),
      ('Dune', 'Frank Herbert', 'Science Fiction', '978-0441172719', 8),
      ('To Kill a Mockingbird', 'Harper Lee', 'Classic Literature', '978-0061120084', 7),
      ('1984', 'George Orwell', 'Dystopian Fiction', '978-0451524935', 10),
      ('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic Literature', '978-0743273565', 6),
      ('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', '978-0547928227', 9),
      ('Pride and Prejudice', 'Jane Austen', 'Classic Literature', '978-0141439518', 8),
      ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'Non-Fiction', '978-0062316097', 12),
      ('Atomic Habits', 'James Clear', 'Self-Help', '978-0735211292', 15),
      ('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', '978-0316769488', 5),
      ('Fahrenheit 451', 'Ray Bradbury', 'Dystopian Fiction', '978-1451673319', 8),
      ('The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', '978-0062315007', 11);
    `);

    client.release();
    console.log('✅ In-Memory PostgreSQL instance populated with initial tables & seed data!');
  } catch (e) {
    console.error('Error seeding in-memory PostgreSQL:', e.message);
  }

  return memPool;
}

let initPromise = null;
async function getPool() {
  if (poolInstance) return poolInstance;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const client = await Promise.race([
          realPool.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1000))
        ]);
        client.release();
        poolInstance = realPool;
        console.log('Connected to PostgreSQL database server.');
      } catch (err) {
        isInMemoryFallback = true;
        poolInstance = await createInMemoryDb();
      }
      return poolInstance;
    })();
  }
  return initPromise;
}

// Function to safely execute queries
async function query(text, params) {
  const p = await getPool();
  return p.query(text, params);
}

// Function to safely get client for transactions
async function getClient() {
  const p = await getPool();
  return p.connect();
}

module.exports = {
  query,
  getClient,
  get isInMemory() { return isInMemoryFallback; },
  get pool() { return poolInstance || realPool; }
};
