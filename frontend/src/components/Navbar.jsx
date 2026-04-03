import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiLogOut, FiActivity } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

const Navbar = ({ userRole, userId }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-blue-600 gap-2">
              <FiActivity className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight text-gray-900">Medi<span className="text-blue-600">Care</span> System</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {userRole && (
              <span className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">
                {userRole}
              </span>
            )}
            <NotificationBell userId={userId || userRole || 'user'} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-md text-sm font-medium"
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
