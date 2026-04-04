import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiUserPlus, FiActivity, FiPhone } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user' // Default role
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password, phone, role } = formData;

    if (!name || !email || !password || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate phone number for doctors (required for emergency alerts)
    if (role === 'doctor' && !phone) {
      toast.error('Phone number is required for doctors (for emergency WhatsApp alerts)');
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phone: phone || '',
        role,
        createdAt: new Date().toISOString()
      });

      toast.success('Account created successfully!');
      
      // 3. Redirect based on role
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'doctor') navigate('/doctor-dashboard');
      else navigate('/user-dashboard');

    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email is already registered');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      
      {/* Left Side: Branding (Hidden on mobile, 75% width on large screens) */}
      <div className="hidden md:flex md:w-2/3 lg:w-[75%] bg-blue-600 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 relative justify-center items-center p-12 overflow-hidden group/brand">
        {/* Decorative Background Elements */}
        {/* Main Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 mix-blend-screen transition-opacity duration-1000 group-hover/brand:opacity-70">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        </div>

        {/* Floating Medical Crosses */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[20%] left-[15%] opacity-20 animate-bounce" style={{ animationDuration: '6s' }}>
            <div className="w-12 h-12 relative flex items-center justify-center transform rotate-12 group-hover/brand:rotate-45 transition-transform duration-1000">
              <div className="w-3 h-12 bg-white rounded-full absolute"></div>
              <div className="w-12 h-3 bg-white rounded-full absolute"></div>
            </div>
          </div>
          <div className="absolute bottom-[25%] right-[20%] opacity-20 animate-bounce" style={{ animationDuration: '7s', animationDelay: '1.5s' }}>
            <div className="w-16 h-16 relative flex items-center justify-center transform -rotate-12 group-hover/brand:-rotate-45 transition-transform duration-1000">
              <div className="w-4 h-16 bg-white rounded-full absolute"></div>
              <div className="w-16 h-4 bg-white rounded-full absolute"></div>
            </div>
          </div>
          <div className="absolute top-[40%] right-[10%] opacity-30 animate-pulse" style={{ animationDuration: '4s' }}>
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <div className="absolute bottom-[15%] left-[25%] opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}>
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Brand Content */}
        <div className="relative z-10 text-center animate-fadeIn max-w-4xl" style={{ animationDuration: '1s' }}>
          <div className="inline-flex justify-center items-center w-28 h-28 rounded-[2.5rem] bg-white/10 backdrop-blur-xl mb-10 shadow-2xl border border-white/20 transform transition-all hover:scale-110 hover:rotate-6 hover:shadow-blue-500/50 hover:bg-white/20 duration-500 cursor-default">
            <FiActivity className="h-14 w-14 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.1] font-extrabold tracking-tight mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-blue-200 drop-shadow-sm">
              SmaHosp
            </span>
          </h1>
          <p className="text-xl lg:text-2xl font-light text-blue-100/90 mx-auto leading-relaxed max-w-2xl transform transition-all duration-700 hover:-translate-y-1">
            Pioneering the future of healthcare management with seamless, intelligent, and secure appointments.
          </p>
        </div>
      </div>

      {/* Right Side: Signup Form (100% on mobile, 25% width on large screens) */}
      <div className="w-full md:w-1/3 lg:w-[25%] flex flex-col justify-center py-6 px-4 sm:px-8 relative z-20 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.1)] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40">
        
        {/* Soft decorative blur to give the glass something to distort */}
        <div className="absolute top-[20%] right-[-10%] w-[120%] h-[60%] bg-blue-300/10 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto flex flex-col h-full justify-center relative z-10">
          
          {/* THE GLASS CARD */}
          <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
            
            <div className="text-center md:text-left mb-10 animate-slideIn" style={{ animationDelay: '0s', animationFillMode: 'both' }}>
              {/* Mobile Only Logo */}
              <div className="md:hidden flex justify-center text-blue-600 mb-8">
                <div className="p-4 bg-white/80 rounded-[1.5rem] shadow-sm border border-white/50">
                  <FiActivity className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight relative inline-block">
                Register
                <div className="absolute -bottom-2 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-blue-600 rounded-full"></div>
              </h2>
              <p className="mt-6 text-sm text-gray-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline underline-offset-4 font-bold">
                  Sign in
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSignup}>
              
              {/* Name Field */}
              <div className="animate-slideIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <div className="group/name relative">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within/name:text-blue-600 mb-1.5 ml-1">
                    Full Name
                  </label>
                  <div className="relative rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group-focus-within/name:shadow-lg group-focus-within/name:shadow-blue-500/20 group-focus-within/name:-translate-y-0.5">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400 group-focus-within/name:text-blue-500 transition-colors duration-300 group-hover/name:scale-110" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-11 py-3 border-2 border-white/80 focus:border-blue-500 text-sm bg-white/50 focus:bg-white transition-all duration-300 outline-none hover:border-blue-200 focus:ring-4 focus:ring-blue-500/20 rounded-2xl backdrop-blur-md"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="animate-slideIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <div className="group/email relative">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within/email:text-blue-600 mb-1.5 ml-1">
                    Email address
                  </label>
                  <div className="relative rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group-focus-within/email:shadow-lg group-focus-within/email:shadow-blue-500/20 group-focus-within/email:-translate-y-0.5">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400 group-focus-within/email:text-blue-500 transition-colors duration-300 group-hover/email:scale-110" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-11 py-3 border-2 border-white/80 focus:border-blue-500 text-sm bg-white/50 focus:bg-white transition-all duration-300 outline-none hover:border-blue-200 focus:ring-4 focus:ring-blue-500/20 rounded-2xl backdrop-blur-md"
                      placeholder="admin@hospital.com"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Field */}
              <div className="animate-slideIn" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <div className="group/phone relative">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within/phone:text-blue-600 mb-1.5 ml-1">
                    Phone Number {formData.role === 'doctor' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group-focus-within/phone:shadow-lg group-focus-within/phone:shadow-blue-500/20 group-focus-within/phone:-translate-y-0.5">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400 group-focus-within/phone:text-blue-500 transition-colors duration-300 group-hover/phone:scale-110" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-11 py-3 border-2 border-white/80 focus:border-blue-500 text-sm bg-white/50 focus:bg-white transition-all duration-300 outline-none hover:border-blue-200 focus:ring-4 focus:ring-blue-500/20 rounded-2xl backdrop-blur-md"
                      placeholder="+919876543210"
                    />
                  </div>
                  {formData.role === 'doctor' && (
                    <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">💬 WhatsApp required for emergency alerts</p>
                  )}
                  {formData.role === 'user' && (
                    <p className="mt-1.5 ml-1 text-xs text-gray-500">💬 Optional - for appointment updates</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="animate-slideIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <div className="group/password relative">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within/password:text-blue-600 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group-focus-within/password:shadow-lg group-focus-within/password:shadow-blue-500/20 group-focus-within/password:-translate-y-0.5">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400 group-focus-within/password:text-blue-500 transition-colors duration-300 group-hover/password:scale-110" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-11 py-3 border-2 border-white/80 focus:border-blue-500 text-sm bg-white/50 focus:bg-white transition-all duration-300 outline-none hover:border-blue-200 focus:ring-4 focus:ring-blue-500/20 rounded-2xl backdrop-blur-md"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Role Field */}
              <div className="animate-slideIn" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <div className="group/role relative">
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within/role:text-blue-600 mb-1.5 ml-1">
                    Role
                  </label>
                  <div className="relative rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group-focus-within/role:shadow-lg group-focus-within/role:shadow-blue-500/20 group-focus-within/role:-translate-y-0.5">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="block w-full pl-4 pr-10 py-3 border-2 border-white/80 focus:border-blue-500 text-sm bg-white/50 focus:bg-white transition-all duration-300 outline-none hover:border-blue-200 focus:ring-4 focus:ring-blue-500/20 rounded-2xl backdrop-blur-md appearance-none cursor-pointer font-medium text-gray-700"
                    >
                      <option value="user">Patient / User</option>
                      <option value="doctor">Medical Doctor</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                       <svg className="h-5 w-5 text-gray-400 group-focus-within/role:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 animate-scaleIn" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-xl shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 focus:outline-none focus:ring-4 focus:ring-offset-0 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden transform hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                  
                  {loading ? (
                    <span className="flex items-center gap-3 relative z-10">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 relative z-10">
                      <FiUserPlus className="h-5 w-5 transition-transform duration-500 group-hover:scale-110" />
                      Complete Registration
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Signup;
