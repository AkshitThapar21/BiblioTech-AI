import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 text-xl font-bold">
        <BookOpen size={28} />
        <span>BiblioTech AI</span>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-blue-700 px-3 py-1 rounded-full">
              {user.role.toUpperCase()}
            </span>
            <span className="font-semibold">{user.username}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        ) : (
          <span className="text-sm font-medium">Please Login</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
