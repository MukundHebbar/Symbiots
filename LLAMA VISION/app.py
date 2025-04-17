import streamlit as st
from PIL import Image
import io
import base64
import requests
import tempfile
import os

# Page configuration
st.set_page_config(
    page_title="Llama Vision OCR",
    page_icon="🔎",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title and description in main area
st.markdown("# 🦙 Llama Vision OCR")

# Add clear button to top right
col1, col2 = st.columns([6,1])
with col2:
    if st.button("Clear 🗑️"):
        if 'ocr_result' in st.session_state:
            del st.session_state['ocr_result']
        st.rerun()

st.markdown('<p style="margin-top: -20px;">Extract structured text from images using Llama Vision!</p>', unsafe_allow_html=True)
st.markdown("---")

# Move upload controls to sidebar
with st.sidebar:
    st.header("Upload Image")
    uploaded_file = st.file_uploader("Choose an image...", type=['png', 'jpg', 'jpeg'])
    available_models = []
    try:
        models_response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if models_response.status_code == 200:
            models_list = models_response.json()
            available_models = [model['name'] for model in models_list.get('models', [])]
            
            # Filter to only vision models
            vision_models = [model for model in available_models 
                           if any(vision_term in model.lower() 
                                for vision_term in ['vision', 'visual', 'llava', 'image'])]
            
            if "llama3.2-vision" in available_models:
                # Make sure llama3.2-vision is first if available
                vision_models = ["llama3.2-vision"] + [m for m in vision_models if m != "llama3.2-vision"]
            
            model_options = vision_models if vision_models else ["llama3.2-vision"]
    except:
        # Default fallback
        model_options = ["llama3.2-vision"]
    
    # Set default to llama3.2-vision if available
    default_index = 0
    if "llama3.2-vision" in model_options:
        default_index = model_options.index("llama3.2-vision")
    
    selected_model = st.selectbox(
        "Select vision model:", 
        model_options,
        index=default_index
    )
    
    st.info(f"Using vision model: `{selected_model}`")
    
    if uploaded_file is not None:
        # Display the uploaded image
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded Image")
        
        # Resize option for large images
        max_width = st.slider("Max image width (px)", 500, 2000, 1000)
        
        if st.button("Extract Text 🔍", type="primary"):
            with st.spinner("Processing image..."):
                try:
                    # Optimize image size
                    img = Image.open(uploaded_file)
                    width, height = img.size
                    
                    # Resize if needed
                    if width > max_width:
                        ratio = max_width / width
                        new_height = int(height * ratio)
                        img = img.resize((max_width, new_height), Image.LANCZOS)
                    
                    # Convert to bytes
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='JPEG', quality=85)
                    img_data = img_byte_arr.getvalue()
                    
                    # Convert image to base64
                    base64_image = base64.b64encode(img_data).decode('utf-8')
                    
                    # Use the Ollama API directly with image
                    api_response = requests.post(
                        'http://localhost:11434/api/generate',
                        json={
                            "model": selected_model,
                            "prompt": "Examine this image and extract all visible text in markdown format. Be comprehensive and include all text you can see.",
                            "images": [base64_image],
                            "stream": False
                        },
                        timeout=120  # Longer timeout for image processing
                    )
                    
                    if api_response.status_code == 200:
                        result = api_response.json()
                        if 'response' in result:
                            st.session_state['ocr_result'] = result['response']
                            st.success("Text extracted successfully!")
                        else:
                            st.error("No text was detected in the image or an error occurred.")
                    else:
                        st.error(f"Request failed. Please ensure Ollama is running with {selected_model} model.")
                        
                except Exception as e:
                    st.error(f"Failed to process image: {str(e)}")
                    st.info(f"Make sure Ollama is running with: `ollama run {selected_model}`")

# Main content area for results
if 'ocr_result' in st.session_state:
    st.markdown("## Extracted Text")
    st.markdown(st.session_state['ocr_result'])
else:
    st.info("Upload an image and click 'Extract Text' to see the results here.")

# Footer
st.markdown("---")


