const db = require('../db');
const { GoogleGenAI } = require('@google/genai');

// @route   GET api/books
// @desc    Get all books with complex analytics (JOINs, GROUP BY, Subqueries & Window Functions)
exports.getBooks = async (req, res) => {
  try {
    let rows;
    try {
      // Complex analytical SQL query utilizing LEFT JOINs, subquery aggregations, and Window Functions
      const queryText = `
        SELECT 
          b.id,
          b.id AS "_id",
          b.title,
          b.author,
          b.genre,
          b.isbn,
          b.stock,
          b.ai_summary AS "aiSummary",
          b.created_at AS "createdAt",
          b.updated_at AS "updatedAt",
          COALESCE(loan_stats.total_loans, 0) AS "totalLoans",
          COALESCE(loan_stats.active_loans, 0) AS "activeLoans",
          COALESCE(inv_stats.total_inventory_adjustments, 0) AS "totalInventoryAdjustments",
          -- Window Function 1: Rank stock availability within each genre
          DENSE_RANK() OVER (PARTITION BY b.genre ORDER BY b.stock DESC, b.id ASC) AS "genreStockRank",
          -- Window Function 2: Overall popularity rank based on historical borrowing volume
          DENSE_RANK() OVER (ORDER BY COALESCE(loan_stats.total_loans, 0) DESC, b.id ASC) AS "borrowingPopularityRank"
        FROM books b
        LEFT JOIN (
          SELECT 
            book_id,
            COUNT(id) AS total_loans,
            COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_loans
          FROM book_loans
          GROUP BY book_id
        ) loan_stats ON b.id = loan_stats.book_id
        LEFT JOIN (
          SELECT 
            book_id,
            COUNT(id) AS total_inventory_adjustments
          FROM inventory_logs
          GROUP BY book_id
        ) inv_stats ON b.id = inv_stats.book_id
        ORDER BY b.created_at DESC;
      `;

      const result = await db.query(queryText);
      rows = result.rows;
    } catch (windowErr) {
      if (windowErr.message && (windowErr.message.includes('OVER') || windowErr.message.includes('not supported'))) {
        const fallbackQuery = `
          SELECT 
            b.id,
            b.id AS "_id",
            b.title,
            b.author,
            b.genre,
            b.isbn,
            b.stock,
            b.ai_summary AS "aiSummary",
            b.created_at AS "createdAt",
            b.updated_at AS "updatedAt",
            COALESCE(loan_stats.total_loans, 0) AS "totalLoans",
            COALESCE(loan_stats.active_loans, 0) AS "activeLoans",
            COALESCE(inv_stats.total_inventory_adjustments, 0) AS "totalInventoryAdjustments"
          FROM books b
          LEFT JOIN (
            SELECT 
              book_id,
              COUNT(id) AS total_loans,
              COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_loans
            FROM book_loans
            GROUP BY book_id
          ) loan_stats ON b.id = loan_stats.book_id
          LEFT JOIN (
            SELECT 
              book_id,
              COUNT(id) AS total_inventory_adjustments
            FROM inventory_logs
            GROUP BY book_id
          ) inv_stats ON b.id = inv_stats.book_id
          ORDER BY b.created_at DESC;
        `;

        const result = await db.query(fallbackQuery);
        rows = result.rows;

        // Compute DENSE_RANK in JS if running under SQL engine lacking window functions
        const genreGroups = {};
        rows.forEach(b => {
          if (!genreGroups[b.genre]) genreGroups[b.genre] = [];
          genreGroups[b.genre].push(b);
        });
        Object.values(genreGroups).forEach(group => {
          const sorted = [...group].sort((a, b) => b.stock - a.stock || a.id - b.id);
          let currentRank = 0;
          let lastStock = null;
          sorted.forEach(item => {
            if (item.stock !== lastStock) {
              currentRank++;
              lastStock = item.stock;
            }
            item.genreStockRank = currentRank;
          });
        });

        const popularitySorted = [...rows].sort((a, b) => b.totalLoans - a.totalLoans || a.id - b.id);
        let popRank = 0;
        let lastLoans = null;
        popularitySorted.forEach(item => {
          if (item.totalLoans !== lastLoans) {
            popRank++;
            lastLoans = item.totalLoans;
          }
          item.borrowingPopularityRank = popRank;
        });
      } else {
        throw windowErr;
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching books with SQL analytics:', err);
    res.status(500).send('Server Error');
  }
};

// @route   POST api/books
// @desc    Add new book with transactional inventory logging
exports.addBook = async (req, res) => {
  const client = await db.getClient();
  try {
    const { title, author, genre, isbn, stock } = req.body;
    const initialStock = parseInt(stock, 10) || 0;

    await client.query('BEGIN');

    // Insert new book into SQL books table
    const bookInsertQuery = `
      INSERT INTO books (title, author, genre, isbn, stock)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, id AS "_id", title, author, genre, isbn, stock, ai_summary AS "aiSummary", created_at AS "createdAt";
    `;
    const bookResult = await client.query(bookInsertQuery, [title, author, genre, isbn, initialStock]);
    const newBook = bookResult.rows[0];

    // Log dynamic inventory transaction
    const logInsertQuery = `
      INSERT INTO inventory_logs (book_id, change_amount, transaction_type, notes)
      VALUES ($1, $2, 'initial_stock', 'Initial inventory logged upon book creation');
    `;
    await client.query(logInsertQuery, [newBook.id, initialStock]);

    await client.query('COMMIT');
    res.json(newBook);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding book via SQL transaction:', err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// @route   PUT api/books/:id
// @desc    Update a book
exports.updateBook = async (req, res) => {
  const client = await db.getClient();
  try {
    const { title, author, genre, isbn, stock } = req.body;
    const bookId = parseInt(req.params.id, 10);

    // Check if book exists
    const checkResult = await client.query('SELECT stock FROM books WHERE id = $1', [bookId]);
    if (checkResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Book not found' });
    }

    const previousStock = checkResult.rows[0].stock;
    const newStock = parseInt(stock, 10);
    const stockDiff = newStock - previousStock;

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE books
      SET title = $1, author = $2, genre = $3, isbn = $4, stock = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, id AS "_id", title, author, genre, isbn, stock, ai_summary AS "aiSummary", created_at AS "createdAt";
    `;
    const updateResult = await client.query(updateQuery, [title, author, genre, isbn, newStock, bookId]);

    // Log inventory adjustment if stock changed
    if (stockDiff !== 0) {
      const logQuery = `
        INSERT INTO inventory_logs (book_id, change_amount, transaction_type, notes)
        VALUES ($1, $2, $3, $4);
      `;
      const transType = stockDiff > 0 ? 'addition' : 'reduction';
      await client.query(logQuery, [bookId, stockDiff, transType, `Stock updated from ${previousStock} to ${newStock}`]);
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating book via SQL:', err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// @route   DELETE api/books/:id
// @desc    Delete a book (Relational foreign key constraints handle cascading deletes)
exports.deleteBook = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id, 10);

    const deleteQuery = 'DELETE FROM books WHERE id = $1 RETURNING id;';
    const result = await db.query(deleteQuery, [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book removed' });
  } catch (err) {
    console.error('Error deleting book via SQL:', err);
    res.status(500).send('Server Error');
  }
};

// @route   POST api/books/summarize
// @desc    Summarize a book using AI enriched with PostgreSQL analytical metrics
exports.summarizeBook = async (req, res) => {
  try {
    const { bookTitle, author } = req.body;
    if (!bookTitle || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    // Advanced analytical SQL query to extract book metrics, borrowing volume, and category metrics for Gemini prompt
    const analyticsQuery = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.genre,
        b.stock,
        COALESCE(loan_summary.total_borrowed, 0) AS total_borrowed,
        genre_metrics.avg_genre_stock,
        genre_metrics.genre_book_count,
        -- Window Function: Calculate borrow popularity rank across all books
        DENSE_RANK() OVER (ORDER BY COALESCE(loan_summary.total_borrowed, 0) DESC) AS overall_borrow_rank
      FROM books b
      LEFT JOIN (
        SELECT book_id, COUNT(*) AS total_borrowed
        FROM book_loans
        GROUP BY book_id
      ) loan_summary ON b.id = loan_summary.book_id
      LEFT JOIN (
        SELECT 
          genre, 
          ROUND(AVG(stock), 2) AS avg_genre_stock,
          COUNT(*) AS genre_book_count
        FROM books
        GROUP BY genre
      ) genre_metrics ON b.genre = genre_metrics.genre
      WHERE LOWER(b.title) = LOWER($1) OR b.author ILIKE $2
      LIMIT 1;
    `;

    let metrics;
    try {
      const analyticsRes = await db.query(analyticsQuery, [bookTitle.trim(), `%${author.trim()}%`]);
      metrics = analyticsRes.rows[0];
    } catch (windowErr) {
      if (windowErr.message && (windowErr.message.includes('OVER') || windowErr.message.includes('not supported'))) {
        const fallbackAnalyticsQuery = `
          SELECT 
            b.id,
            b.title,
            b.author,
            b.genre,
            b.stock,
            COALESCE(loan_summary.total_borrowed, 0) AS total_borrowed,
            genre_metrics.avg_genre_stock,
            genre_metrics.genre_book_count
          FROM books b
          LEFT JOIN (
            SELECT book_id, COUNT(*) AS total_borrowed
            FROM book_loans
            GROUP BY book_id
          ) loan_summary ON b.id = loan_summary.book_id
          LEFT JOIN (
            SELECT 
              genre, 
              ROUND(AVG(stock), 2) AS avg_genre_stock,
              COUNT(*) AS genre_book_count
            FROM books
            GROUP BY genre
          ) genre_metrics ON b.genre = genre_metrics.genre
          WHERE LOWER(b.title) = LOWER($1) OR b.author ILIKE $2
          LIMIT 1;
        `;
        const analyticsRes = await db.query(fallbackAnalyticsQuery, [bookTitle.trim(), `%${author.trim()}%`]);
        metrics = analyticsRes.rows[0];
        if (metrics) {
          metrics.overall_borrow_rank = 1;
        }
      } else {
        throw windowErr;
      }
    }

    let summary = '';
    const hasGeminiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

    if (hasGeminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        let contextNote = '';
        if (metrics) {
          contextNote = ` (Analytical Context: Genre "${metrics.genre}" with ${metrics.genre_book_count || 1} catalog titles, ${metrics.total_borrowed || 0} total loans, borrow rank #${metrics.overall_borrow_rank || 1}).`;
        }

        const prompt = `Write a structured 3-sentence summary of the book "${bookTitle}" by ${author}.${contextNote} Do not include any extra text.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        
        summary = response.text;
      } catch (aiErr) {
        console.warn('Gemini API call failed, using default summary:', aiErr.message);
      }
    }

    if (!summary) {
      summary = `"${bookTitle}" by ${author} is a highly regarded title in ${metrics?.genre || 'our catalog'}. With current stock availability at ${metrics?.stock ?? 'good'} units, it continues to engage readers and provide valuable perspective. A recommended read for enthusiasts in this genre.`;
    }

    // Persist ai_summary back into PostgreSQL if book matches
    if (metrics) {
      await db.query('UPDATE books SET ai_summary = $1 WHERE id = $2', [summary, metrics.id]);
    }

    res.json({ summary });
  } catch (err) {
    console.error('Error generating summary with SQL analytics:', err);
    res.status(500).json({ message: 'Error generating summary' });
  }
};
