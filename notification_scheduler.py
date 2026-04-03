"""
Notification Scheduler
Background job that runs every 60 seconds to:
  - Check for appointments within the next 10 minutes
  - Send reminder notifications if not already sent

This module does NOT modify any existing scheduler or queue logic.
It reads from the queue manager to find upcoming appointments.
"""
import threading
import time
from datetime import datetime, timedelta

# Track which appointment IDs have already received reminders
_sent_reminders = set()
_scheduler_running = False


def _check_and_send_reminders(queue_getter):
    """
    Core scheduler loop.
    Checks appointments and sends reminders 10 minutes before.
    
    Args:
        queue_getter: Callable that returns the current appointment queue list
    """
    from notification_service import send_appointment_reminder

    try:
        queue = queue_getter()
        now = datetime.now()

        for appointment in queue:
            appt_id = appointment.get('id')
            if not appt_id or appt_id in _sent_reminders:
                continue

            # Parse the appointment date and time slot
            appt_date_str = appointment.get('date')
            time_slot = appointment.get('time_slot', '')

            if not appt_date_str or not time_slot:
                continue

            try:
                # Extract start time from slot (e.g. "10:00 AM - 10:15 AM" → "10:00 AM")
                slot_start = time_slot.split(' - ')[0].strip()
                appt_datetime = datetime.strptime(
                    f"{appt_date_str} {slot_start}",
                    "%Y-%m-%d %I:%M %p"
                )

                # Calculate time difference
                time_diff = appt_datetime - now
                minutes_until = time_diff.total_seconds() / 60

                # Send reminder if appointment is within 10 minutes and in the future
                if 0 < minutes_until <= 10:
                    patient_name = appointment.get('name', 'Patient')
                    doctor_name = appointment.get('doctor_name', 'Doctor')
                    patient_id = appt_id  # Using appointment ID as patient identifier

                    print(f"[SCHEDULER] Sending reminder for {patient_name} | Appointment in {minutes_until:.1f} min")

                    send_appointment_reminder(
                        patient_id=patient_id,
                        patient_name=patient_name,
                        doctor_name=doctor_name,
                        time_slot=time_slot,
                        patient_phone=appointment.get('phone'),    # May be None
                        patient_token=appointment.get('fcm_token')  # May be None
                    )

                    _sent_reminders.add(appt_id)

            except (ValueError, IndexError) as e:
                # Skip appointments with unparseable dates
                continue

    except Exception as e:
        print(f"[SCHEDULER ERROR] {e}")


def _scheduler_loop(queue_getter, interval_seconds=60):
    """
    Background loop that checks for reminders periodically.
    
    Args:
        queue_getter: Callable returning the current queue
        interval_seconds: Seconds between each check (default: 60)
    """
    global _scheduler_running
    _scheduler_running = True

    print(f"[SCHEDULER] 🔔 Notification scheduler started (checking every {interval_seconds}s)")

    while _scheduler_running:
        _check_and_send_reminders(queue_getter)
        time.sleep(interval_seconds)


def start_notification_scheduler(queue_getter, interval_seconds=60):
    """
    Start the notification scheduler as a background daemon thread.
    
    Args:
        queue_getter: Callable that returns the current appointment queue list
        interval_seconds: How often to check (default: 60 seconds)
    """
    scheduler_thread = threading.Thread(
        target=_scheduler_loop,
        args=(queue_getter, interval_seconds),
        daemon=True,
        name="NotificationScheduler"
    )
    scheduler_thread.start()
    return scheduler_thread


def stop_notification_scheduler():
    """Stop the notification scheduler."""
    global _scheduler_running
    _scheduler_running = False
    print("[SCHEDULER] Notification scheduler stopped")
