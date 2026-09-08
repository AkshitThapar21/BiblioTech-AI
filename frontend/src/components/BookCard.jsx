import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Trash2, Eye, EyeOff, RotateCw } from 'lucide-react';
import axios from '../api/axios';

const BookCard = ({ book, onDelete }) => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(book.aiSummary || null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/books/summarize', {
        bookTitle: book.title,
        author: book.author
      });
      setSummary(res.data.summary);
      setExpanded(true);
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
              <button onClick={() => onDelete(book._id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer">
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

      <div className="mt-auto pt-3 border-t border-gray-100">
        {!summary ? (
          <button 
            onClick={generateSummary}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 shadow-md cursor-pointer"
          >
            <Sparkles size={18} />
            {loading ? 'Generating...' : 'Generate AI Summary'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                expanded
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {expanded ? (
                <>
                  <EyeOff size={16} />
                  <span>Hide Summary</span>
                </>
              ) : (
                <>
                  <Eye size={16} />
                  <span>View Summary</span>
                </>
              )}
            </button>
            <button
              onClick={generateSummary}
              disabled={loading}
              title="Regenerate with AI"
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {expanded && summary && (
          <div className="mt-3 p-3.5 bg-blue-50/80 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-lg"></div>
            <div className="flex justify-between items-center mb-1.5 not-italic">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" /> AI Summary
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                title="Hide summary"
              >
                <EyeOff size={13} />
                <span>Hide</span>
              </button>
            </div>
            <p className="italic text-gray-800 text-xs sm:text-sm">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
