# Llama Vision OCR App

This project leverages Llama3.2-Vision capabilities and Streamlit to create a 100% locally running computer vision app that can perform OCR and extract structured text from images.

## Features
- Extract text from images using powerful vision models
- Process images locally without sending data to external servers
- Simple, intuitive interface with Streamlit
- Support for multiple vision models with Llama3.2-Vision recommended

## Installation and Setup

### 1. Setup Ollama
```bash
# For Linux
curl -fsSL https://ollama.com/install.sh | sh
# For Windows - download from https://ollama.com/download

# Pull the recommended vision model
ollama pull llama3.2-vision
```

### 2. Install Python Dependencies
Ensure you have Python 3.8 or later installed.
```bash
pip install -r requirements.txt

```

### 3. Run the App
```bash
streamlit run app.py
or for api key
streamlit run app_api.py
```

## Usage
1. Start Ollama with the vision model: `ollama run llama3.2-vision`
2. Launch the app with `streamlit run app.py` or `streamlit run app_api.py`
3. Upload your image
4. Adjust the image width setting if needed
5. Click "Extract Text" to process the image
6. View the extracted text in markdown format

---
