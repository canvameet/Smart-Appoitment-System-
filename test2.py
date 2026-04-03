import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel(model_name="gemini-2.0-flash")

try:
    response = model.generate_content("hello")
    print("SUCCESS", response.text)
except Exception as e:
    print("ERROR", str(e))
