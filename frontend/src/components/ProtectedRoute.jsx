import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import Navbar from './Navbar';
import { FiLoader } from 'react-icons/fi';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <FiLoader className="h-10 w-10 animate-spin" />
          <p className="font-medium text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their appropriate dashboard if they try to access an unauthorized route
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={userRole} userId={user?.uid} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {React.cloneElement(children, { user, userRole })}
      </main>
    </div>
  );
};

export default ProtectedRoute;
