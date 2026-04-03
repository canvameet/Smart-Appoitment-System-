"""
Smart Healthcare Appointment Scheduling - ML Module
Predicts consultation time based on patient data and historical records
Flask-ready implementation with RandomForestRegressor
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
from typing import Dict, Optional, List, Tuple
import warnings
import json
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv

warnings.filterwarnings('ignore')

# Load environment variables from .env file
load_dotenv()


class HealthcareTimePredictor:
    """
    Machine Learning model for predicting healthcare consultation times.
    Uses RandomForestRegressor with patient features and historical data.
    """
    
    def __init__(self, model_path: str = "consultation_time_model.pkl"):
        self.model_path = model_path
        self.model: Optional[RandomForestRegressor] = None
        self.feature_columns = [
            'age', 'visit_type', 'severity', 'is_emergency', 
            'past_avg_time', 'doctor_experience'
        ]
        
        # Initialize Groq API from environment variable
        self.api_key = os.getenv('GROQ_API_KEY')
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
            
        self.triage_system_instruction = """
You are an advanced medical triage AI system integrated into a smart healthcare scheduling platform.
Your task is to analyze patient symptoms written in natural language and convert them into structured triage data.

Output STRICT JSON ONLY  NO EXTRA TEXT. 
Format:
{
  "severity": integer (1 to 5),
  "is_emergency": boolean,
  "confidence": float (0 to 1),
  "keywords": [list of key medical symptoms],
  "triage_reason": "short explanation"
}

Severity Guidelines:
1 -> very mild (cold, mild headache)
2 -> mild (fever, cough, minor pain)
3 -> moderate (persistent pain, infection, vomiting)
4 -> serious (high fever, severe pain, breathing discomfort)
5 -> critical (life-threatening)

Emergency Rules (VERY IMPORTANT):
Mark is_emergency = true ONLY if symptoms indicate:
- chest pain
- difficulty breathing / shortness of breath
- unconsciousness
- severe bleeding
- stroke symptoms (slurred speech, paralysis)
- seizures
- heart attack signs
Otherwise false.

Behavior Rules:
- Be strict and realistic (avoid overestimating emergencies)
- If symptoms are unclear -> assign moderate severity (3) with lower confidence
- Extract meaningful keywords only (no filler words)
- Keep triage_reason short (1 line max)
- DO NOT explain outside JSON
"""
        
        # Patient history database (simulated in-memory storage)
        # In production, replace with actual database queries
        self.patient_history = {}
        self._initialize_sample_history()
        
    def _initialize_sample_history(self):
        """Initialize sample patient history for demonstration"""
        np.random.seed(42)
        for patient_id in range(1, 101):
            # Generate random historical consultation times
            num_visits = np.random.randint(1, 20)
            past_times = np.random.normal(30, 10, num_visits).clip(10, 90)
            
            self.patient_history[f"P{patient_id:04d}"] = {
                'visits': num_visits,
                'avg_time': float(np.mean(past_times)),
                'last_visit': datetime.now().isoformat(),
                'times': past_times.tolist()
            }
        
    def generate_synthetic_dataset(self, n_samples: int = 5000) -> pd.DataFrame:
        """
        Generate realistic synthetic dataset with healthcare patterns.
        
        Patterns encoded:
        - Higher severity  longer consultation time
        - Emergency cases  significantly longer time
        - First visits  longer than follow-ups
        - Older patients  slightly longer consultations
        - Less experienced doctors  longer times
        - Past average time influences current time
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            DataFrame with features and target variable
        """
        np.random.seed(42)
        
        data = {
            'age': np.random.randint(18, 85, n_samples),
            'visit_type': np.random.choice([0, 1], n_samples, p=[0.3, 0.7]),  # 30% first visit
            'severity': np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.15, 0.30, 0.35, 0.15, 0.05]),
            'is_emergency': np.random.choice([0, 1], n_samples, p=[0.85, 0.15]),  # 15% emergency
            'doctor_experience': np.random.randint(1, 30, n_samples),
        }
        
        # Generate past_avg_time based on realistic patterns
        past_avg_time = []
        for i in range(n_samples):
            if data['visit_type'][i] == 0:  # First visit - no history
                past_avg_time.append(0.0)
            else:  # Follow-up - has history
                # Base time varies by severity
                base_time = 20 + data['severity'][i] * 5
                # Add some random variation
                past_avg_time.append(max(10.0, base_time + np.random.normal(0, 5)))
        
        data['past_avg_time'] = past_avg_time
        
        # Generate target: consultation_time with realistic patterns
        consultation_time = []
        
        for i in range(n_samples):
            # Base time
            time = 20.0
            
            # Age factor (older patients need slightly more time)
            time += (data['age'][i] - 18) * 0.1
            
            # Visit type (first visits take longer)
            if data['visit_type'][i] == 0:
                time += 10.0
            
            # Severity impact (major factor)
            severity_multiplier = {1: 0.8, 2: 1.0, 3: 1.3, 4: 1.6, 5: 2.0}
            time *= severity_multiplier[data['severity'][i]]
            
            # Emergency cases take significantly longer
            if data['is_emergency'][i] == 1:
                time *= 1.8
                time += 15.0
            
            # Doctor experience (less experienced = longer time)
            experience_factor = max(0.7, 1.0 - (data['doctor_experience'][i] / 100))
            time *= experience_factor
            
            # Past average time influence (if available)
            if data['past_avg_time'][i] > 0:
                # Historical pattern has strong influence
                time = 0.6 * time + 0.4 * data['past_avg_time'][i]
            
            # Add realistic noise
            time += np.random.normal(0, 3)
            
            # Ensure minimum and maximum bounds
            time = max(10.0, min(120.0, time))
            
            consultation_time.append(round(time))
        
        data['consultation_time'] = consultation_time
        
        df = pd.DataFrame(data)
        return df
    
    def train_model(self, test_size: float = 0.2, random_state: int = 42) -> Dict:
        """
        Train the RandomForestRegressor model on synthetic data.
        
        Args:
            test_size: Proportion of dataset for testing
            random_state: Random seed for reproducibility
            
        Returns:
            Dictionary containing training metrics
        """
        print(" Generating synthetic dataset...")
        df = self.generate_synthetic_dataset(n_samples=5000)
        
        print(f" Dataset shape: {df.shape}")
        print(f" Target statistics:")
        print(df['consultation_time'].describe())
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['consultation_time']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        print(f"\n Training set size: {len(X_train)}")
        print(f" Test set size: {len(X_test)}")
        
        # Initialize and train model
        print("\n Training RandomForestRegressor...")
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=random_state,
            n_jobs=-1,
            verbose=0
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        print("\n Evaluating model...")
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Calculate metrics
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        
        metrics = {
            'train_mae': round(train_mae, 2),
            'test_mae': round(test_mae, 2),
            'train_rmse': round(train_rmse, 2),
            'test_rmse': round(test_rmse, 2),
            'train_r2': round(train_r2, 4),
            'test_r2': round(test_r2, 4),
            'n_train': len(X_train),
            'n_test': len(X_test)
        }
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n Training completed!")
        print(f"\n Model Performance:")
        print(f"  Train MAE: {metrics['train_mae']} minutes")
        print(f"  Test MAE:  {metrics['test_mae']} minutes")
        print(f"  Train RMSE: {metrics['train_rmse']} minutes")
        print(f"  Test RMSE:  {metrics['test_rmse']} minutes")
        print(f"  Train R:  {metrics['train_r2']}")
        print(f"  Test R:   {metrics['test_r2']}")
        
        print(f"\n Feature Importance:")
        for idx, row in feature_importance.iterrows():
            print(f"  {row['feature']:20s}: {row['importance']:.4f}")
        
        # Save model
        self.save_model()
        
        return metrics
    
    def save_model(self):
        """Save the trained model to disk"""
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        joblib.dump(self.model, self.model_path)
        print(f"\n Model saved to: {self.model_path}")
    
    def load_model(self):
        """Load a trained model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        
        self.model = joblib.load(self.model_path)
        print(f" Model loaded from: {self.model_path}")
    
    def predict_time(self, input_data: Dict) -> Dict:
        """
        Predict consultation time for a patient.
        Flask-ready: accepts dict, returns dict with prediction and metadata.
        
        Args:
            input_data: Dictionary with keys:
                - age: int (18-100)
                - visit_type: int (0=first visit, 1=follow-up)
                - severity: int (1-5)
                - is_emergency: int (0 or 1)
                - past_avg_time: float (minutes, 0 if no history)
                - doctor_experience: int (years)
                
        Returns:
            Dictionary containing:
                - predicted_time: int (minutes)
                - confidence_interval: tuple (min, max)
                - recommendation: str
                - input_features: dict
        """
        if self.model is None:
            # Try to load model if not in memory
            if os.path.exists(self.model_path):
                self.load_model()
            else:
                raise ValueError("Model not trained. Call train_model() first.")
        
        # Validate input
        required_keys = self.feature_columns
        for key in required_keys:
            if key not in input_data:
                raise ValueError(f"Missing required field: {key}")
        
        # Prepare input for prediction
        input_df = pd.DataFrame([input_data])[self.feature_columns]
        
        # Make prediction
        predicted_time = self.model.predict(input_df)[0]
        predicted_time = max(10, min(120, int(round(predicted_time))))
        
        # Calculate confidence interval using tree predictions
        tree_predictions = np.array([
            tree.predict(input_df)[0] 
            for tree in self.model.estimators_
        ])
        
        confidence_lower = max(10, int(np.percentile(tree_predictions, 10)))
        confidence_upper = min(120, int(np.percentile(tree_predictions, 90)))
        
        # Generate recommendation
        recommendation = self._generate_recommendation(input_data, predicted_time)
        
        result = {
            'predicted_time': predicted_time,
            'confidence_interval': {
                'min': confidence_lower,
                'max': confidence_upper
            },
            'recommendation': recommendation,
            'input_features': input_data,
            'timestamp': datetime.now().isoformat()
        }
        
        return result
    
    def analyze_symptoms(self, symptoms_text: str) -> Dict:
        """
        Sends the patient symptoms to the Groq model and returns structured triage JSON.
        """
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set. Medical triage unavailable.")
            
        try:
             chat_completion = self.client.chat.completions.create(
                 messages=[
                     {
                         "role": "system",
                         "content": self.triage_system_instruction,
                     },
                     {
                         "role": "user",
                         "content": symptoms_text,
                     }
                 ],
                 model="llama-3.1-8b-instant",
                 response_format={"type": "json_object"}
             )
             triage_data = json.loads(chat_completion.choices[0].message.content)
             return triage_data
        except Exception as e:
             # Fallback mock data to ensure hackathon demo continues seamlessly
             is_er = "pain" in str(symptoms_text).lower() or "emergency" in str(symptoms_text).lower() or "bleed" in str(symptoms_text).lower()
             return {
                 "severity": 4 if is_er else 2,
                 "is_emergency": is_er,
                 "confidence": 0.8,
                 "keywords": ["fallback", "system", "symptoms"],
                 "triage_reason": "AI Service unavailable. Defaulting to local safety rules."
             }
             
    def predict_from_symptoms(self, input_data: Dict) -> Dict:
        """
        Predict consultation time from unstructured symptoms + demographic patient data.
        
        Args:
            input_data: Dictionary with 'symptoms' (str) and base demographic fields 
                        like 'age', 'visit_type', etc.
        """
        if 'symptoms' not in input_data:
            raise ValueError("Missing required field: symptoms")
            
        # Get AI Triage
        triage_result = self.analyze_symptoms(input_data['symptoms'])
        
        # Combine Triage Data with ML Model inputs
        pred_input = {
            'age': input_data.get('age', 30),
            'visit_type': input_data.get('visit_type', 1),
            'severity': triage_result.get('severity', 3),
            'is_emergency': 1 if triage_result.get('is_emergency') else 0,
            'past_avg_time': input_data.get('past_avg_time', 0.0),
            'doctor_experience': input_data.get('doctor_experience', 10)
        }
        
        # Get ML Time Prediction based on Triage
        prediction = self.predict_time(pred_input)
        
        # Append Triage Results for transparency
        prediction['triage'] = triage_result
        return prediction
    
    def _generate_recommendation(self, input_data: Dict, predicted_time: int) -> str:
        """Generate scheduling recommendation based on prediction"""
        recommendations = []
        
        if input_data['is_emergency'] == 1:
            recommendations.append(" EMERGENCY: Schedule immediately with buffer time")
        
        if input_data['severity'] >= 4:
            recommendations.append(" High severity case - allocate extended time slot")
        
        if input_data['visit_type'] == 0:
            recommendations.append(" First visit - allow extra time for initial assessment")
        
        if predicted_time > 60:
            recommendations.append(" Long consultation expected - schedule in low-traffic period")
        
        if input_data['doctor_experience'] < 5:
            recommendations.append(" Less experienced doctor - add supervision buffer")
        
        if not recommendations:
            recommendations.append(" Standard appointment - follow regular scheduling")
        
        return " | ".join(recommendations)
    
    def get_patient_history(self, patient_id: str) -> Dict:
        """
        Retrieve patient consultation history.
        
        Args:
            patient_id: Unique patient identifier (e.g., "P0001")
            
        Returns:
            Dictionary with patient history including:
                - visits: number of past visits
                - avg_time: average consultation time
                - last_visit: timestamp of last visit
                - times: list of past consultation times
        """
        if patient_id in self.patient_history:
            return {
                'patient_id': patient_id,
                'found': True,
                **self.patient_history[patient_id]
            }
        else:
            return {
                'patient_id': patient_id,
                'found': False,
                'visits': 0,
                'avg_time': 0.0,
                'message': 'No history found - first time patient'
            }
    
    def add_patient_record(self, patient_id: str, consultation_time: float):
        """
        Add a new consultation record for a patient.
        Updates patient history with new consultation time.
        
        Args:
            patient_id: Unique patient identifier
            consultation_time: Actual consultation time in minutes
        """
        if patient_id not in self.patient_history:
            self.patient_history[patient_id] = {
                'visits': 0,
                'avg_time': 0.0,
                'last_visit': None,
                'times': []
            }
        
        history = self.patient_history[patient_id]
        history['times'].append(consultation_time)
        history['visits'] = len(history['times'])
        history['avg_time'] = float(np.mean(history['times']))
        history['last_visit'] = datetime.now().isoformat()
        
        print(f" Added record for {patient_id}: {consultation_time} min (avg: {history['avg_time']:.1f})")


# ============================================================================
# FLASK INTEGRATION FUNCTIONS
# ============================================================================

# Global predictor instance (initialized once)
predictor = None

def initialize_predictor(model_path: str = "consultation_time_model.pkl"):
    """
    Initialize the global predictor instance.
    Call this once when your Flask app starts.
    """
    global predictor
    predictor = HealthcareTimePredictor(model_path=model_path)
    
    # Load existing model or train new one
    if os.path.exists(model_path):
        predictor.load_model()
        print(" Loaded existing model")
    else:
        print(" No existing model found. Training new model...")
        predictor.train_model()
    
    return predictor


def train_model() -> Dict:
    """
    Flask endpoint function: Train the ML model.
    
    Usage in Flask:
        @app.route('/train', methods=['POST'])
        def train():
            metrics = train_model()
            return jsonify(metrics)
    
    Returns:
        Dictionary with training metrics
    """
    global predictor
    if predictor is None:
        predictor = HealthcareTimePredictor()
    
    metrics = predictor.train_model()
    return metrics


def predict_time(input_data: Dict) -> Dict:
    """
    Flask endpoint function: Predict consultation time.
    
    Usage in Flask:
        @app.route('/predict', methods=['POST'])
        def predict():
            data = request.json
            result = predict_time(data)
            return jsonify(result)
    
    Args:
        input_data: Dictionary with patient features
        
    Returns:
        Dictionary with prediction and metadata
    """
    global predictor
    if predictor is None:
        initialize_predictor()
    
    result = predictor.predict_time(input_data)
    return result

def predict_from_symptoms(input_data: Dict) -> Dict:
    """
    Flask endpoint function: Predict consultation time from raw symptoms.
    """
    global predictor
    if predictor is None:
        initialize_predictor()
    
    result = predictor.predict_from_symptoms(input_data)
    return result


def get_patient_history(patient_id: str) -> Dict:
    """
    Flask endpoint function: Get patient consultation history.
    
    Usage in Flask:
        @app.route('/history/<patient_id>', methods=['GET'])
        def history(patient_id):
            result = get_patient_history(patient_id)
            return jsonify(result)
    
    Args:
        patient_id: Patient identifier
        
    Returns:
        Dictionary with patient history
    """
    global predictor
    if predictor is None:
        initialize_predictor()
    
    return predictor.get_patient_history(patient_id)


# ============================================================================
# DEMO & TESTING
# ============================================================================

def demo():
    """
    Demonstration of the ML module functionality.
    Shows training, prediction, and patient history retrieval.
    """
    print("=" * 80)
    print(" SMART HEALTHCARE APPOINTMENT SCHEDULING - ML MODULE DEMO")
    print("=" * 80)
    
    # Initialize predictor
    predictor = HealthcareTimePredictor(model_path="demo_model.pkl")
    
    # Train model
    print("\n" + "=" * 80)
    print("STEP 1: TRAINING MODEL")
    print("=" * 80)
    metrics = predictor.train_model()
    
    # Test predictions
    print("\n" + "=" * 80)
    print("STEP 2: TESTING PREDICTIONS")
    print("=" * 80)
    
    test_cases = [
        {
            'name': 'Emergency High Severity',
            'data': {
                'age': 65,
                'visit_type': 1,
                'severity': 5,
                'is_emergency': 1,
                'past_avg_time': 45.0,
                'doctor_experience': 15
            }
        },
        {
            'name': 'First Visit Moderate',
            'data': {
                'age': 35,
                'visit_type': 0,
                'severity': 3,
                'is_emergency': 0,
                'past_avg_time': 0.0,
                'doctor_experience': 8
            }
        },
        {
            'name': 'Follow-up Low Severity',
            'data': {
                'age': 42,
                'visit_type': 1,
                'severity': 2,
                'is_emergency': 0,
                'past_avg_time': 25.0,
                'doctor_experience': 20
            }
        },
        {
            'name': 'Young Patient Emergency',
            'data': {
                'age': 28,
                'visit_type': 1,
                'severity': 4,
                'is_emergency': 1,
                'past_avg_time': 30.0,
                'doctor_experience': 5
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        result = predictor.predict_time(test_case['data'])
        
        print(f"Input Features:")
        for key, value in test_case['data'].items():
            print(f"  {key:20s}: {value}")
        
        print(f"\nPrediction:")
        print(f"  Predicted Time: {result['predicted_time']} minutes")
        print(f"  Confidence Range: {result['confidence_interval']['min']}-{result['confidence_interval']['max']} min")
        print(f"  Recommendation: {result['recommendation']}")
    
    # Test patient history
    print("\n" + "=" * 80)
    print("STEP 3: PATIENT HISTORY RETRIEVAL")
    print("=" * 80)
    
    patient_ids = ["P0001", "P0042", "P9999"]
    for patient_id in patient_ids:
        print(f"\n--- Patient: {patient_id} ---")
        history = predictor.get_patient_history(patient_id)
        print(json.dumps(history, indent=2))
    
    print("\n" + "=" * 80)
    print("STEP 4: AI SYMPTOM TRIAGE & PREDICTION DEMO")
    print("=" * 80)
    
    if predictor.api_key:
        demo_symptoms = "I have severe chest pain and can't breathe properly. It started 10 minutes ago."
        print(f"\nAnalyzing Symptoms: '{demo_symptoms}'")
        symptom_data = {
            "symptoms": demo_symptoms,
            "age": 55,
            "visit_type": 1,
            "past_avg_time": 25.0,
            "doctor_experience": 12
        }
        try:
            ai_result = predictor.predict_from_symptoms(symptom_data)
            print("\nAI Triage Extracted Information:")
            print(json.dumps(ai_result['triage'], indent=2))
            print(f"\nML Predicted Time based on Triage: {ai_result['predicted_time']} minutes")
            print(f"Recommendation: {ai_result['recommendation']}")
        except Exception as e:
            print(f"API Error during demo: {e}")
    else:
        print("\nSkipping AI Triage demo. Please set GEMINI_API_KEY environment variable.")

    print("\n" + "=" * 80)
    print(" DEMO COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print(f"\n Model saved to: {predictor.model_path}")
    print("\n Flask Integration:")
    print("  1. Call initialize_predictor() when app starts")
    print("  2. Use train_model(), predict_time(), predict_from_symptoms(), get_patient_history() in routes")
    print("\n" + "=" * 80)


if __name__ == "__main__":
    demo()