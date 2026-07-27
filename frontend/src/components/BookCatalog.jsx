import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import BookCard from './BookCard';
import AddBookModal from './AddBookModal';
import { AuthContext } from '../context/AuthContext';
import { Plus } from 'lucide-react';

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchBooks = async () => {
    try {
      const res = await axios.get('/books');
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBookAdded = (newBook) => {
    setBooks([newBook, ...books]);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`/books/${id}`);
        setBooks(books.filter(b => b._id !== id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete book');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Book Catalog</h1>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add New Book
          </button>
        )}
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No books found in the catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map(book => (
            <BookCard key={book._id} book={book} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onBookAdded={handleBookAdded} 
      />
    </div>
  );
};

export default BookCatalog;
