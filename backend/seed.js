const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const seedDatabase = async () => {
  const client = await db.getClient();
  try {
    console.log('Starting PostgreSQL Database Seeding...');

    // Read and execute schema DDL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('PostgreSQL Tables & Indexes created successfully');

    // Create passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    // Insert Users
    const userRes = await client.query(`
      INSERT INTO users (username, password, role) VALUES
      ($1, $2, 'admin'),
      ($3, $4, 'user')
      RETURNING id, username, role;
    `, ['admin', adminPassword, 'testuser', userPassword]);

    const adminId = userRes.rows.find(u => u.username === 'admin').id;
    const userId = userRes.rows.find(u => u.username === 'testuser').id;

    console.log(`Users seeded: admin (ID: ${adminId}), testuser (ID: ${userId})`);

    // Insert Books
    const bookRes = await client.query(`
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
      ('The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', '978-0062315007', 11)
      RETURNING id, title, stock;
    `);

    console.log(`Books seeded: ${bookRes.rows.length} titles`);

    const bookMap = {};
    bookRes.rows.forEach(b => { bookMap[b.title] = b.id; });

    // Insert Inventory Logs
    await client.query(`
      INSERT INTO inventory_logs (book_id, change_amount, transaction_type, notes) VALUES
      ($1, 5, 'initial_stock', 'Initial seed stock'),
      ($2, 2, 'initial_stock', 'Initial seed stock'),
      ($3, 4, 'initial_stock', 'Initial seed stock'),
      ($4, 8, 'initial_stock', 'Initial seed stock');
    `, [bookMap['The Pragmatic Programmer'], bookMap['Clean Code'], bookMap['Design Patterns'], bookMap['Dune']]);

    console.log('Inventory logs seeded successfully');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed database:', err);
    process.exit(1);
  } finally {
    client.release();
  }
};

seedDatabase();
