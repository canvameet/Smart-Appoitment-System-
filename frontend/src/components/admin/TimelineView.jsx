import React from 'react';

const TimelineView = ({ schedules, loading, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-blue-50 border-blue-300 text-blue-900';
      case 'Busy':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'Blocked':
        return 'bg-gray-100 border-gray-400 text-gray-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available':
        return '✓';
      case 'Busy':
        return '⏱';
      case 'Blocked':
        return '🚫';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-16 rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 font-semibold mt-4">Loading schedules...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-16 rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Schedules Found</h3>
          <p className="text-gray-500 mb-6">This doctor doesn't have any schedules for the selected date</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Schedule Timeline
          </h3>
          <p className="text-gray-500 text-sm mt-1">View and manage time slots</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-700 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-700 font-medium">Busy</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span className="text-gray-700 font-medium">Blocked</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule, index) => (
          <div
            key={schedule.id}
            className={`border-2 rounded-2xl p-6 transition-all hover:shadow-lg transform hover:-translate-y-1 ${getStatusColor(schedule.status)} animate-slideIn`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                {/* Time with Icon */}
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-50 p-3 rounded-xl">
                    <span className="text-3xl">{getStatusIcon(schedule.status)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-2xl text-gray-900">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                    <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {calculateDuration(schedule.start_time, schedule.end_time)}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-1">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                    {schedule.status}
                  </span>
                  {schedule.reason && (
                    <p className="text-sm mt-2 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {schedule.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onEdit(schedule)}
                  className="p-3 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 group"
                  title="Edit Schedule"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(schedule.id)}
                  className="p-3 bg-white hover:bg-red-50 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 group"
                  title="Delete Schedule"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Summary with Cards */}
      <div className="mt-8 pt-8 border-t-2 border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Schedule Summary
        </h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Available</span>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-black text-blue-700">
              {schedules.filter(s => s.status === 'Available').length}
            </p>
            <p className="text-sm text-blue-600 mt-1 font-medium">Open Slots</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-600 font-semibold text-sm uppercase tracking-wide">Busy</span>
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-black text-red-700">
              {schedules.filter(s => s.status === 'Busy').length}
            </p>
            <p className="text-sm text-red-600 mt-1 font-medium">Occupied</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold text-sm uppercase tracking-wide">Blocked</span>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="text-4xl font-black text-gray-700">
              {schedules.filter(s => s.status === 'Blocked').length}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Unavailable</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const duration = endMinutes - startMinutes;
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

export default TimelineView;
