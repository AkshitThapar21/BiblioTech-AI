const Book = require('../models/Book');
const { GoogleGenAI } = require('@google/genai');

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addBook = async (req, res) => {
  try {
    const { title, author, genre, isbn, stock } = req.body;
    
    let book = new Book({
      title, author, genre, isbn, stock
    });

    await book.save();
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { title, author, genre, isbn, stock } = req.body;
    let book = await Book.findById(req.params.id);

    if (!book) return res.status(404).json({ message: 'Book not found' });

    book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { title, author, genre, isbn, stock } },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.summarizeBook = async (req, res) => {
  try {
    const { bookTitle, author } = req.body;
    if (!bookTitle || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Write a structured 3-sentence summary of the book "${bookTitle}" by ${author}. Do not include any extra text.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const summary = response.text;
    res.json({ summary });
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ message: 'Error generating summary' });
  }
};
