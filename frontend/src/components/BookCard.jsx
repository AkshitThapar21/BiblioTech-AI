import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Trash2, Eye, EyeOff, RotateCw, Edit2, Check, X, Plus, Minus } from 'lucide-react';
import axios from '../api/axios';

const BookCard = ({ book, onDelete, onUpdateStock }) => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(book.aiSummary || null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Stock editing states
  const [stock, setStock] = useState(book.stock);
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [stockInput, setStockInput] = useState(book.stock);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    setStock(book.stock);
    setStockInput(book.stock);
  }, [book.stock]);

  const handleUpdateStock = async (newStockVal) => {
    const parsed = parseInt(newStockVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('Stock must be a non-negative number');
      return;
    }
    setStockLoading(true);
    try {
      const res = await axios.put(`/books/${book._id || book.id}`, { stock: parsed });
      setStock(res.data.stock);
      setStockInput(res.data.stock);
      setIsEditingStock(false);
      if (onUpdateStock) {
        onUpdateStock(res.data);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      alert(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setStockLoading(false);
    }
  };

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
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsEditingStock(!isEditingStock)} 
                title={isEditingStock ? 'Cancel editing' : 'Modify stock'}
                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Edit2 size={17} />
              </button>
              <button 
                onClick={() => onDelete(book._id || book.id)} 
                title="Delete book"
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </div>
        <p className="text-gray-600 font-medium mb-1">By {book.author}</p>
        
        <div className="flex flex-wrap items-center gap-2 mb-4 mt-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded">
            {book.genre}
          </span>
          
          {user?.role === 'admin' && isEditingStock ? (
            <div className="flex items-center gap-1 bg-blue-50/80 p-1 rounded-lg border border-blue-200">
              <span className="text-xs font-semibold text-blue-900 pl-1">Stock:</span>
              <input
                type="number"
                min="0"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateStock(stockInput);
                  if (e.key === 'Escape') {
                    setIsEditingStock(false);
                    setStockInput(stock);
                  }
                }}
                disabled={stockLoading}
                className="w-14 px-1 py-0.5 text-xs font-medium border border-blue-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                autoFocus
              />
              <button
                onClick={() => handleUpdateStock(stockInput)}
                disabled={stockLoading}
                className="p-1 rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
                title="Save stock"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => {
                  setIsEditingStock(false);
                  setStockInput(stock);
                }}
                disabled={stockLoading}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Stock: {stock}
              </span>
              {user?.role === 'admin' && (
                <div className="flex items-center gap-0.5 bg-gray-100/80 border border-gray-200 rounded px-1 py-0.5">
                  <button
                    onClick={() => handleUpdateStock(stock - 1)}
                    disabled={stock <= 0 || stockLoading}
                    className="p-0.5 rounded hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Quick decrease stock (-1)"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => handleUpdateStock(stock + 1)}
                    disabled={stockLoading}
                    className="p-0.5 rounded hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Quick increase stock (+1)"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
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
