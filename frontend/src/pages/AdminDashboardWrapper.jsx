import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import axios from 'axios';
import AdminDashboard from '../components/AdminDashboard';
import SoftwareLicensePayment from '../components/SoftwareLicensePayment';
import LoadingScreen from '../components/LoadingScreen';

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
    return <LoadingScreen message="Verifying license..." />;
  }

  if (!hasLicense) {
    return <SoftwareLicensePayment onPaymentSuccess={handlePaymentSuccess} />;
  }

  return <AdminDashboard />;
};

export default AdminDashboardWrapper;
