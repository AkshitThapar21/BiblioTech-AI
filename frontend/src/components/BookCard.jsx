import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Trash2, Edit2 } from 'lucide-react';
import axios from '../api/axios';

const BookCard = ({ book, onDelete }) => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(book.aiSummary);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!!book.aiSummary);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/books/summarize', {
        bookTitle: book.title,
        author: book.author
      });
      setSummary(res.data.summary);
      setExpanded(true);
      // We don't save back to DB in this flow, but could be added if needed
    } catch (err) {
      console.error(err);
      alert('Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{book.title}</h3>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <button onClick={() => onDelete(book._id)} className="text-red-500 hover:text-red-700 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
        <p className="text-gray-600 font-medium mb-1">By {book.author}</p>
        
        <div className="flex gap-2 mb-4 mt-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {book.genre}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${book.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Stock: {book.stock}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">ISBN: {book.isbn}</p>
      </div>

      <div className="mt-auto">
        <button 
          onClick={generateSummary}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 shadow-md"
        >
          <Sparkles size={18} />
          {loading ? 'Generating...' : 'Generate AI Summary'}
        </button>

        {expanded && summary && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed italic relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-lg"></div>
            {summary}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
