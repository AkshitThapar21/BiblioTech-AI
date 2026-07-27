import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { BookOpen } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await axios.post(endpoint, { username, password });
      
      login(res.data.token, res.data.role, res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <BookOpen size={40} className="text-blue-600" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            BiblioTech AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        
        {!isRegister && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 mb-2">Demo Credentials:</p>
            <div className="flex justify-center gap-4 text-xs font-mono text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded">admin / admin123</span>
              <span className="bg-gray-100 px-2 py-1 rounded">testuser / user123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
