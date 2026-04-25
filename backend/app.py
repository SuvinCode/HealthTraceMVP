from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Construct an absolute path to the database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, '..', 'db.json')

def read_db():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def write_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/<entity>', methods=['GET'])
def get_entities(entity):
    db = read_db()
    
    # Handle nested entities
    if entity in db.get('entities', {}):
        data = db['entities'][entity]
    elif entity in db:
        data = db[entity]
    else:
        return jsonify({}), 404

    # Filtering
    query_params = request.args
    if not query_params:
        return jsonify(data)

    filtered_data = []
    for item in data:
        match = True
        for key, value in query_params.items():
            if str(item.get(key)) != value:
                match = False
                break
        if match:
            filtered_data.append(item)
    
    return jsonify(filtered_data)

@app.route('/<entity>/<item_id>', methods=['GET'])
def get_entity(entity, item_id):
    db = read_db()
    
    if entity in db.get('entities', {}):
        data = db['entities'][entity]
    elif entity in db:
        data = db[entity]
    else:
        return jsonify({}), 404

    for item in data:
        if str(item.get('id')) == item_id:
            return jsonify(item)
            
    return jsonify({'error': 'Not found'}), 404

@app.route('/<entity>', methods=['POST'])
def create_entity(entity):
    db = read_db()
    new_item = request.json
    
    if entity in db.get('entities', {}):
        # Use provided ID if available, otherwise generate a new one
        if 'id' not in new_item:
            import random
            import string
            new_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
            new_item['id'] = new_id
        db['entities'][entity].append(new_item)
    elif entity in db:
        # Simple ID generation for top-level entities
        new_id = max(item['id'] for item in db[entity]) + 1 if db[entity] else 1
        new_item['id'] = new_id
        db[entity].append(new_item)
    else:
        return jsonify({'error': f"Entity '{entity}' not found"}), 404
        
    write_db(db)
    return jsonify(new_item), 201

@app.route('/<entity>/<item_id>', methods=['PUT', 'PATCH'])
def update_entity(entity, item_id):
    db = read_db()
    updates = request.json
    
    target_list = None
    if entity in db.get('entities', {}):
        target_list = db['entities'][entity]
    elif entity in db:
        target_list = db[entity]
    else:
        return jsonify({'error': f"Entity '{entity}' not found"}), 404

    for i, item in enumerate(target_list):
        if str(item.get('id')) == item_id:
            item.update(updates)
            target_list[i] = item
            write_db(db)
            return jsonify(item)
            
    return jsonify({'error': 'Not found'}), 404

@app.route('/<entity>/<item_id>', methods=['DELETE'])
def delete_entity(entity, item_id):
    db = read_db()
    
    target_list = None
    if entity in db.get('entities', {}):
        target_list = db['entities'][entity]
    elif entity in db:
        target_list = db[entity]
    else:
        return jsonify({'error': f"Entity '{entity}' not found"}), 404

    original_len = len(target_list)
    new_list = [item for item in target_list if str(item.get('id')) != item_id]
    
    if len(new_list) < original_len:
        if entity in db.get('entities', {}):
            db['entities'][entity] = new_list
        else:
            db[entity] = new_list
        write_db(db)
        return jsonify({}), 204
        
    return jsonify({'error': 'Not found'}), 404

@app.route('/login', methods=['POST'])
def login():
    db = read_db()
    credentials = request.json
    email = credentials.get('email')
    password = credentials.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    users = db.get('users', [])
    for user in users:
        if user.get('email') == email and user.get('password') == password:
            # In a real app, you'd generate a proper JWT token here
            # For this mock, we'll just return the user object
            return jsonify(user)

    return jsonify({'error': 'Invalid credentials'}), 401

if __name__ == '__main__':
    # Use the PORT environment variable provided by Render, defaulting to 5001 for local dev
    port = int(os.environ.get('PORT', 5001))
    # In production (e.g. Render), we must bind to 0.0.0.0
    app.run(debug=True if os.environ.get('RENDER') is None else False, host='0.0.0.0', port=port)
