"""
Dynamic Rescheduling Engine
----------------------------
Priority Queue-based patient scheduling engine using a Binary Min-Heap.
Handles late arrivals, early arrivals, emergency bumping, and smart notifications.
"""

import heapq
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
from dataclasses import dataclass, field

# ============================================================================
# ENUMS & DATA MODEL
# ============================================================================

class PatientStatus(Enum):
    WAITING   = "Waiting"
    CHECKED_IN = "Checked-in"
    DELAYED   = "Delayed"
    IN_PROGRESS = "In-Progress"
    COMPLETED = "Completed"


@dataclass
class Task:
    """
    Represents a patient appointment task in the scheduling engine.
    """
    patientId: str
    name: str
    originalSlot: datetime        # Booked time slot
    arrivalTime: Optional[datetime] = None  # Actual arrival (None = not yet arrived)
    priorityScore: int = 5        # 1 (Emergency/High) to 10 (Low)
    status: PatientStatus = PatientStatus.WAITING
    predictedDuration: int = 20   # ML-predicted consultation time in minutes
    is_emergency: bool = False
    notifications_sent: List[str] = field(default_factory=list)

    # Time tracking
    inProgressStartTime: Optional[datetime] = None
    completionTime: Optional[datetime] = None
    
    # Internal computed effective priority for heap ordering
    _effective_priority: int = field(init=False)
    
    def __post_init__(self):
        self._compute_effective_priority()
    
    def _compute_effective_priority(self):
        """
        Effective priority = priorityScore (lower = higher priority).
        Emergency cases are always forced to 0 (absolute top).
        """
        if self.is_emergency:
            self._effective_priority = 0
        else:
            self._effective_priority = self.priorityScore
    
    # Heap comparison: lower effective_priority = serve first
    def __lt__(self, other: "Task"):
        if self._effective_priority != other._effective_priority:
            return self._effective_priority < other._effective_priority
        # Tiebreak: earlier original slot goes first
        return self.originalSlot < other.originalSlot
    
    def to_dict(self) -> Dict:
        actual_duration = None
        if self.inProgressStartTime and self.completionTime:
            actual_duration = round((self.completionTime - self.inProgressStartTime).total_seconds() / 60, 1)

        return {
            "patientId": self.patientId,
            "name": self.name,
            "originalSlot": self.originalSlot.isoformat(),
            "arrivalTime": self.arrivalTime.isoformat() if self.arrivalTime else None,
            "priorityScore": self.priorityScore,
            "effectivePriority": self._effective_priority,
            "status": self.status.value,
            "is_emergency": self.is_emergency,
            "predictedDuration": self.predictedDuration,
            "actualDuration": actual_duration,
            "inProgressTime": self.inProgressStartTime.isoformat() if self.inProgressStartTime else None,
            "completionTime": self.completionTime.isoformat() if self.completionTime else None,
        }


# ============================================================================
# MOCK NOTIFICATION SYSTEM
# ============================================================================

def sendNotification(patient: Task, message: str, shift_minutes: float):
    """
    Mock notification trigger for patients whose expected start time
    shifts by more than 10 minutes.
    
    In production: replace with email/SMS/push notification service.
    """
    notification_log = {
        "timestamp": datetime.now().isoformat(),
        "patientId": patient.patientId,
        "patientName": patient.name,
        "message": message,
        "timeShift": f"+{round(shift_minutes)} mins" if shift_minutes > 0 else f"{round(shift_minutes)} mins",
        "channel": "SMS"
    }
    
    patient.notifications_sent.append(notification_log)
    
    print(f"[NOTIFICATION] -> {patient.name} (ID: {patient.patientId})")
    print(f"   Message : {message}")
    print(f"   Shift   : {notification_log['timeShift']}")
    print()
    
    return notification_log


# ============================================================================
# DYNAMIC RESCHEDULING ENGINE
# ============================================================================

class ReschedulingEngine:
    """
    Binary Min-Heap based Priority Queue for dynamic patient rescheduling.
    
    Priority Rules (lower number = served first):
      0  -> Emergency (automatically assigned, always top)
      1  -> Very High (Severity 5)
      2  -> High
      3  -> Above Average  
      5  -> Normal (default)
      7  -> Downgraded (late arrivals after 15 min grace period)
      10 -> Lowest
    """
    
    LATE_THRESHOLD_MINUTES = 15
    NOTIFICATION_SHIFT_THRESHOLD = 10  # minutes
    
    def __init__(self):
        self._heap: List[Task] = []
        self.all_tasks: Dict[str, Task] = {}  # patientId -> Task
        self.notifications_log: List[Dict] = []
        self._slot_start_times_before: Dict[str, datetime] = {}
    
    def _snapshot_expected_times(self):
        """
        Snapshot the expected start times of the top-3 patients BEFORE a reshuffle.
        Used to compute shift delta for notifications.
        """
        snapshot = {}
        temp = sorted(self._heap)[:3]
        running_time = datetime.now()
        for task in temp:
            snapshot[task.patientId] = running_time
            running_time += timedelta(minutes=task.predictedDuration)
        return snapshot
    
    def addPatient(self, task: Task):
        """Add a new patient to the priority queue."""
        heapq.heappush(self._heap, task)
        self.all_tasks[task.patientId] = task
        print(f"[ADD] {task.name} (Priority: {task._effective_priority}, Slot: {task.originalSlot.strftime('%H:%M %p')})")
    
    def updateStatus(self, patientId: str, new_status: PatientStatus, arrival_time: Optional[datetime] = None):
        """
        Update a patient's status and arrival time, then trigger a reshuffle.
        This is the main trigger for the rescheduling engine.
        """
        if patientId not in self.all_tasks:
            print(f"[ERROR] Patient {patientId} not found.")
            return
        
        task = self.all_tasks[patientId]
        task.status = new_status
        
        if arrival_time:
            task.arrivalTime = arrival_time
        
        # Track session start and end times
        if new_status == PatientStatus.IN_PROGRESS:
            task.inProgressStartTime = datetime.now()
            print(f"[TRACKING] {task.name} session started at {task.inProgressStartTime.strftime('%I:%M %p')}")

        if new_status == PatientStatus.COMPLETED:
            task.completionTime = datetime.now()
            print(f"[TRACKING] {task.name} session completed at {task.completionTime.strftime('%I:%M %p')}")
        
        print(f"\n[STATUS UPDATE] {task.name} -> {new_status.value}")
        
        # Apply scenario-based priority logic
        self._applyLateArrivalRule(task)
        self._applyEarlyArrivalRule(task)
        
        # Re-trigger full queue reshuffle
        self.rescheduleQueue()
    
    def markEmergency(self, patientId: str):
        """
        Scenario C: Immediately escalate a patient to Emergency (Priority 0).
        This forces them to the absolute top of the queue.
        """
        if patientId not in self.all_tasks:
            print(f"[ERROR] Patient {patientId} not found.")
            return
        
        task = self.all_tasks[patientId]
        old_priority = task._effective_priority
        task.is_emergency = True
        task.priorityScore = 1
        task._compute_effective_priority()
        task.status = PatientStatus.CHECKED_IN
        
        print(f"\n[EMERGENCY] {task.name} escalated to EMERGENCY (was Priority {old_priority})")
        self.rescheduleQueue()
    
    def _applyLateArrivalRule(self, task: Task):
        """
        Scenario A: If patient arrives more than 15 minutes late,
        downgrade their priority by bumping priorityScore up by 3.
        """
        if task.arrivalTime and not task.is_emergency:
            late_by = (task.arrivalTime - task.originalSlot).total_seconds() / 60
            if late_by > self.LATE_THRESHOLD_MINUTES:
                old_p = task.priorityScore
                task.priorityScore = min(10, task.priorityScore + 3)
                task._compute_effective_priority()
                print(f"[LATE ARRIVAL] {task.name} is {round(late_by)} mins late -> Priority downgraded: {old_p} -> {task.priorityScore}")
    
    def _applyEarlyArrivalRule(self, task: Task):
        """
        Scenario B: If a high-priority patient (score <= 3) checks in early,
        upgrade their effective priority further to move them up in queue.
        """
        if task.arrivalTime and not task.is_emergency:
            early_by = (task.originalSlot - task.arrivalTime).total_seconds() / 60
            if early_by > 0 and task.priorityScore <= 3:
                old_p = task.priorityScore
                task.priorityScore = max(1, task.priorityScore - 1)
                task._compute_effective_priority()
                print(f"[EARLY ARRIVAL] {task.name} arrived {round(early_by)} mins early -> Priority upgraded: {old_p} -> {task.priorityScore}")
    
    def rescheduleQueue(self):
        """
        Core engine: Rebuilds the Binary Min-Heap from the current task states.
        Calculates expected start times and triggers notifications for
        patients whose expected time shifted by more than 10 minutes.
        """
        print("\n[ENGINE] Running rescheduleQueue()...")
        
        # Snapshot times BEFORE reshuffle
        times_before = self._snapshot_expected_times()
        
        # Rebuild heap (heapify respects __lt__ on Task)
        heapq.heapify(self._heap)
        
        # Compute new expected start times AFTER reshuffle
        running_time = datetime.now()
        sorted_queue = sorted(self._heap)
        
        for i, task in enumerate(sorted_queue):
            expected_start = running_time
            running_time += timedelta(minutes=task.predictedDuration)
            
            # Check if the top-3 patients experienced a shift > 10 mins
            if i < 3 and task.patientId in times_before:
                shift_mins = (expected_start - times_before[task.patientId]).total_seconds() / 60
                if abs(shift_mins) > self.NOTIFICATION_SHIFT_THRESHOLD:
                    msg = (
                        f"Your appointment time has shifted by {round(abs(shift_mins))} minutes. "
                        f"New expected start: {expected_start.strftime('%I:%M %p')}."
                    )
                    note = sendNotification(task, msg, shift_mins)
                    self.notifications_log.append(note)
        
        self._printQueue()
    
    def _printQueue(self):
        """Display the current ordered queue."""
        print("\n--- CURRENT PRIORITY QUEUE ---")
        sorted_q = sorted(self._heap)
        for i, task in enumerate(sorted_q):
            er_tag = " [EMERGENCY]" if task.is_emergency else ""
            print(f"  {i+1}. [{task._effective_priority}] {task.name} | Status: {task.status.value} | Est: {task.predictedDuration}m{er_tag}")
        print("------------------------------\n")
    
    def getQueue(self) -> List[Dict]:
        """Return the ordered queue as a list of dicts (for Flask API)."""
        return [task.to_dict() for task in sorted(self._heap)]
    
    def peekNext(self) -> Optional[Task]:
        """Peek at the next patient to be served without removing."""
        return self._heap[0] if self._heap else None
    
    def serveNext(self) -> Optional[Task]:
        """Serve (pop) the next highest-priority patient."""
        if not self._heap:
            return None
        task = heapq.heappop(self._heap)
        task.status = PatientStatus.IN_PROGRESS
        print(f"[SERVING] {task.name} (Priority: {task._effective_priority})")
        return task


# ============================================================================
# FLASK INTEGRATION - Global Engine Instance
# ============================================================================

_engine: Optional[ReschedulingEngine] = None

def get_engine() -> ReschedulingEngine:
    global _engine
    if _engine is None:
        _engine = ReschedulingEngine()
    return _engine


def add_patient_to_engine(appointment: Dict) -> Dict:
    """
    Create a Task from an appointment dict and inject it into the engine.
    Call this from the /smart-book Flask route.
    """
    engine = get_engine()
    
    # Parse slot time (use now as default)
    try:
        slot_str = appointment.get("date", "") + " " + appointment.get("time_slot", "09:00 AM")
        slot_dt = datetime.strptime(slot_str, "%Y-%m-%d %I:%M %p")
    except Exception:
        slot_dt = datetime.now()
    
    triage = appointment.get("triage", {})
    severity = triage.get("severity", 3)
    
    # Map severity (1-5) to priority score (1-10): severity 5 -> priority 1, severity 1 -> priority 9
    priority_score = max(1, 10 - (severity * 2))
    
    task = Task(
        patientId=appointment.get("id", f"P{len(engine.all_tasks)+1:04d}"),
        name=appointment.get("name", "Unknown"),
        originalSlot=slot_dt,
        priorityScore=priority_score,
        status=PatientStatus.WAITING,
        predictedDuration=appointment.get("predicted_time", 20),
        is_emergency=triage.get("is_emergency", False),
    )
    
    engine.addPatient(task)
    return task.to_dict()


# ============================================================================
# STANDALONE DEMO
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("DYNAMIC RESCHEDULING ENGINE - DEMO")
    print("=" * 70)

    engine = ReschedulingEngine()
    now = datetime.now()

    # Seed patients
    patients = [
        Task("P001", "Alice (Moderate)", now + timedelta(minutes=10), priorityScore=5, predictedDuration=20),
        Task("P002", "Bob (Mild)",       now + timedelta(minutes=20), priorityScore=7, predictedDuration=15),
        Task("P003", "Carol (High)",     now + timedelta(minutes=30), priorityScore=3, predictedDuration=25),
        Task("P004", "Dave (Low)",       now + timedelta(minutes=40), priorityScore=8, predictedDuration=12),
    ]
    
    for p in patients:
        engine.addPatient(p)

    print("\n-- SCENARIO A: Bob arrives 20 mins late --")
    engine.updateStatus("P002", PatientStatus.CHECKED_IN, arrival_time=now + timedelta(minutes=40))

    print("\n-- SCENARIO B: Carol (High Priority) arrives 15 mins early --")
    engine.updateStatus("P003", PatientStatus.CHECKED_IN, arrival_time=now + timedelta(minutes=15))

    print("\n-- SCENARIO C: Dave suddenly becomes an Emergency --")
    engine.markEmergency("P004")

    print("\nFinal Queue State:")
    for item in engine.getQueue():
        print(f"  [{item['effectivePriority']}] {item['name']} | {item['status']}")
