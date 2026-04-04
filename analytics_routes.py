"""
Analytics Routes for Admin Dashboard
Provides appointment statistics and insights
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import firebase_appointments

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """
    Get comprehensive analytics for admin dashboard
    Query params: range (today, week, month)
    """
    try:
        time_range = request.args.get('range', 'today')
        
        # Calculate date range
        now = datetime.now()
        if time_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_range == 'week':
            start_date = now - timedelta(days=7)
        elif time_range == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get all appointments from Firebase
        result = firebase_appointments.get_all_appointments()
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': 'Failed to fetch appointments'
            }), 500
        
        all_appointments = result.get('appointments', [])
        
        # Filter by date range
        filtered_appointments = []
        for apt in all_appointments:
            # Handle both dict and object types
            if isinstance(apt, dict):
                apt_date_str = apt.get('date', '')
            else:
                apt_date_str = getattr(apt, 'date', '')
                
            if apt_date_str:
                try:
                    apt_date = datetime.strptime(apt_date_str, '%Y-%m-%d')
                    if apt_date >= start_date:
                        filtered_appointments.append(apt)
                except:
                    pass
        
        # Status breakdown
        status_breakdown = {
            'completed': 0,
            'cancelled': 0,
            'pending': 0
        }
        
        for apt in filtered_appointments:
            if isinstance(apt, dict):
                status = apt.get('status', 'pending').lower()
            else:
                status = getattr(apt, 'status', 'pending').lower()
                
            if status == 'completed':
                status_breakdown['completed'] += 1
            elif status in ['cancelled', 'rejected']:
                status_breakdown['cancelled'] += 1
            else:
                status_breakdown['pending'] += 1
        
        # Daily trend (last 7 days)
        daily_trend = []
        for i in range(7):
            date = now - timedelta(days=6-i)
            date_str = date.strftime('%Y-%m-%d')
            count = 0
            for apt in filtered_appointments:
                if isinstance(apt, dict):
                    apt_date = apt.get('date')
                    apt_status = apt.get('status', '').lower()
                else:
                    apt_date = getattr(apt, 'date', '')
                    apt_status = getattr(apt, 'status', '').lower()
                    
                if apt_date == date_str and apt_status == 'completed':
                    count += 1
                    
            daily_trend.append({
                'date': date.strftime('%m/%d'),
                'count': count
            })
        
        # Slot distribution (most booked slots)
        slot_counts = {}
        for apt in filtered_appointments:
            if isinstance(apt, dict):
                slot = apt.get('timeSlot', 'Unknown')
            else:
                slot = getattr(apt, 'timeSlot', 'Unknown')
                
            if slot != 'Unknown':
                slot_counts[slot] = slot_counts.get(slot, 0) + 1
        
        # Get top 10 slots
        sorted_slots = sorted(slot_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        slot_distribution = [
            {'timeSlot': slot[0].split(' - ')[0] if ' - ' in slot[0] else slot[0], 'count': slot[1]}
            for slot in sorted_slots
        ]
        
        print(f"✅ Analytics: {len(filtered_appointments)} appointments, Status: {status_breakdown}")
        
        return jsonify({
            'success': True,
            'data': {
                'statusBreakdown': status_breakdown,
                'dailyTrend': daily_trend,
                'slotDistribution': slot_distribution,
                'totalAppointments': len(filtered_appointments)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
