from flask import Flask, request
from flask_cors import CORS
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import spacy

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

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

        try:
            if filename.lower().endswith('.pdf'):
                images = convert_from_path(file_path)
                text = ''
                for i, img in enumerate(images):
                    img.save(f'uploads/page_{i}.jpg', 'JPEG')
                    text += pytesseract.image_to_string(img)
            else:
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)

            # Process text with spaCy
            doc = nlp(text)
            age = None
            for ent in doc.ents:
                if ent.label_ == 'AGE' or 'years' in ent.text.lower():
                    age = ent.text
                    break

            approved_conditions = ['diabetes', 'hypertension']
            doc = nlp(text.lower())
            condition_found = any(condition in text.lower() for condition in approved_conditions)
            eligibility = 'Eligible' if (age and int(age.split()[0]) >= 18 and condition_found) else 'Not Eligible'
            result = f'Extracted text: {text}\nEligibility: {eligibility}'


            return result, 200
        except Exception as e:
            return f'Error extracting text: {str(e)}', 500

    return 'Error uploading file', 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
