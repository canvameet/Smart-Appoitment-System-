import React, { useState, useEffect } from 'react';
import ScheduleForm from './ScheduleForm';
import TimelineView from './TimelineView';
import { toast } from 'react-hot-toast';

const DoctorScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

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
        console.log(`✅ Admin: Loaded ${data.doctors.length} doctors from Firebase`);
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
      fetchSchedules();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/doctor/schedule/${selectedDoctor}?date=${selectedDate}`
      );
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (scheduleData) => {
    try {
      const response = await fetch('http://localhost:5000/doctor/schedule/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Schedule added successfully');
        setShowForm(false);
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to add schedule');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  };

  const handleUpdateSchedule = async (scheduleId, scheduleData) => {
    try {
      const response = await fetch(`http://localhost:5000/doctor/schedule/update/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Schedule updated successfully');
        setEditingSchedule(null);
        setShowForm(false);
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/doctor/schedule/delete/${scheduleId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Schedule deleted successfully');
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-xl border border-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Doctor Scheduling</h2>
              <p className="text-blue-100 mt-1">Manage doctor availability and time slots</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setShowForm(true);
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      {/* Enhanced Filters with Icons */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">Filter Schedules</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Select Doctor
            </label>
            {loadingDoctors ? (
              <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-500 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading doctors...
              </div>
            ) : (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 bg-white text-gray-900 font-medium"
              >
                <option value="" className="text-gray-500">-- Select Doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id} className="text-gray-900">
                    {doc.name} - {doc.specialty || 'General'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-400 bg-white text-gray-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <ScheduleForm
          doctors={doctors}
          initialData={editingSchedule}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          onSubmit={editingSchedule ? 
            (data) => handleUpdateSchedule(editingSchedule.id, data) : 
            handleAddSchedule
          }
          onCancel={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
        />
      )}

      {/* Timeline View */}
      {selectedDoctor && selectedDate && (
        <TimelineView
          schedules={schedules}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteSchedule}
        />
      )}

      {!selectedDoctor && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-16 rounded-2xl shadow-lg border-2 border-dashed border-blue-300 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-6">Select a doctor and date above to view and manage their schedule</p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="font-semibold">Use the filters above</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorScheduling;
