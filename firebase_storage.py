"""
Firebase Storage Service
Upload and manage PDF reports in Firebase Storage
"""
import firebase_admin
from firebase_admin import storage
import io
from datetime import datetime, timedelta
import os


def _get_storage_bucket():
    """Get Firebase Storage bucket, ensuring Firebase is initialized"""
    try:
        # Check if Firebase is initialized
        if not firebase_admin._apps:
            from firebase_admin import credentials
            
            # Get service account path from environment
            service_account_path = os.getenv(
                'FIREBASE_SERVICE_ACCOUNT_PATH',
                'loginapp-e7f18-firebase-adminsdk-fbsvc-766ae828f0.json'
            )
            
            if not os.path.exists(service_account_path):
                raise Exception(f"Firebase service account file not found: {service_account_path}")
            
            cred = credentials.Certificate(service_account_path)
            
            # Try default bucket name first (appspot.com)
            try:
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'loginapp-e7f18.appspot.com'
                })
                print("✅ Firebase Admin initialized for Storage (appspot.com)")
            except Exception as e:
                print(f"⚠️ Failed with appspot.com, trying firebasestorage.app...")
                # Delete the failed app
                firebase_admin.delete_app(firebase_admin.get_app())
                # Try alternative bucket name
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'loginapp-e7f18.firebasestorage.app'
                })
                print("✅ Firebase Admin initialized for Storage (firebasestorage.app)")
        
        # Get bucket
        bucket = storage.bucket()
        print(f"📦 Using storage bucket: {bucket.name}")
        return bucket
        
    except Exception as e:
        print(f"❌ Error getting storage bucket: {e}")
        raise


def upload_pdf_report(pdf_buffer, patient_name, report_date=None):
    """
    Upload PDF report to Firebase Storage
    
    Args:
        pdf_buffer: BytesIO buffer containing PDF data
        patient_name: Name of the patient
        report_date: Date of report (optional)
    
    Returns:
        dict: {
            'success': bool,
            'url': str (download URL),
            'path': str (storage path),
            'error': str (if failed)
        }
    """
    try:
        # Get storage bucket
        bucket = _get_storage_bucket()
        
        # Generate filename
        if report_date is None:
            report_date = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        safe_patient_name = patient_name.replace(' ', '_').replace('/', '_')
        filename = f"medical_reports/{safe_patient_name}_{report_date}.pdf"
        
        # Create blob
        blob = bucket.blob(filename)
        
        # Reset buffer position
        pdf_buffer.seek(0)
        
        # Upload PDF
        blob.upload_from_file(
            pdf_buffer,
            content_type='application/pdf'
        )
        
        # Make the blob publicly accessible
        blob.make_public()
        
        # Get public URL
        public_url = blob.public_url
        
        print(f"✅ PDF uploaded to Firebase Storage: {filename}")
        print(f"📎 Public URL: {public_url}")
        
        return {
            'success': True,
            'url': public_url,
            'path': filename,
            'message': 'PDF uploaded successfully'
        }
        
    except Exception as e:
        print(f"❌ Error uploading PDF to Firebase Storage: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to upload PDF'
        }


def get_signed_url(file_path, expiration_minutes=10080):
    """
    Generate a signed URL for private file access
    
    Args:
        file_path: Path to file in storage
        expiration_minutes: URL expiration time in minutes (default: 7 days)
    
    Returns:
        str: Signed URL
    """
    try:
        bucket = _get_storage_bucket()
        blob = bucket.blob(file_path)
        
        # Generate signed URL (expires in specified minutes)
        url = blob.generate_signed_url(
            expiration=timedelta(minutes=expiration_minutes),
            method='GET'
        )
        
        return url
        
    except Exception as e:
        print(f"❌ Error generating signed URL: {e}")
        return None


def delete_report(file_path):
    """
    Delete a report from Firebase Storage
    
    Args:
        file_path: Path to file in storage
    
    Returns:
        dict: {'success': bool, 'message': str}
    """
    try:
        bucket = _get_storage_bucket()
        blob = bucket.blob(file_path)
        blob.delete()
        
        print(f"✅ Deleted report: {file_path}")
        
        return {
            'success': True,
            'message': 'Report deleted successfully'
        }
        
    except Exception as e:
        print(f"❌ Error deleting report: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def list_patient_reports(patient_name):
    """
    List all reports for a specific patient
    
    Args:
        patient_name: Name of the patient
    
    Returns:
        list: List of report metadata
    """
    try:
        bucket = _get_storage_bucket()
        safe_patient_name = patient_name.replace(' ', '_').replace('/', '_')
        prefix = f"medical_reports/{safe_patient_name}_"
        
        blobs = bucket.list_blobs(prefix=prefix)
        
        reports = []
        for blob in blobs:
            reports.append({
                'name': blob.name,
                'size': blob.size,
                'created': blob.time_created.isoformat() if blob.time_created else None,
                'url': blob.public_url if blob.public_url else None
            })
        
        return reports
        
    except Exception as e:
        print(f"❌ Error listing reports: {e}")
        return []
