const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, min: 0 },
  aiSummary: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
