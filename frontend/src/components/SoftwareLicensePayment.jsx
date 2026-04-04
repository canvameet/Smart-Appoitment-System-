import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaLock, FaCheckCircle, FaRupeeSign } from 'react-icons/fa';

const API = 'http://localhost:5000';
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const LICENSE_AMOUNT = 199; // ₹199 for software license

const SoftwareLicensePayment = ({ onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already paid
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API}/license/check/${user.uid}`);
      if (response.data.success && response.data.isPaid) {
        // User already paid, allow access
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await axios.post(`${API}/license/create-order`, {
        user_id: user.uid,
        user_email: user.email,
        amount: LICENSE_AMOUNT
      });

      if (!orderResponse.data.success) {
        toast.error('Failed to create payment order');
        setLoading(false);
        return;
      }

      const { order_id, amount, currency } = orderResponse.data;

      // Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: amount,
        currency: currency,
        name: 'Smart Hospital System',
        description: 'Software License Fee',
        order_id: order_id,
        handler: async (response) => {
          // Payment successful, verify on backend
          try {
            const verifyResponse = await axios.post(`${API}/license/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: user.uid
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Welcome to Smart Hospital System');
              onPaymentSuccess();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
          contact: user.phoneNumber || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Verifying license...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Payment Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-4xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Software License</h1>
            <p className="text-blue-100">One-time payment to unlock full access</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Price Display */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl px-8 py-6 border-2 border-green-200">
                <FaRupeeSign className="text-5xl text-green-600 mr-2" />
                <span className="text-6xl font-black text-green-700">{LICENSE_AMOUNT}</span>
              </div>
              <p className="text-gray-500 mt-4 font-medium">One-time payment • Lifetime access</p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-gray-900 text-lg mb-4">What's Included:</h3>
              {[
                'Full Admin Dashboard Access',
                'AI-Powered Patient Triage',
                'Dynamic Queue Management',
                'Doctor Scheduling System',
                'Payment Management',
                'Analytics & Reports',
                'WhatsApp Notifications',
                'Lifetime Updates'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <FaCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaRupeeSign className="text-xl" />
                  Pay ₹{LICENSE_AMOUNT} Now
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                <FaLock className="text-green-600" />
                Secured by Razorpay • 100% Safe & Secure
              </p>
            </div>
          </div>
        </div>

        {/* Support Text */}
        <p className="text-center mt-6 text-gray-600 text-sm">
          Need help? Contact support at{' '}
          <a href="mailto:support@smarthospital.com" className="text-blue-600 font-semibold hover:underline">
            support@smarthospital.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default SoftwareLicensePayment;
