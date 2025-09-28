import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit # Import emit from flask_socketio
from werkzeug.utils import secure_filename

# --- Basic Configuration ---
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'zip', 'doc', 'docx', 'xls', 'xlsx'} # Added more common file types

app = Flask(__name__, template_folder='templates')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = 'a_very_secret_key!123' # It's good practice to use a stronger secret key
socketio = SocketIO(app, cors_allowed_origins="*")

# Create the folder for file uploads if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Server State ---
online_users = {} # Maps username -> session_id
user_sids = {}    # Maps session_id -> username (for easier reverse lookup on disconnect)

def is_file_allowed(filename):
    """Check if the file extension is in our allowed list."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- HTTP Routes ---

@app.route('/')
def index():
    """Serves the main chat page."""
    return render_template('chat_app.html')

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    """Provides access to uploaded files."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['POST'])
def handle_file_upload():
    """Saves an uploaded file."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if file and is_file_allowed(file.filename):
        filename = secure_filename(file.filename)
        # Ensure unique filename to prevent overwriting
        base, ext = os.path.splitext(filename)
        counter = 0
        unique_filename = filename
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)):
            counter += 1
            unique_filename = f"{base}_{counter}{ext}"
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
        return jsonify({"filename": unique_filename}), 200 # Return the unique filename
    return jsonify({"error": "File type not permitted"}), 400

# --- Socket.IO Event Handlers ---

@socketio.on('join')
def on_join(data):
    """A user joins the chat."""
    username = data['username']
    if username in online_users:
        emit('join_error', {'error': 'Username is already taken. Please choose another.'})
        return

    online_users[username] = request.sid
    user_sids[request.sid] = username # Store reverse lookup
    
    print(f"User {username} has joined. SID: {request.sid}")
    emit('join_success') # Confirm successful join to the client
    # CORRECTED: Use socketio.emit without broadcast=True to broadcast globally
    socketio.emit('user_list_update', list(online_users.keys())) # Update user list for everyone


@socketio.on('send_message')
def on_send_message(data):
    """Handles incoming messages."""
    sender_username = user_sids.get(request.sid)
            
    if not sender_username:
        print(f"Could not find sender for message with SID: {request.sid}. Disconnecting rogue client?")
        return

    message_payload = {
        'sender': sender_username,
        'text': data['text'],
        'type': 'text',
        'timestamp': data.get('timestamp') # Include timestamp from client
    }

    recipient_username = data.get('recipient')
    if recipient_username and recipient_username != 'global':
        message_payload['recipient'] = recipient_username
        recipient_sid = online_users.get(recipient_username)
        if recipient_sid:
            emit('private_message', message_payload, room=recipient_sid) # To recipient
            emit('private_message', message_payload, room=request.sid)   # To sender
        else:
            emit('system_message', {'text': f'User {recipient_username} is currently offline.'}, room=request.sid)
    else: # Global chat
        # CORRECTED: Use emit() (local to the request) with broadcast=True
        emit('new_message', message_payload, broadcast=True)

@socketio.on('send_file')
def on_send_file(data):
    """Handles incoming files."""
    sender_username = user_sids.get(request.sid)
    
    if not sender_username:
        print(f"Could not find sender for file with SID: {request.sid}.")
        return

    file_payload = {
        'sender': sender_username,
        'filename': data['filename'],
        'type': 'file',
        'timestamp': data.get('timestamp') # Include timestamp from client
    }

    recipient_username = data.get('recipient')
    if recipient_username and recipient_username != 'global':
        file_payload['recipient'] = recipient_username
        recipient_sid = online_users.get(recipient_username)
        if recipient_sid:
            emit('private_message', file_payload, room=recipient_sid) # To recipient
            emit('private_message', file_payload, room=request.sid)   # To sender
        else:
            emit('system_message', {'text': f'User {recipient_username} is currently offline.'}, room=request.sid)
    else: # Global chat
        # CORRECTED: Use emit() (local to the request) with broadcast=True
        emit('new_message', file_payload, broadcast=True)


@socketio.on('typing')
def on_typing(data):
    """Broadcasts typing status."""
    sender_username = user_sids.get(request.sid)
    if not sender_username:
        return

    recipient_username = data.get('recipient')
    if recipient_username and recipient_username != 'global':
        recipient_sid = online_users.get(recipient_username)
        if recipient_sid:
            # Emit to the recipient only
            emit('typing', {'sender': sender_username, 'recipient': recipient_username}, room=recipient_sid)
    else:
        # Broadcast to all except sender for global chat
        emit('typing', {'sender': sender_username, 'recipient': 'global'}, broadcast=True, include_self=False)


@socketio.on('stop_typing')
def on_stop_typing(data):
    """Broadcasts stop typing status."""
    sender_username = user_sids.get(request.sid)
    if not sender_username:
        return

    recipient_username = data.get('recipient')
    if recipient_username and recipient_username != 'global':
        recipient_sid = online_users.get(recipient_username)
        if recipient_sid:
            # Emit to the recipient only
            emit('stop_typing', {'sender': sender_username, 'recipient': recipient_username}, room=recipient_sid)
    else:
        # Broadcast to all except sender for global chat
        emit('stop_typing', {'sender': sender_username, 'recipient': 'global'}, broadcast=True, include_self=False)


@socketio.on('disconnect')
def on_disconnect():
    """A user leaves the chat."""
    username_to_remove = user_sids.get(request.sid)
    
    if username_to_remove:
        del online_users[username_to_remove]
        del user_sids[request.sid]
        print(f"User {username_to_remove} has disconnected. SID: {request.sid}")
        # CORRECTED: Use socketio.emit without broadcast=True to broadcast globally
        socketio.emit('user_list_update', list(online_users.keys()))


if __name__ == '__main__':
    # When deploying, set debug=False and use a production-ready WSGI server like Gunicorn
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)