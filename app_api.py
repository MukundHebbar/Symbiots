import streamlit as st
from PIL import Image
import io
import base64
from openai import OpenAI
import serial
import time
import sys
import cv2
import requests
# Force stdout to be unbuffered so debug prints appear immediately
sys.stdout.reconfigure(line_buffering=True)

# Print a startup message to check if debug printing works
print("[DEBUG] Starting Llama Vision OCR app with servo control")

# Page configuration
st.set_page_config(
    page_title="Llama Vision OCR",
    page_icon="🔎",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Create a placeholder for serial connection
if 'serial_connected' not in st.session_state:
    st.session_state.serial_connected = False
    st.session_state.ser = None

# Function to connect to serial port
def connect_serial():
    try:
        # If there's already a connection, close it first
        if st.session_state.ser is not None:
            try:
                st.session_state.ser.close()
                time.sleep(1)  # Give the OS time to release the port
            except:
                pass
            
        # Try to open the port
        st.session_state.ser = serial.Serial('/dev/cu.usbserial-10', 115200, timeout=1)
        st.session_state.serial_connected = True
        st.sidebar.success("Connected to ESP32 on usb-10")
        return True
    except Exception as e:
        st.session_state.serial_connected = False
        st.sidebar.error(f"Failed to connect to ESP32: {str(e)}")
        return False

# Try to connect on app startup
connect_serial()

# Function to control servo based on classification
def control_servo(category):
    print(f"[DEBUG] Received classification: {category}")
    
    # Normalize the category by removing punctuation and converting to title case
    normalized_category = category.rstrip('.,:;!?').strip()
    print(f"[DEBUG] Normalized category: '{normalized_category}'")

    if not st.session_state.serial_connected:
        # Log that we would send a command but can't connect
        if normalized_category == "Flammable":
            print("[DEBUG] Would send command '1' to ESP32 - Flammable servo gate (but ESP32 not connected)")
        elif normalized_category == "Cold storage":
            print("[DEBUG] Would send command '2' to ESP32 - Cold storage servo gate (but ESP32 not connected)")
        elif normalized_category == "Corrosive":
            print("[DEBUG] Would send command '3' to ESP32 - Corrosive servo gate (but ESP32 not connected)")
        elif normalized_category == "Other chemicals":
            print("[DEBUG] Would send command '4' to ESP32 - Other chemicals servo gate (but ESP32 not connected)")
        else:
            print(f"[DEBUG] Unknown category: {category} (and ESP32 not connected)")

        # Try to reconnect
        if not connect_serial():
            st.warning("ESP32 not connected. Cannot control servo.")
            return
    
    try:
        # Send different commands based on category
        if normalized_category == "Flammable":
            st.session_state.ser.write(b'1')  # Open servo 1
            print("[DEBUG] Sent command '1' to ESP32 - Opening Flammable servo gate")
            st.success(f"Servo gate 1 opened for {normalized_category}")
        elif normalized_category == "Cold storage":
            st.session_state.ser.write(b'2')  # Open servo 2
            print("[DEBUG] Sent command '2' to ESP32 - Opening Cold storage servo gate")
            st.success(f"Servo gate 2 opened for {normalized_category}")
        elif normalized_category == "Corrosive":
            st.session_state.ser.write(b'3')  # Open servo 3
            print("[DEBUG] Sent command '3' to ESP32 - Opening Corrosive servo gate")
            st.success(f"Servo gate 3 opened for {normalized_category}")
        elif normalized_category == "Other chemicals":
            st.session_state.ser.write(b'4')  # Open servo 4
            print("[DEBUG] Sent command '4' to ESP32 - Opening Other chemicals servo gate")
            st.success(f"Servo gate 4 opened for {normalized_category}")
        else:
            print(f"[DEBUG] No command sent - Unknown category: {category}")
            return  # If no valid category, don't do anything
        
        # Close the gate after 3 seconds
        time.sleep(5)
        st.session_state.ser.write(b'0')  # Close all servo gates
        print("[DEBUG] Sent command '0' to ESP32 - Closing all servo gates")
        st.success("All servo gates closed after 5 seconds")
        
    except Exception as e:
        st.error(f"Failed to control servo: {str(e)}")
        print(f"[DEBUG] Error controlling servo: {str(e)}")
        # Try to reconnect if there's an error
        st.session_state.serial_connected = False
        connect_serial()

# Initialize OpenAI client with Inference.net
api_key = "inference-c3924878270a48a1954b7342c286c708"  # Better to store this in environment variable
client = OpenAI(
    base_url="https://api.inference.net/v1",
    api_key=api_key,
)

# Title and description in main area
st.markdown("# 🦙 Llama Vision OCR")

# Add clear button to top right
col1, col2 = st.columns([6,1])
with col2:
    if st.button("Clear 🗑️"):
        if 'ocr_result' in st.session_state:
            del st.session_state['ocr_result']
        if 'classification_result' in st.session_state:
            del st.session_state['classification_result']
        if 'camera_image' in st.session_state:
            del st.session_state['camera_image']
        st.rerun()

st.markdown('<p style="margin-top: -20px;">Extract text from images and classify chemicals into single categories!</p>', unsafe_allow_html=True)
st.markdown("---")



# filepath: /home/mukund-hebbar/projectIot/app_api.py
# ...existing code...

BASE_API_URL = "http://192.168.YOUR.IP:PORT" # <-- Replace with your actual base server URL (e.g., http://192.168.1.100:5000)

def send_classification_to_api(classification, extracted_text=None):
    """Constructs the endpoint using classification and sends the extracted_text (or classification) as the name."""
    if not BASE_API_URL or BASE_API_URL == "http://192.168.YOUR.IP:PORT": # Basic check if URL is set
        print("[DEBUG] Base API URL not configured. Skipping POST request.")
        return

    # Construct the full endpoint URL dynamically using the classification category
    endpoint_url = f"{BASE_API_URL}/api/items/create/{classification}"
    print(f"[DEBUG] Constructed API endpoint: {endpoint_url}")

    # Prepare the payload: Use extracted_text for 'name' if available, otherwise use classification
    payload_name = extracted_text if extracted_text else classification
    payload = {"name": payload_name}
    headers = {"Content-Type": "application/json"}

    print(f"[DEBUG] Sending POST to {endpoint_url} with payload: {payload}") # Log the payload being sent

    try:
        response = requests.post(endpoint_url, json=payload, headers=headers, timeout=10) # 10 second timeout
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        print(f"[DEBUG] Successfully sent payload to API endpoint {endpoint_url}. Status: {response.status_code}")
        # Optionally show success in the UI
        # st.toast(f"Result '{classification}' sent to server.", icon="✅")
    except requests.exceptions.RequestException as e:
        print(f"[DEBUG] Failed to send classification to API endpoint {endpoint_url}: {e}")
        # Optionally show an error in the UI
        st.error(f"Failed to send result to server: {e}")



# Function to classify chemicals in the extracted text
def classify_chemicals(text):
    print(f"[DEBUG] Classifying chemicals from text: '{text[:100]}...'")
    try:
        classification_messages = [
            {
                "role": "system",
                "content": """You are a chemical classification expert. Analyze the text and identify any chemicals mentioned. 
                Determine which SINGLE category the chemical(s) mentioned in the text belong to:
                - Flammable
                - Cold storage
                - Corrosive
                - Other chemicals
                
                Respond with ONLY ONE of the above category names. Just the category name, no additional text or explanations.
                If multiple chemicals are mentioned that belong to different categories, choose the most hazardous or predominant one.
                If no chemicals are mentioned, respond with "None"."""
            },
            {
                "role": "user",
                "content": f"What single category do the chemicals in this text belong to?\n\n{text}"
            }
        ]
        
        # Set a shorter timeout and use lower temperature for more focused responses
        classification_response = client.chat.completions.create(
            model="meta-llama/llama-3.2-11b-instruct/fp-16",
            messages=classification_messages,
            temperature=0.1,  # Lower temperature for more focused/deterministic responses
            max_tokens=10,    # We only need a few tokens for the category name
        )
        
        # Clean up the result - remove punctuation and extra whitespace
        raw_result = classification_response.choices[0].message.content.strip()
        result = raw_result.rstrip('.,:;!?').strip()
        print(f"[DEBUG] Classification result from text - Raw: '{raw_result}', Cleaned: '{result}'")
        
        # Control servo based on the classification result
        if result not in ["None"]:
            control_servo(result)
            send_classification_to_api(result, text)
        return result
    except Exception as e:
        print(f"[DEBUG] Error in text classification: {str(e)}")
        return f"Error: {str(e)}"

# Function to directly classify chemicals from an image
def classify_chemicals_from_image(data_uri):
    print("[DEBUG] Classifying chemicals directly from image")
    try:
        # Direct classification messages
        classification_messages = [
            {
                "role": "system",
                "content": """You are a chemical classification expert. Look at the image and identify any chemicals shown or mentioned.
                Classify the chemical(s) shown in the image into EXACTLY ONE of these categories:
                - Flammable
                - Cold storage
                - Corrosive
                - Other chemicals
                
                Respond with ONLY ONE of the above category names. Just the category name, no additional text or explanations.
                If no chemicals are identifiable, respond with "None"."""
            },
            {
                "role": "user", 
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri}
                    },
                    {
                        "type": "text",
                        "text": "What single category of chemical is shown in this image? Respond with only: Flammable, Cold storage, Corrosive, or Other chemicals."
                    },
                ]
            }
        ]
        
        # Use direct classification with optimized parameters
        classification_response = client.chat.completions.create(
            model="meta-llama/llama-3.2-11b-instruct/fp-16",
            messages=classification_messages,
            temperature=0.1,  # Lower temperature for more focused/deterministic responses
            max_tokens=10,    # We only need a few tokens for the category name
        )
        
        # Clean up the result - remove punctuation and extra whitespace
        raw_result = classification_response.choices[0].message.content.strip()
        result = raw_result.rstrip('.,:;!?').strip()
        print(f"[DEBUG] Classification result from image - Raw: '{raw_result}', Cleaned: '{result}'")
        
        # Control servo based on the classification result
        if result not in ["None"]:
            control_servo(result)
            send_classification_to_api(result) 
        
        return result
    except Exception as e:
        print(f"[DEBUG] Error in image classification: {str(e)}")
        return f"Error: {str(e)}"

def capture_image():
    try:
        # Initialize camera
        cap = cv2.VideoCapture(0)
        time.sleep(0.3)
        
        if not cap.isOpened():
            st.error("Could not open camera. Please check if it's connected and try again.")
            return None
        
        # Capture frame-by-frame
        ret, frame = cap.read()
        
        if not ret:
            st.error("Failed to capture image from camera.")
            return None
        
        # Convert the image from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)
        
        # Release the camera
        cap.release()
        
        return pil_image
    except Exception as e:
        st.error(f"Error capturing image: {str(e)}")
        return None

# Move upload controls to sidebar
with st.sidebar:
    st.header("Image Source")
    
    # Add a manual reconnect button for the serial connection
    if st.button("Reconnect to ESP32"):
        connect_serial()
    
    # Add test buttons to simulate classifications without uploading an image
    st.markdown("### Test Classification")
    test_col1, test_col2 = st.columns(2)
    with test_col1:
        if st.button("Test Flammable"):
            print("[DEBUG] Test button pressed: Flammable")
            st.session_state['classification_result'] = "Flammable"
            control_servo("Flammable")
            st.rerun()
        if st.button("Test Corrosive"):
            print("[DEBUG] Test button pressed: Corrosive")
            st.session_state['classification_result'] = "Corrosive"
            control_servo("Corrosive")
            st.rerun()
    with test_col2:
        if st.button("Test Cold storage"):
            print("[DEBUG] Test button pressed: Cold storage")
            st.session_state['classification_result'] = "Cold storage"
            control_servo("Cold storage")
            st.rerun()
        if st.button("Test Other chemicals"):
            print("[DEBUG] Test button pressed: Other chemicals")
            st.session_state['classification_result'] = "Other chemicals"
            control_servo("Other chemicals")
            st.rerun()
    
    # Image source selection
    image_source = st.radio(
        "Select image source:",
        ["Upload Image", "Take Photo"],
        index=0
    )
    
    if image_source == "Upload Image":
        picture = st.file_uploader("Choose an image...", type=['png', 'jpg', 'jpeg', 'webp', 'gif'])
    else:
        picture = st.camera_input("Take a photo")
        # if True:
        #     pil_image = capture_image()
        #     st.image(pil_image, caption="Captured Photo")
        #     st.success("Done!")
        
    # Since we're using the Inference.net API, we only have one model option
    selected_model = "meta-llama/llama-3.2-11b-instruct/fp-16"
    
    # Add processing mode selection
    processing_mode = st.radio(
        "Processing Mode:",
        ["Fast (Direct Classification)", "Detailed (Extract Text First)"],
        index=0
    )
    
    st.info(f"Using vision model: `{selected_model}`")
    
    # Add max width slider
    max_width = st.slider("Max image width (px)", 500, 2000, 1000)
    
    # Process button for both uploaded and captured images
    process_button = st.button("Classify Chemicals 🔍", type="primary")
    
    if process_button:
        # Determine which image to process
        img_to_process = None
        if picture is not None:
            img_to_process = Image.open(picture)
 
        
        if img_to_process is not None:
            with st.spinner("Processing image..."):
                print("[DEBUG] Starting image processing for classification")
                try:
                    # Optimize image size
                    img = img_to_process
                    width, height = img.size
                    
                    # Resize if needed - use BICUBIC for better speed/quality tradeoff
                    if width > max_width:
                        ratio = max_width / width
                        new_height = int(height * ratio)
                        img = img.resize((max_width, new_height), Image.BICUBIC)
                    
                    # Further optimize - reduce to a reasonable size if still large
                    if width * height > 1000000:  # If image is still large (>1MP)
                        # Reduce to 512px on the longest side while maintaining aspect ratio
                        long_side = max(img.size)
                        if long_side > 512:
                            ratio = 512 / long_side
                            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                            img = img.resize(new_size, Image.BICUBIC)
                    
                    # Convert to bytes with higher compression for faster transfer
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='JPEG', quality=75)  # Lower quality for faster processing
                    img_data = img_byte_arr.getvalue()
                    
                    # Convert image to base64 and create data URI
                    base64_image = base64.b64encode(img_data).decode('utf-8')
                    data_uri = f"data:image/jpeg;base64,{base64_image}"
                    
                    if processing_mode == "Fast (Direct Classification)":
                        # Direct classification from image - faster approach
                        with st.spinner("Classifying chemical directly from image..."):
                            classification_result = classify_chemicals_from_image(data_uri)
                            st.session_state['classification_result'] = classification_result
                            
                            # We don't have extracted text in this mode
                            if 'ocr_result' in st.session_state:
                                del st.session_state['ocr_result']
                                
                            st.success("Chemical classification completed!")
                    else:
                        # Original approach - extract text first, then classify
                        # Create messages for the OCR API request - streamlined prompt
                        messages = [
                            {
                                "role": "system",
                                "content": "Extract all visible text from images concisely. Focus on chemical names and formulas."
                            },
                            {
                                "role": "user", 
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": data_uri}
                                    },
                                    {
                                        "type": "text",
                                        "text": "Extract all visible text from this image, focusing on chemical names and formulas."
                                    },
                                ]
                            }
                        ]
                        
                        # Use the Inference.net API with OpenAI SDK for OCR - optimize parameters
                        response = client.chat.completions.create(
                            model=selected_model,
                            messages=messages,
                            temperature=0.3,  # Lower temperature for more focused/deterministic responses
                        )
                        
                        if response:
                            extracted_text = response.choices[0].message.content
                            st.session_state['ocr_result'] = extracted_text
                            st.success("Text extracted successfully!")
                            
                            # Now classify any chemicals in the extracted text
                            with st.spinner("Determining chemical category..."):
                                classification_result = classify_chemicals(extracted_text)
                                st.session_state['classification_result'] = classification_result
                                st.success("Chemical classification completed!")
                        else:
                            st.error("No text was detected in the image or an error occurred.")
                        
                except Exception as e:
                    st.error(f"Failed to process image: {str(e)}")
                    st.info("Check that the API key is valid and the service is working.")
        else:
            st.warning("Please upload an image or capture a photo first.")

# Main content area for results
col1, col2 = st.columns(2)

with col1:
    st.markdown("## Extracted Text")
    if 'ocr_result' in st.session_state:
        st.markdown(st.session_state['ocr_result'])
    else:
        if processing_mode == "Fast (Direct Classification)":
            st.info("Text extraction skipped in fast mode to improve speed.")
        else:
            st.info("Upload an image and click 'Classify Chemicals' to see the extracted text.")

with col2:
    st.markdown("## Chemical Classification")
    if 'classification_result' in st.session_state:
        result = st.session_state['classification_result']
        # Display the result in a larger, more prominent way
        st.markdown(f"""
        <div style="padding: 20px; border-radius: 10px; background-color: #f0f2f6; text-align: center;">
            <h1 style="color: #0066cc; margin: 0;">{result}</h1>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.info("The chemical category will appear here after processing.")

# Clean up serial connection when app is stopped
def cleanup():
    if st.session_state.serial_connected and st.session_state.ser is not None:
        try:
            st.session_state.ser.close()
            print("Serial connection closed")
        except:
            pass

# Register the cleanup function to be called when the app exits
import atexit
atexit.register(cleanup)

# Footer
st.markdown("---")
