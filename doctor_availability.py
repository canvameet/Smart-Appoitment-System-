"""
Doctor Availability and Utilization Tracking System
Isolated module - does NOT modify existing functionality
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

class DoctorScheduleManager:
    """
    Manages doctor schedules, availability, and utilization tracking.
    Completely isolated from existing booking system.
    """
    
    def __init__(self):
        # In-memory storage (replace with actual database in production)
        self.schedules = []
        self.schedule_counter = 1
        
        # Initialize with sample data
        self._initialize_sample_schedules()
    
    def _initialize_sample_schedules(self):
        """Initialize sample doctor schedules for demonstration"""
        today = datetime.now().date()
        
        # Sample schedules for doc1
        sample_schedules = [
            {
                "doctor_id": "doc1",
                "start_time": f"{today}T09:00:00",
                "end_time": f"{today}T12:00:00",
                "status": "available",
                "reason": None
            },
            {
                "doctor_id": "doc1",
                "start_time": f"{today}T12:00:00",
                "end_time": f"{today}T13:00:00",
                "status": "blocked",
                "reason": "Lunch Break"
            },
            {
                "doctor_id": "doc1",
                "start_time": f"{today}T13:00:00",
                "end_time": f"{today}T15:00:00",
                "status": "busy",
                "reason": "Surgery"
            },
            {
                "doctor_id": "doc1",
                "start_time": f"{today}T15:00:00",
                "end_time": f"{today}T17:00:00",
                "status": "available",
                "reason": None
            },
            # Sample schedules for doc2
            {
                "doctor_id": "doc2",
                "start_time": f"{today}T09:00:00",
                "end_time": f"{today}T11:00:00",
                "status": "available",
                "reason": None
            },
            {
                "doctor_id": "doc2",
                "start_time": f"{today}T11:00:00",
                "end_time": f"{today}T12:00:00",
                "status": "blocked",
                "reason": "Team Meeting"
            },
            {
                "doctor_id": "doc2",
                "start_time": f"{today}T12:00:00",
                "end_time": f"{today}T17:00:00",
                "status": "available",
                "reason": None
            },
            # Sample schedules for doc3
            {
                "doctor_id": "doc3",
                "start_time": f"{today}T09:00:00",
                "end_time": f"{today}T10:30:00",
                "status": "busy",
                "reason": "Emergency Consultation"
            },
            {
                "doctor_id": "doc3",
                "start_time": f"{today}T10:30:00",
                "end_time": f"{today}T16:00:00",
                "status": "available",
                "reason": None
            },
            {
                "doctor_id": "doc3",
                "start_time": f"{today}T16:00:00",
                "end_time": f"{today}T17:00:00",
                "status": "blocked",
                "reason": "Administrative Work"
            }
        ]
        
        for schedule in sample_schedules:
            self.add_schedule(schedule)
    
    def add_schedule(self, schedule_data: Dict) -> Dict:
        """
        Add a new schedule entry for a doctor.
        
        Args:
            schedule_data: Dictionary containing:
                - doctor_id: str
                - start_time: str (ISO format)
                - end_time: str (ISO format)
                - status: str (available/busy/blocked)
                - reason: str (optional)
        
        Returns:
            Created schedule with ID
        """
        schedule = {
            "id": f"SCH{self.schedule_counter:04d}",
            "doctor_id": schedule_data["doctor_id"],
            "start_time": schedule_data["start_time"],
            "end_time": schedule_data["end_time"],
            "status": schedule_data.get("status", "available"),
            "reason": schedule_data.get("reason"),
            "created_at": datetime.now().isoformat()
        }
        
        self.schedules.append(schedule)
        self.schedule_counter += 1
        
        return schedule
    
    def get_doctor_schedule(self, doctor_id: str, date: Optional[str] = None) -> List[Dict]:
        """
        Get all schedule entries for a doctor on a specific date.
        
        Args:
            doctor_id: Doctor identifier
            date: Date string (YYYY-MM-DD), defaults to today
        
        Returns:
            List of schedule entries
        """
        if date is None:
            date = datetime.now().date().isoformat()
        
        doctor_schedules = [
            s for s in self.schedules 
            if s["doctor_id"] == doctor_id and s["start_time"].startswith(date)
        ]
        
        # Sort by start time
        doctor_schedules.sort(key=lambda x: x["start_time"])
        
        return doctor_schedules
    
    def check_availability(self, doctor_id: str, check_time: str) -> Dict:
        """
        Check if doctor is available at a specific time.
        
        Args:
            doctor_id: Doctor identifier
            check_time: ISO format datetime string
        
        Returns:
            Dictionary with availability status and reason
        """
        check_dt = datetime.fromisoformat(check_time.replace('Z', ''))
        
        for schedule in self.schedules:
            if schedule["doctor_id"] != doctor_id:
                continue
            
            start_dt = datetime.fromisoformat(schedule["start_time"])
            end_dt = datetime.fromisoformat(schedule["end_time"])
            
            # Check if time falls within this schedule slot
            if start_dt <= check_dt < end_dt:
                return {
                    "available": schedule["status"] == "available",
                    "status": schedule["status"],
                    "reason": schedule["reason"],
                    "slot": {
                        "start_time": schedule["start_time"],
                        "end_time": schedule["end_time"]
                    }
                }
        
        # No schedule found for this time
        return {
            "available": False,
            "status": "no_schedule",
            "reason": "No schedule defined for this time",
            "slot": None
        }
    
    def get_available_slots(self, doctor_id: str, date: Optional[str] = None) -> List[Dict]:
        """
        Get all available time slots for a doctor on a specific date.
        
        Args:
            doctor_id: Doctor identifier
            date: Date string (YYYY-MM-DD), defaults to today
        
        Returns:
            List of available slots
        """
        all_schedules = self.get_doctor_schedule(doctor_id, date)
        
        available_slots = [
            {
                "start_time": s["start_time"],
                "end_time": s["end_time"],
                "duration_minutes": self._calculate_duration(s["start_time"], s["end_time"])
            }
            for s in all_schedules 
            if s["status"] == "available"
        ]
        
        return available_slots
    
    def calculate_utilization(self, doctor_id: str, date: Optional[str] = None) -> Dict:
        """
        Calculate doctor utilization metrics for a specific date.
        
        Args:
            doctor_id: Doctor identifier
            date: Date string (YYYY-MM-DD), defaults to today
        
        Returns:
            Dictionary with utilization metrics
        """
        schedules = self.get_doctor_schedule(doctor_id, date)
        
        if not schedules:
            return {
                "doctor_id": doctor_id,
                "date": date or datetime.now().date().isoformat(),
                "total_hours": 0,
                "available_hours": 0,
                "busy_hours": 0,
                "blocked_hours": 0,
                "utilization_percentage": 0,
                "message": "No schedule found for this date"
            }
        
        total_minutes = 0
        available_minutes = 0
        busy_minutes = 0
        blocked_minutes = 0
        
        for schedule in schedules:
            duration = self._calculate_duration(schedule["start_time"], schedule["end_time"])
            total_minutes += duration
            
            if schedule["status"] == "available":
                available_minutes += duration
            elif schedule["status"] == "busy":
                busy_minutes += duration
            elif schedule["status"] == "blocked":
                blocked_minutes += duration
        
        # Calculate utilization (busy time / total time)
        utilization_percentage = (busy_minutes / total_minutes * 100) if total_minutes > 0 else 0
        
        return {
            "doctor_id": doctor_id,
            "date": date or datetime.now().date().isoformat(),
            "total_hours": round(total_minutes / 60, 2),
            "available_hours": round(available_minutes / 60, 2),
            "busy_hours": round(busy_minutes / 60, 2),
            "blocked_hours": round(blocked_minutes / 60, 2),
            "utilization_percentage": round(utilization_percentage, 2),
            "breakdown": {
                "available": round((available_minutes / total_minutes * 100), 2) if total_minutes > 0 else 0,
                "busy": round((busy_minutes / total_minutes * 100), 2) if total_minutes > 0 else 0,
                "blocked": round((blocked_minutes / total_minutes * 100), 2) if total_minutes > 0 else 0
            }
        }
    
    def _calculate_duration(self, start_time: str, end_time: str) -> int:
        """Calculate duration in minutes between two times"""
        start_dt = datetime.fromisoformat(start_time)
        end_dt = datetime.fromisoformat(end_time)
        duration = (end_dt - start_dt).total_seconds() / 60
        return int(duration)
    
    def update_schedule_status(self, schedule_id: str, new_status: str, reason: Optional[str] = None) -> Dict:
        """
        Update the status of an existing schedule entry.
        
        Args:
            schedule_id: Schedule entry ID
            new_status: New status (available/busy/blocked)
            reason: Optional reason for the status
        
        Returns:
            Updated schedule entry or error
        """
        for schedule in self.schedules:
            if schedule["id"] == schedule_id:
                schedule["status"] = new_status
                if reason:
                    schedule["reason"] = reason
                schedule["updated_at"] = datetime.now().isoformat()
                return schedule
        
        return {"error": "Schedule not found"}
    
    def delete_schedule(self, schedule_id: str) -> Dict:
        """
        Delete a schedule entry.
        
        Args:
            schedule_id: Schedule entry ID
        
        Returns:
            Success message or error
        """
        for i, schedule in enumerate(self.schedules):
            if schedule["id"] == schedule_id:
                deleted = self.schedules.pop(i)
                return {"success": True, "deleted": deleted}
        
        return {"success": False, "error": "Schedule not found"}


# Global instance
schedule_manager = None

def initialize_schedule_manager():
    """Initialize the global schedule manager instance"""
    global schedule_manager
    schedule_manager = DoctorScheduleManager()
    return schedule_manager

def get_schedule_manager():
    """Get the global schedule manager instance"""
    global schedule_manager
    if schedule_manager is None:
        schedule_manager = initialize_schedule_manager()
    return schedule_manager
