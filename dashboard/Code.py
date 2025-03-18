import pytesseract
from PIL import Image
import requests
import json

url = "http://localhost:11434/api/chat"

# Set the path to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'

# Open the image
image_path = 'image_1024.jpeg'
img = Image.open(image_path)

# Perform OCR
text = pytesseract.image_to_string(img)

# Print the extracted text
print(text)

content ="Classify the following chemical as one of the categories: Flammable, Corrosive, or Requires Cold Storage. Output only the primary name of the chemical and its category. Example format: Chemical Name - Category, Chemical: " + text
payload = {
    "model": "gemma2", 
    "messages": [{"role": "user", "content": content}]
}
response = requests.post(url, json=payload, stream=True)
if response.status_code == 200:
    print("Streaming response from Ollama:")
    for line in response.iter_lines(decode_unicode=True):
        if line:  
            try:
                json_data = json.loads(line)
                if "message" in json_data and "content" in json_data["message"]:
                    print(json_data["message"]["content"], end="")
            except json.JSONDecodeError:
                print(f"\nFailed to parse line: {line}")
    print() 
else:
    print(f"Error: {response.status_code}")
    print(response.text)