import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCalendarDay, FaUserMd, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import { auth } from '../firebase/firebase';

const BookingForm = ({ onNewAppointment }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    visit_type: 0,
    symptoms: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    time_slot: ''
  });
  
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(null);

  // Get current user
  const currentUser = auth.currentUser;

  // Fetch doctors on mount - from Firestore (role='doctor')
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/doctors/list');
        if (resp.data.success) {
          setDoctors(resp.data.doctors);
          if (resp.data.doctors.length > 0) {
            setFormData(prev => ({ ...prev, doctor_id: resp.data.doctors[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load doctors", err);
      }
    };
    fetchDoctors();
  }, []);

  // Check daily appointment limit when date changes
  useEffect(() => {
    const checkDailyLimit = async () => {
      if (!currentUser || !formData.date) return;
      
      try {
        const resp = await axios.post('http://localhost:5000/appointments/check-limit', {
          userId: currentUser.uid,
          date: formData.date
        });
        
        if (resp.data.success) {
          setDailyLimit(resp.data);
        }
      } catch (err) {
        console.error("Failed to check daily limit", err);
      }
    };
    
    checkDailyLimit();
  }, [formData.date, currentUser]);

  // Fetch dynamic slots when doctor or date changes
  useEffect(() => {
    if (!formData.doctor_id || !formData.date) return;
    
    const fetchSlots = async () => {
      setFetchingSlots(true);
      try {
        // Fetch available slots
        const resp = await axios.post('http://localhost:5000/available-slots', {
          doctor_id: formData.doctor_id,
          date: formData.date
        });
        if (resp.data.success) {
          setSlots(resp.data.slots);
        }
        
        // Fetch doctor availability status
        const statusResp = await axios.get(
          `http://localhost:5000/doctor/schedule/status/${formData.doctor_id}?date=${formData.date}`
        );
        if (statusResp.data.success) {
          setDoctorAvailability(statusResp.data);
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [formData.doctor_id, formData.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please login to book an appointment");
      return;
    }
    
    if (!formData.name || !formData.age || !formData.gender || !formData.symptoms || !formData.time_slot) {
      toast.error("Please fill all required fields including gender and select a specific time slot!");
      return;
    }

    // Check daily limit
    if (dailyLimit && !dailyLimit.canBook) {
      toast.error(dailyLimit.message);
      return;
    }

    setLoading(true);
    try {
      // First run AI triage
      const triageResp = await axios.post('http://localhost:5000/ai-triage', {
        symptoms: formData.symptoms
      });
      
      const triage = triageResp.data.triage;
      
      // Create appointment in Firebase
      const appointmentData = {
        userId: currentUser.uid,
        doctorId: formData.doctor_id,
        date: formData.date,
        timeSlot: formData.time_slot,
        isEmergency: triage.is_emergency || false,
        patientName: formData.name,
        patientAge: parseInt(formData.age),
        patientGender: formData.gender,
        patientPhone: formData.phone,
        patientEmail: currentUser.email || '',  // Get email from Firebase Auth
        symptoms: formData.symptoms,
        triage: triage,
        status: 'pending'
      };
      
      const response = await axios.post('http://localhost:5000/appointments/create', appointmentData);
      
      if (response.data.success) {
        const whatsappSent = response.data.appointment.whatsapp_sent;
        toast.success(
          <div>
            <div className="font-bold">Appointment Booked!</div>
            {whatsappSent && formData.phone && (
              <div className="text-sm mt-1">💬 WhatsApp confirmation sent</div>
            )}
            {triage.is_emergency && (
              <div className="text-sm mt-1 text-red-600">🚨 Emergency - Doctor alerted</div>
            )}
          </div>,
          { duration: 5000 }
        );
        
        if (onNewAppointment) {
          onNewAppointment(response.data.appointment);
        }
        
        setFormData(prev => ({ ...prev, name: '', age: '', gender: '', phone: '', symptoms: '', time_slot: '' }));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to book appointment";
      
      if (error.response?.status === 429) {
        toast.error(
          <div>
            <div className="font-bold">Daily Limit Reached</div>
            <div className="text-sm">{errorMsg}</div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Smart Booking (Dynamic Slots)</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Doctor & Date Selection */}
        <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
               <FaUserMd className="mr-2 text-blue-600"/> Select Doctor
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.doctor_id}
              onChange={(e) => setFormData({...formData, doctor_id: e.target.value, time_slot: ''})}
            >
              {doctors.map(doc => (
                 <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
               <FaCalendarDay className="mr-2 text-blue-600"/> Select Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value, time_slot: ''})}
            />
          </div>
        </div>

        {/* Daily Limit Indicator */}
        {dailyLimit && (
          <div className={`p-3 rounded-lg border ${
            dailyLimit.canBook 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {dailyLimit.canBook ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {dailyLimit.message}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {dailyLimit.message}
                </>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Slots UI */}
        <div>
           <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FaClock className="mr-2 text-blue-600"/> Available Time Slots (10:00 AM - 11:59 PM)
           </label>
           
           {/* Doctor Availability Status */}
           {doctorAvailability && (
             <div className={`mb-3 p-3 rounded-lg border ${
               doctorAvailability.has_availability 
                 ? 'bg-green-50 border-green-200 text-green-800' 
                 : 'bg-red-50 border-red-200 text-red-800'
             }`}>
               <div className="flex items-center gap-2 text-sm font-semibold">
                 {doctorAvailability.has_availability ? (
                   <>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Doctor Available - {doctorAvailability.available_slots} slot{doctorAvailability.available_slots !== 1 ? 's' : ''} open
                   </>
                 ) : (
                   <>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Doctor Unavailable - No available slots on this date
                   </>
                 )}
               </div>
             </div>
           )}
           
           {fetchingSlots ? (
             <div className="text-sm text-gray-500 flex items-center p-3"><FaSpinner className="animate-spin mr-2" /> Loading available slots...</div>
           ) : slots.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-100 rounded-lg">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({...formData, time_slot: slot})}
                    className={`py-3 px-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all ${
                      formData.time_slot === slot 
                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
             </div>
           ) : (
             <div className="text-sm text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-semibold">No Available Slots</div>
                  <div className="text-xs mt-1">Doctor is not available on this date. Please select a different date or doctor.</div>
                </div>
             </div>
           )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
             <input 
               type="number" 
               required
               min="1"
               max="120"
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               value={formData.age} 
               onChange={(e) => setFormData({...formData, age: e.target.value})} 
               placeholder="25"
             />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (WhatsApp)</label>
            <input 
              type="tel" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+919876543210"
            />
          </div>
        </div>
        
        {formData.phone && (
          <p className="text-xs text-gray-500 -mt-3 ml-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            You'll receive appointment confirmation on WhatsApp
          </p>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  value={formData.visit_type} onChange={(e) => setFormData({...formData, visit_type: parseInt(e.target.value)})}>
            <option value={0}>First Visit (New)</option>
            <option value={1}>Follow-up</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (Natural Language)</label>
          <textarea
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            value={formData.symptoms}
            onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
            placeholder="Describe how you are feeling..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.time_slot}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><FaSpinner className="animate-spin" /><span>Booking...</span></>
          ) : (
            <span>Diagnose & Book Appointment</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
