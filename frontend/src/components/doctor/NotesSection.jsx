import React, { useState } from 'react';

const NotesSection = ({ patientId, onSave }) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!notes.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(patientId, notes);
      // Optional: Clear notes after save or show success message
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        Consultation Notes
      </h3>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter consultation notes, diagnosis, prescriptions..."
        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
      />
      
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-slate-500">
          {notes.length} characters
        </p>
        <button
          onClick={handleSave}
          disabled={!notes.trim() || isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
};

export default NotesSection;
