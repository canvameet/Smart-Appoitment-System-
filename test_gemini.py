import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

print("Available models:")
try:
    with open("output_utf8.txt", "w", encoding="utf-8") as f:
        models = genai.list_models()
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                f.write(m.name + "\n")
except Exception as e:
    print(f"Error: {e}")
