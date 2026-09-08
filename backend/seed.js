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
      INSERT INTO books (title, author, genre, isbn, stock, ai_summary) VALUES
      ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 'Software Engineering', '978-0135957059', 5, 'A timeless guide for software developers looking to hone their craft.'),
      ('Clean Code', 'Robert C. Martin', 'Software Engineering', '978-0132350884', 2, 'Essential principles for writing readable, maintainable, and robust code.'),
      ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Software Engineering', '978-0201633610', 4, 'Catalog of reusable object-oriented software patterns.'),
      ('Dune', 'Frank Herbert', 'Science Fiction', '978-0441172719', 8, 'Masterpiece of science fiction set in a distant desert world.'),
      ('To Kill a Mockingbird', 'Harper Lee', 'Classic Literature', '978-0061120084', 7, 'A profound examination of racial injustice and childhood innocence in the American South.'),
      ('1984', 'George Orwell', 'Dystopian Fiction', '978-0451524935', 10, 'A chilling portrait of a totalitarian regime where mass surveillance and thoughtcrime rule.'),
      ('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic Literature', '978-0743273565', 6, 'A haunting critique of the American Dream set in the Roaring Twenties amid glittering parties.'),
      ('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', '978-0547928227', 9, 'The epic adventure of Bilbo Baggins as he journeys with dwarves to reclaim the Lonely Mountain from Smaug.'),
      ('Pride and Prejudice', 'Jane Austen', 'Classic Literature', '978-0141439518', 8, 'A romantic masterpiece exploring manners, social standing, and misunderstandings in Regency England.'),
      ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'Non-Fiction', '978-0062316097', 12, 'An expansive survey tracing the evolutionary, cognitive, and social milestones of humankind.'),
      ('Atomic Habits', 'James Clear', 'Self-Help', '978-0735211292', 15, 'A practical framework demonstrating how tiny 1% changes accumulate into remarkable results.'),
      ('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', '978-0316769488', 5, 'Holden Caulfields iconic narrative exploring teenage disillusionment, vulnerability, and identity.'),
      ('Fahrenheit 451', 'Ray Bradbury', 'Dystopian Fiction', '978-1451673319', 8, 'A cautionary tale set in a bleak future where books are outlawed and firemen burn all contraband ideas.'),
      ('The Alchemist', 'Paulo Coelho', 'Philosophical Fiction', '978-0062315007', 11, 'An inspiring allegorical tale following Andalusian shepherd boy Santiago in pursuit of his Personal Legend.')
      RETURNING id, title, stock;
    `);

    console.log(`Books seeded: ${bookRes.rows.length} titles`);

    const bookMap = {};
    bookRes.rows.forEach(b => { bookMap[b.title] = b.id; });

    // Insert Book Loans (Lending activity for analytical testing)
    await client.query(`
      INSERT INTO book_loans (user_id, book_id, loan_date, due_date, status) VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '4 days', 'active'),
      ($1, $3, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '16 days', 'returned'),
      ($4, $2, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '9 days', 'active');
    `, [userId, bookMap['The Pragmatic Programmer'], bookMap['Clean Code'], adminId]);

    console.log('Book loans seeded successfully');

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
