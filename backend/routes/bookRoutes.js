const express = require('express');
const router = express.Router();
const { getBooks, addBook, updateBook, deleteBook, summarizeBook } = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET api/books
// @desc    Get all books (Public or authenticated user)
router.get('/', getBooks);

// @route   POST api/books/summarize
// @desc    Summarize a book using AI (Authenticated users)
router.post('/summarize', authMiddleware, summarizeBook);

// @route   POST api/books
// @desc    Add new book (Admin only)
router.post('/', [authMiddleware, adminMiddleware], addBook);

// @route   PUT api/books/:id
// @desc    Update a book (Admin only)
router.put('/:id', [authMiddleware, adminMiddleware], updateBook);

// @route   DELETE api/books/:id
// @desc    Delete a book (Admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], deleteBook);

module.exports = router;
