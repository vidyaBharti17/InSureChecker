from flask import Flask, request
from flask_cors import CORS
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    if file:
        filename = file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Extract text using OCR
        try:
            if filename.lower().endswith('.pdf'):
                # Convert PDF to images
                images = convert_from_path(file_path)
                text = ''
                for img in images:
                    text += pytesseract.image_to_string(img)
            else:
                # Assume it’s an image
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)

            return 'File uploaded and text extracted: ' + text, 200
        except Exception as e:
            return 'Error extracting text: ' + str(e), 500

    return 'Error uploading file', 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
