import React, { useState, useEffect } from 'react';

const ClockTimePicker = ({ value, onChange, label, type = 'start' }) => {
  const [showClock, setShowClock] = useState(false);
  const [hours, setHours] = useState('09');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const per = hour24 >= 12 ? 'PM' : 'AM';
      
      setHours(hour12.toString().padStart(2, '0'));
      setMinutes(m);
      setPeriod(per);
    }
  }, [value]);

  const handleTimeChange = (newHours, newMinutes, newPeriod) => {
    let hour24 = parseInt(newHours);
    if (newPeriod === 'PM' && hour24 !== 12) hour24 += 12;
    if (newPeriod === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinutes}`;
    onChange({ target: { name: type === 'start' ? 'start_time' : 'end_time', value: timeString } });
  };

  const quickTimes = [
    { label: '09:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '11:00 AM', value: '11:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '01:00 PM', value: '13:00' },
    { label: '02:00 PM', value: '14:00' },
    { label: '03:00 PM', value: '15:00' },
    { label: '04:00 PM', value: '16:00' },
    { label: '05:00 PM', value: '17:00' },
  ];

  const formatDisplayTime = () => {
    if (!value) return 'Select Time';
    const [h, m] = value.split(':');
    const hour24 = parseInt(h);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const per = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12.toString().padStart(2, '0')}:${m} ${per}`;
  };

  const getClockColor = () => {
    return type === 'start' ? 'text-green-600' : 'text-red-600';
  };

  const getButtonColor = () => {
    return type === 'start' 
      ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' 
      : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100';
  };

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <svg className={`w-5 h-5 ${getClockColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Display Button */}
      <button
        type="button"
        onClick={() => setShowClock(!showClock)}
        className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 text-lg font-bold flex items-center justify-between ${
          type === 'start' 
            ? 'border-green-300 focus:ring-green-500 hover:border-green-400' 
            : 'border-red-300 focus:ring-red-500 hover:border-red-400'
        }`}
      >
        <span className="flex items-center gap-3">
          <svg className={`w-6 h-6 ${getClockColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDisplayTime()}
        </span>
        <svg className={`w-5 h-5 transition-transform ${showClock ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Clock Picker Dropdown */}
      {showClock && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 animate-scaleIn">
          {/* Quick Time Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Select
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {quickTimes.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => {
                    onChange({ target: { name: type === 'start' ? 'start_time' : 'end_time', value: time.value } });
                    setShowClock(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    value === time.value
                      ? getButtonColor()
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Clock */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className={`w-4 h-4 ${getClockColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Visual Clock
            </h4>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border-4 border-blue-200 shadow-inner">
                {/* Clock Numbers */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, idx) => {
                  const angle = (idx * 30 - 90) * (Math.PI / 180);
                  const x = 50 + 35 * Math.cos(angle);
                  const y = 50 + 35 * Math.sin(angle);
                  return (
                    <div
                      key={num}
                      className="absolute text-sm font-bold text-gray-700"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
                
                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
                
                {/* Hour Hand */}
                <div
                  className="absolute top-1/2 left-1/2 w-1 h-12 bg-gray-800 rounded-full origin-bottom transform -translate-x-1/2"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${(parseInt(hours) % 12) * 30}deg)`,
                    transformOrigin: 'bottom center'
                  }}
                ></div>
                
                {/* Minute Hand */}
                <div
                  className="absolute top-1/2 left-1/2 w-0.5 h-16 bg-blue-600 rounded-full origin-bottom"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${parseInt(minutes) * 6}deg)`,
                    transformOrigin: 'bottom center'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Manual Time Input */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Manual Input
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                  const newHours = val.toString().padStart(2, '0');
                  setHours(newHours);
                  handleTimeChange(newHours, minutes, period);
                }}
                className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-2xl font-bold text-gray-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                  const newMinutes = val.toString().padStart(2, '0');
                  setMinutes(newMinutes);
                  handleTimeChange(hours, newMinutes, period);
                }}
                className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('AM');
                    handleTimeChange(hours, minutes, 'AM');
                  }}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    period === 'AM'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('PM');
                    handleTimeChange(hours, minutes, 'PM');
                  }}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    period === 'PM'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setShowClock(false)}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default ClockTimePicker;
