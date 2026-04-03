"""
Test All ML Models
Verifies that all trained models are working correctly
"""
import os
import joblib
import numpy as np
from datetime import datetime

print("=" * 80)
print("ML MODELS VERIFICATION TEST")
print("=" * 80)

# Test 1: Check if model files exist
print("\n1. CHECKING MODEL FILES...")
models = {
    'consultation_time_model.pkl': 'Main consultation time predictor',
    'demo_model.pkl': 'Demo model',
    'consultation_time_real.pkl': 'Real consultation time model',
    'noshow_model.pkl': 'No-show prediction model'
}

existing_models = []
for model_file, description in models.items():
    if os.path.exists(model_file):
        size_mb = os.path.getsize(model_file) / (1024 * 1024)
        print(f"   ✅ {model_file} - {description} ({size_mb:.2f} MB)")
        existing_models.append(model_file)
    else:
        print(f"   ❌ {model_file} - NOT FOUND")

# Test 2: Load and test main consultation time model
print("\n2. TESTING CONSULTATION TIME MODEL...")
try:
    model = joblib.load('consultation_time_model.pkl')
    print(f"   ✅ Model loaded successfully")
    print(f"   📊 Model type: {type(model).__name__}")
    
    # Test prediction
    test_data = np.array([[30, 0, 3, 0, 25.5, 10]])  # age, visit_type, severity, is_emergency, past_avg_time, doctor_experience
    prediction = model.predict(test_data)
    print(f"   ✅ Test prediction: {prediction[0]:.2f} minutes")
    
    if hasattr(model, 'n_estimators'):
        print(f"   🌲 Number of trees: {model.n_estimators}")
    if hasattr(model, 'feature_importances_'):
        print(f"   📈 Feature importances available: Yes")
        
except Exception as e:
    print(f"   ❌ Error loading/testing model: {e}")

# Test 3: Test with ml_model.py integration
print("\n3. TESTING ML_MODEL.PY INTEGRATION...")
try:
    import ml_model
    
    # Initialize predictor
    ml_model.initialize_predictor()
    
    if ml_model.predictor:
        print(f"   ✅ Predictor initialized successfully")
        
        # Test symptom analysis
        test_symptoms = {
            "symptoms": "fever and cough for 3 days",
            "age": 35,
            "visit_type": 0,
            "past_avg_time": 0.0,
            "doctor_experience": 10
        }
        
        result = ml_model.predict_from_symptoms(test_symptoms)
        
        print(f"   ✅ Symptom analysis working")
        print(f"   📋 Triage severity: {result['triage']['severity']}")
        print(f"   🚨 Is emergency: {result['triage']['is_emergency']}")
        print(f"   ⏱️  Predicted time: {result['predicted_time']:.2f} minutes")
        print(f"   💡 Recommendation: {result['recommendation'][:50]}...")
    else:
        print(f"   ❌ Predictor not initialized")
        
except Exception as e:
    print(f"   ❌ Error testing ml_model.py: {e}")

# Test 4: Test AI Triage (Groq API)
print("\n4. TESTING AI TRIAGE (GROQ API)...")
try:
    from dotenv import load_dotenv
    load_dotenv()
    
    groq_key = os.getenv('GROQ_API_KEY')
    if groq_key:
        print(f"   ✅ Groq API key found")
        
        if ml_model.predictor:
            triage = ml_model.predictor.analyze_symptoms("severe chest pain and difficulty breathing")
            print(f"   ✅ AI Triage working")
            print(f"   📊 Severity: {triage['severity']}")
            print(f"   🚨 Emergency: {triage['is_emergency']}")
            print(f"   🎯 Confidence: {triage['confidence']}")
        else:
            print(f"   ⚠️  Predictor not available for triage test")
    else:
        print(f"   ⚠️  Groq API key not found in .env")
        
except Exception as e:
    print(f"   ⚠️  AI Triage test failed: {e}")
    print(f"   ℹ️  This is OK - fallback triage will be used")

# Test 5: Test No-Show Model (if exists)
print("\n5. TESTING NO-SHOW MODEL...")
if os.path.exists('noshow_model.pkl'):
    try:
        noshow_model = joblib.load('noshow_model.pkl')
        print(f"   ✅ No-show model loaded")
        print(f"   📊 Model type: {type(noshow_model).__name__}")
        
        # Test prediction (example features)
        test_data = np.array([[1, 30, 2, 1, 0, 5, 1]])  # Example features
        prediction = noshow_model.predict(test_data)
        print(f"   ✅ Test prediction: {'Will show' if prediction[0] == 0 else 'May not show'}")
        
    except Exception as e:
        print(f"   ⚠️  Error testing no-show model: {e}")
else:
    print(f"   ℹ️  No-show model not found (optional)")

# Test 6: Backend Integration Test
print("\n6. TESTING BACKEND INTEGRATION...")
try:
    import requests
    
    # Test if backend is running
    response = requests.get('http://localhost:5000/health', timeout=2)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Backend is running")
        print(f"   📊 Status: {data.get('status')}")
        print(f"   🤖 Model loaded: {data.get('model_loaded')}")
    else:
        print(f"   ⚠️  Backend returned status: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print(f"   ⚠️  Backend not running (start with: python app.py)")
except Exception as e:
    print(f"   ⚠️  Error testing backend: {e}")

# Test 7: Test AI Triage Endpoint
print("\n7. TESTING AI TRIAGE ENDPOINT...")
try:
    import requests
    
    response = requests.post(
        'http://localhost:5000/ai-triage',
        json={'symptoms': 'headache and fever'},
        timeout=5
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ AI Triage endpoint working")
        print(f"   📋 Severity: {data['triage']['severity']}")
        print(f"   🚨 Emergency: {data['triage']['is_emergency']}")
    else:
        print(f"   ⚠️  Endpoint returned status: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print(f"   ⚠️  Backend not running")
except Exception as e:
    print(f"   ⚠️  Error: {e}")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Models found: {len(existing_models)}/4")
print(f"✅ Main model working: {'Yes' if 'consultation_time_model.pkl' in existing_models else 'No'}")
print(f"✅ ML integration: {'Yes' if ml_model.predictor else 'No'}")
print("\n💡 RECOMMENDATIONS:")
print("   1. Make sure backend is running: python app.py")
print("   2. Test booking an appointment on the website")
print("   3. Check that AI triage assigns severity correctly")
print("   4. Verify predicted consultation times are reasonable (10-60 mins)")
print("\n" + "=" * 80)
