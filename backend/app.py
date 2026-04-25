from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Manually load .env.development if it exists (for local development)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '..', '.env.development')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key not in os.environ:
                    os.environ[key] = value.strip('"\'')

app = Flask(__name__)
CORS(app, origins=[
    "https://healthtrace.me",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
], supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, '..', 'db.json')
DB_TEMPLATE = os.path.join(BASE_DIR, '..', 'db.template.json')

# Auto-create db.json from template if it doesn't exist (e.g. first deploy on Render)
if not os.path.exists(DB_FILE):
    if os.path.exists(DB_TEMPLATE):
        import shutil
        shutil.copy2(DB_TEMPLATE, DB_FILE)
        print(f"Initialized db.json from template")
    else:
        # Fallback: create a minimal db
        with open(DB_FILE, 'w') as f:
            json.dump({"users": [], "patients": [], "entities": {}}, f, indent=2)
        print(f"Created empty db.json")

def read_db():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def write_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def generate_id():
    """Always generate a random string ID — safe for all entity types."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))

def get_list(db, entity):
    """Return the list for an entity, checking both top-level and nested."""
    if entity in db.get('entities', {}):
        return db['entities'][entity], 'nested'
    elif entity in db:
        return db[entity], 'top'
    return None, None

@app.route('/proxy/transcribe', methods=['POST'])
def transcribe_audio():
    api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('VITE_OPENAI_API_KEY')
    if not api_key:
        return jsonify({"error": "OpenAI API Key not configured on server"}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files['file']
    
    try:
        # Prepare the request to OpenAI
        files = {
            'file': (audio_file.filename, audio_file.read(), audio_file.content_type)
        }
        data = {
            'model': request.form.get('model', 'whisper-1')
        }
        headers = {
            'Authorization': f'Bearer {api_key}'
        }

        response = requests.post(
            'https://api.openai.com/v1/audio/transcriptions',
            headers=headers,
            files=files,
            data=data
        )
        
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/proxy/chat', methods=['POST'])
def proxy_chat():
    model = request.json.get('model', '').lower()
    
    if 'mistral' in model:
        api_key = os.environ.get('MISTRAL_DATA_ANALYZER_KEY')
        url = 'https://api.mistral.ai/v1/chat/completions'
        if not api_key:
            return jsonify({"error": "Mistral API Key not configured on server"}), 500
    else:
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('VITE_OPENAI_API_KEY')
        url = 'https://api.openai.com/v1/chat/completions'
        if not api_key:
            return jsonify({"error": "OpenAI API Key not configured on server"}), 500

    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        response = requests.post(url, headers=headers, json=request.json)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "HealthTrace API is running"}), 200

@app.route('/<entity>', methods=['GET'])
def get_entities(entity):
    db = read_db()
    data, location = get_list(db, entity)

    if data is None:
        return jsonify([])  # Return empty list instead of 404 for unknown entities

    query_params = request.args
    if not query_params:
        return jsonify(data)

    filtered_data = []
    for item in data:
        # Case-insensitive comparison for string representations (handles booleans like True vs 'true')
        match = all(str(item.get(key)).lower() == str(value).lower() for key, value in query_params.items())
        if match:
            filtered_data.append(item)

    return jsonify(filtered_data)

@app.route('/<entity>/<item_id>', methods=['GET'])
def get_entity(entity, item_id):
    db = read_db()
    data, _ = get_list(db, entity)

    if data is None:
        return jsonify({'error': 'Entity not found'}), 404

    for item in data:
        if str(item.get('id')) == item_id:
            return jsonify(item)

    return jsonify({'error': 'Not found'}), 404

@app.route('/<entity>', methods=['POST'])
def create_entity(entity):
    db = read_db()
    new_item = request.json

    if new_item is None:
        return jsonify({'error': 'Request body must be JSON'}), 400

    # Use provided ID if available, otherwise generate a new one
    if 'id' not in new_item:
        new_item['id'] = generate_id()

    if entity in db.get('entities', {}):
        db['entities'][entity].append(new_item)
    elif entity in db:
        db[entity].append(new_item)
    else:
        # Auto-create the collection if it doesn't exist yet
        db[entity] = [new_item]

    write_db(db)
    return jsonify(new_item), 201

@app.route('/<entity>/<item_id>', methods=['PUT', 'PATCH'])
def update_entity(entity, item_id):
    db = read_db()
    updates = request.json

    if updates is None:
        return jsonify({'error': 'Request body must be JSON'}), 400

    data, location = get_list(db, entity)

    if data is None:
        return jsonify({'error': f"Entity '{entity}' not found"}), 404

    for i, item in enumerate(data):
        if str(item.get('id')) == item_id:
            item.update(updates)
            data[i] = item
            write_db(db)
            return jsonify(item)

    return jsonify({'error': 'Not found'}), 404

@app.route('/<entity>/<item_id>', methods=['DELETE'])
def delete_entity(entity, item_id):
    db = read_db()
    data, location = get_list(db, entity)

    if data is None:
        return jsonify({'error': f"Entity '{entity}' not found"}), 404

    original_len = len(data)
    new_list = [item for item in data if str(item.get('id')) != item_id]

    if len(new_list) < original_len:
        if location == 'nested':
            db['entities'][entity] = new_list
        else:
            db[entity] = new_list
        write_db(db)
        return '', 204

    return jsonify({'error': 'Not found'}), 404

@app.route('/login', methods=['POST'])
def login():
    db = read_db()
    credentials = request.json
    email = credentials.get('email')
    password = credentials.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    for user in db.get('users', []):
        if user.get('email') == email and user.get('password') == password:
            return jsonify(user)

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/send-feedback', methods=['POST'])
def send_feedback():
    data = request.json
    name = data.get('name', 'Anonymous')
    comment = data.get('comment', '')
    target_email = data.get('target_email', 'suvinbusiness@gmail.com')

    # Environment variables for SMTP
    # In production (Render), set these in Dashboard -> Environment
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER') # Your email
    SMTP_PASS = os.environ.get('SMTP_PASS') # Your App Password

    if not SMTP_USER or not SMTP_PASS:
        # Fallback: Just log it to the console/db if not configured
        print(f"EMAIL NOT CONFIGURED. Feedack from {name}: {comment}")
        return jsonify({'message': 'Logged (Email not configured)'}), 200

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = target_email
        msg['Subject'] = f"New HealthTrace Review from {name}"
        
        body = f"Name: {name}\n\nComment:\n{comment}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        
        return jsonify({'message': 'Email sent directly'}), 200
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/webhook/apple-health', methods=['POST', 'GET'])
def apple_health_webhook():
    """
    Receives JSON payload from the 'Health Auto Export' iOS app.
    The user_email is passed as a query parameter.
    """
    user_email = request.args.get('user_email')
    
    if request.method == 'GET':
         # Just to allow checking if the endpoint is up
         return jsonify({"status": "active", "message": f"Webhook endpoint ready for {user_email or 'any user'}"}), 200

    payload = request.json
    print(f"\n[Webhook Received] Apple Health data for {user_email}")
    
    db = read_db()
    if 'entities' not in db:
        db['entities'] = {}
    if 'biometrics' not in db['entities']:
        db['entities']['biometrics'] = []

    # Store incoming metrics attached to the user
    # Health Auto Export wraps custom JSON differently depending on config
    # We dynamically calculate the value by filtering for today's points
    import datetime
    server_today_str = datetime.datetime.now().strftime('%Y-%m-%d')
    metrics_received = payload.get('data', {}).get('metrics', [])
    
    # Infer the correct local date from the payload to avoid Server UTC timezone issues
    inferred_today_str = None
    for m in metrics_received:
        if m.get('data'):
            last_point = m['data'][-1]
            date_str = last_point.get('date', '')
            if len(date_str) >= 10:
                inferred_today_str = date_str[:10]
                break
    today_str = inferred_today_str or server_today_str
    
    for metric in metrics_received:
        metric_name = metric.get('name')
        
        # Calculate the value:
        # If it has a 'data' array of points, sum only the ones that match today's date (since midnight).
        # Otherwise, fallback to a direct 'value' if it's sent as a simple aggregate.
        extracted_value = metric.get('value')
        
        if extracted_value is None and 'data' in metric:
            total_qty = 0.0
            for point in metric['data']:
                try:
                    total_qty += float(point.get('qty', 0))
                except ValueError:
                    pass
            
            # Format as int if whole, else round
            extracted_value = int(total_qty) if total_qty.is_integer() else round(total_qty, 2)
            
        # Only save if we actually got a value or if total_qty was 0 (meaning valid but no data)
        # We save 0 so the UI can at least show it, except if the user just didn't track it.
        # But Health Auto Export typically doesn't send metrics at all if there is no data.
        if extracted_value is not None:
            new_record = {
                "id": generate_id(),
                "patient_email": user_email,
                "metric_name": metric_name,
                "value": extracted_value,
                "date": today_str,
                "source": "Apple Health"
            }
            db['entities']['biometrics'].append(new_record)
        
    write_db(db)
    
    return jsonify({
        "status": "success", 
        "message": f"Saved {len(metrics_received)} biometric records to database"
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(
        debug=os.environ.get('RENDER') is None,
        host='0.0.0.0',
        port=port
    )