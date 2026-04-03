# Doctor Dashboard Components

Modern hospital-grade UI components for the Doctor Dashboard.

## 🎨 Design System

### Colors
- **Primary Blue**: `#2563EB` (blue-600)
- **Light Blue**: `#DBEAFE` (blue-50)
- **Background**: `#F8FAFC` (slate-50)
- **Card Background**: `#FFFFFF` (white)
- **Text Primary**: `#1E293B` (slate-800)
- **Text Secondary**: `#64748B` (slate-500)

### Status Colors
- **Low Severity**: `#22C55E` (green-500)
- **Medium Severity**: `#EAB308` (yellow-500)
- **High Severity**: `#EF4444` (red-500)
- **Emergency**: Red with pulse animation

## 📦 Components

### 1. PatientCard.jsx
Main card displaying current patient information.

**Features:**
- Large, centered design
- Emergency badge with pulse animation
- Severity color-coded badges
- Symptoms display
- AI analysis section
- Action buttons (Start, Complete, Skip)

### 2. Timer.jsx
Consultation timer with progress tracking.

**Features:**
- Elapsed time counter
- Predicted time display
- Animated progress bar
- Overtime warning

### 3. AIInsight.jsx
AI-powered patient triage insights.

**Features:**
- Color-coded by severity
- Confidence score display
- Dynamic messaging

### 4. NextPatients.jsx
Queue preview showing upcoming patients.

**Features:**
- Shows next 3 patients
- Severity indicators
- Hover effects
- Emergency badges

### 5. NotesSection.jsx
Consultation notes input area.

**Features:**
- Clean textarea
- Character counter
- Save functionality
- Disabled state handling

### 6. Alert.jsx
Toast notification system.

**Features:**
- Auto-dismiss
- Multiple types (info, success, error, emergency)
- Slide-in animation
- Manual close option

## 🚀 Usage

The main `DoctorDashboard.jsx` page integrates all components:

```jsx
import DoctorDashboard from './pages/DoctorDashboard';
```

## 🔌 API Integration

The dashboard connects to these endpoints:
- `GET /queue` - Fetch patient queue
- Auto-refreshes every 10 seconds

## ⚠️ Important Notes

- **DO NOT** modify existing admin or booking pages
- **DO NOT** change backend APIs
- All components are isolated and self-contained
- Uses existing backend queue system
- No database modifications required

## 🎯 Features

✅ Real-time queue updates
✅ Emergency patient prioritization
✅ Consultation timer
✅ AI triage insights
✅ Notes management
✅ Toast notifications
✅ Responsive design
✅ Smooth animations
✅ Professional medical UI
