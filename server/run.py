from flask import Flask, request, render_template, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_cors import CORS
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import spacy
import config
import logging
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

# Set up logging
logging.basicConfig(filename='app.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)
app.secret_key = 'your-secret-key'  # Change this to a secure random key

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="vidya",  
    database="insurechecker"
)
cursor = db.cursor()

# User class
class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    cursor.execute("SELECT id, username, password FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if user:
        return User(user[0])
    return None

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if not request.form.get('username') or not request.form.get('password'):
            flash('Please provide both username and password')
            return redirect(url_for('login'))
        username = request.form['username']
        password = request.form['password']
        cursor.execute("SELECT id, password FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if user and check_password_hash(user[1], password):
            user_obj = User(user[0])
            login_user(user_obj)
            return redirect(url_for('upload_page'))
        flash('Invalid credentials')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        try:
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
            db.commit()
            flash('Registration successful! Please log in.')
            return redirect(url_for('login'))
        except mysql.connector.IntegrityError:
            flash('Username already exists')
            db.rollback()
    return render_template('register.html')

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            logging.error('No file part in request')
            return 'No file part', 400
        file = request.files['file']
        if file.filename == '':
            logging.error('No selected file')
            return 'No selected file', 400
        if file:
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                file.save(file_path)
                logging.info(f'File saved: {filename}')

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
                doc = nlp(text.lower())
                age = None
                for ent in doc.ents:
                    if ent.label_ == 'AGE' or 'years' in ent.text.lower():
                        age = ent.text
                        break

                condition_found = any(condition in text.lower() for condition in config.ELIGIBILITY_RULES['approved_conditions'])
                eligibility = 'Eligible' if (age and int(age.split()[0]) >= config.ELIGIBILITY_RULES['min_age'] and condition_found) else 'Not Eligible'
                result = f'Extracted text: {text}\nEligibility: {eligibility}'
                logging.info(f'Processed {filename} - Eligibility: {eligibility}')

                # Save to database
                cursor.execute("INSERT INTO uploads (filename, user_id) VALUES (%s, %s)", (filename, current_user.id))
                upload_id = cursor.lastrowid
                cursor.execute("INSERT INTO results (upload_id, extracted_text, eligibility) VALUES (%s, %s, %s)", (upload_id, text, eligibility))
                db.commit()

                return result, 200
            except Exception as e:
                logging.error(f'Error processing {filename}: {str(e)}')
                db.rollback()
                return f'Error extracting text: {str(e)}', 500

    return 'Method not allowed', 405

@app.route('/upload_page')
@login_required
def upload_page():
    return '''
    <h1>Upload File</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file">
        <input type="submit" value="Upload">
    </form>
    <a href="/logout">Logout</a>
    '''

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)