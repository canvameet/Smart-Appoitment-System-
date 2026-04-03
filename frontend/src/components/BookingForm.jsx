import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCalendarDay, FaUserMd, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const BookingForm = ({ onNewAppointment }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
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

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/doctors');
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

  // Fetch dynamic slots when doctor or date changes
  useEffect(() => {
    if (!formData.doctor_id || !formData.date) return;
    
    const fetchSlots = async () => {
      setFetchingSlots(true);
      try {
        const resp = await axios.post('http://localhost:5000/available-slots', {
          doctor_id: formData.doctor_id,
          date: formData.date
        });
        if (resp.data.success) {
          setSlots(resp.data.slots);
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
    if (!formData.name || !formData.age || !formData.symptoms || !formData.time_slot) {
      toast.error("Please fill all required fields and select a specific time slot!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/smart-book', formData);
      if (response.data.success) {
        toast.success("Appointment Scheduled Successfully!");
        onNewAppointment(response.data.appointment);
        setFormData(prev => ({ ...prev, name: '', age: '', symptoms: '', time_slot: '' }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to book appointment");
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

        {/* Dynamic Slots UI */}
        <div>
           <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FaClock className="mr-2 text-blue-600"/> Available Dynamic Slots
           </label>
           {fetchingSlots ? (
             <div className="text-sm text-gray-500 flex items-center p-3"><FaSpinner className="animate-spin mr-2" /> Calculating availability via AI queue...</div>
           ) : slots.length > 0 ? (
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({...formData, time_slot: slot})}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
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
             <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                No slots available on this date for the selected doctor.
             </div>
           )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
             <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    value={formData.visit_type} onChange={(e) => setFormData({...formData, visit_type: parseInt(e.target.value)})}>
              <option value={0}>First Visit (New)</option>
              <option value={1}>Follow-up</option>
            </select>
          </div>
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
