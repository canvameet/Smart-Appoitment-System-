import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import axios from 'axios';
import AdminDashboard from '../components/AdminDashboard';
import SoftwareLicensePayment from '../components/SoftwareLicensePayment';

const API = 'http://localhost:5000';

const AdminDashboardWrapper = () => {
  const [hasLicense, setHasLicense] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has paid for license
      const response = await axios.get(`${API}/license/check/${user.uid}`);
      
      if (response.data.success && response.data.isPaid) {
        setHasLicense(true);
      } else {
        setHasLicense(false);
      }
    } catch (error) {
      console.error('License check failed:', error);
      setHasLicense(false);
    } finally {
      setChecking(false);
    }
  };

  const handlePaymentSuccess = () => {
    setHasLicense(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasLicense) {
    return <SoftwareLicensePayment onPaymentSuccess={handlePaymentSuccess} />;
  }

  return <AdminDashboard />;
};

export default AdminDashboardWrapper;
