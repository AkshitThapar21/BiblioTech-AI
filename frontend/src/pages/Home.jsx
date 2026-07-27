import React from 'react';
import Navbar from '../components/Navbar';
import BookCatalog from '../components/BookCatalog';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 md:p-10">
        <BookCatalog />
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
        <p>&copy; 2026 BiblioTech AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
