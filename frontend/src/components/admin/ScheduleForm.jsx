import React, { useState, useEffect } from 'react';
import ClockTimePicker from './ClockTimePicker';

const ScheduleForm = ({ doctors, initialData, selectedDoctor, selectedDate, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    doctor_id: selectedDoctor || '',
    doctor_name: '',
    date: selectedDate || '',
    start_time: '',
    end_time: '',
    status: 'Available',
    reason: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Set doctor name when doctor_id changes
      const doctor = doctors.find(d => d.id === formData.doctor_id);
      if (doctor) {
        setFormData(prev => ({ ...prev, doctor_name: doctor.name }));
      }
    }
  }, [initialData, formData.doctor_id, doctors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update doctor_name when doctor_id changes
    if (name === 'doctor_id') {
      const doctor = doctors.find(d => d.id === value);
      if (doctor) {
        setFormData(prev => ({ ...prev, doctor_name: doctor.name }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.doctor_id || !formData.date || !formData.start_time || !formData.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate time range
    if (formData.start_time >= formData.end_time) {
      alert('End time must be after start time');
      return;
    }

    onSubmit(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'Busy':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'Blocked':
        return 'bg-gray-200 border-gray-400 text-gray-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {initialData ? 'Edit Schedule' : 'Add New Schedule'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {initialData ? 'Update schedule details' : 'Create a new time slot'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="hover:bg-white/20 rounded-xl p-2 transition-all"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Doctor Selection with Icon */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 bg-white text-gray-900 text-lg font-medium"
            >
              <option value="" className="text-gray-500">-- Select Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id} className="text-gray-900">
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date with Icon */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 bg-white text-gray-900 text-lg font-medium"
            />
          </div>

          {/* Time Range with Clock Widgets */}
          <div className="grid grid-cols-2 gap-6">
            <ClockTimePicker
              value={formData.start_time}
              onChange={handleChange}
              label="Start Time"
              type="start"
            />

            <ClockTimePicker
              value={formData.end_time}
              onChange={handleChange}
              label="End Time"
              type="end"
            />
          </div>

          {/* Enhanced Status Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['Available', 'Busy', 'Blocked'].map((status) => (
                <label
                  key={status}
                  className={`flex flex-col items-center justify-center p-5 border-3 rounded-2xl cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg ${
                    formData.status === status
                      ? getStatusColor(status) + ' shadow-lg scale-105'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-3xl mb-2">
                    {status === 'Available' ? '✓' : status === 'Busy' ? '⏱' : '🚫'}
                  </span>
                  <span className="font-bold text-lg">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reason with Icon */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reason (Optional)
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., Surgery, Break, Meeting"
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 bg-white text-gray-900 text-lg placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add a reason for Busy or Blocked status
            </p>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initialData ? 'Update Schedule' : 'Add Schedule'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm;
