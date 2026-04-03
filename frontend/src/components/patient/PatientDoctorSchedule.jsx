import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PatientDoctorSchedule = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [doctorStatus, setDoctorStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch doctors from Firebase on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await fetch('http://localhost:5000/doctors/list');
      const data = await response.json();
      
      if (data.success) {
        setDoctors(data.doctors);
        console.log(`✅ Loaded ${data.doctors.length} doctors from Firebase`);
      } else {
        toast.error('Failed to load doctors');
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
      fetchDoctorStatus();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/doctor/available-slots/${selectedDoctor}?date=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.available_slots);
      } else {
        toast.error('Failed to load available slots');
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/doctor/schedule/status/${selectedDoctor}?date=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setDoctorStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch doctor status:', error);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    // In production, this would integrate with booking system
    toast.success(`Selected slot: ${slot.start_time} - ${slot.end_time}`);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Doctor Availability</h2>
        <p className="text-gray-500 mt-1">View available appointment slots</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor
            </label>
            {loadingDoctors ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading doctors...
              </div>
            ) : (
              <select
                value={selectedDoctor}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialty || 'General'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              min={getMinDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Doctor Status */}
      {doctorStatus && selectedDoctor && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Availability Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              {doctorStatus.has_availability ? (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Available</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Not Available</span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {doctorStatus.available_slots} slot{doctorStatus.available_slots !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available Slots */}
      {selectedDoctor && selectedDate && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading available slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                    selectedSlot?.id === slot.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-blue-200 text-blue-700 hover:border-blue-400'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-lg">
                      {formatTime(slot.start_time)}
                    </p>
                    <p className="text-sm opacity-75">
                      to {formatTime(slot.end_time)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Available Slots</h4>
              <p className="text-gray-500">
                Doctor is not available on this date. Please select a different date.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Selected Appointment Slot</h4>
              <div className="space-y-1 text-blue-800">
                <p><strong>Doctor:</strong> {doctors.find(d => d.id === selectedDoctor)?.name}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            ℹ️ This slot is available. To book an appointment, please use the booking form.
          </p>
        </div>
      )}

      {!selectedDoctor && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Doctor</h3>
          <p className="text-gray-500">Choose a doctor and date to view available appointment slots</p>
        </div>
      )}
    </div>
  );
};

export default PatientDoctorSchedule;
