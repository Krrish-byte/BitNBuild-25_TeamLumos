import os
from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room
from werkzeug.utils import secure_filename
from flask_socketio import SocketIO


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'docx'}

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a@#!%^!@#$%^!!'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
socketio = SocketIO(app, cors_allowed_origins="*")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

connected_users = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_room(user1, user2):
    return "_".join(sorted([user1, user2]))

@app.route('/')
def chat():
    return render_template('chat.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/upload', methods=['POST'])
def upload():
    file = request.files.get('file')
    sender = request.form.get('sender')
    receiver = request.form.get('receiver')
    mode = request.form.get('mode')

    if not file:
        return 'No file uploaded', 400
    if not allowed_file(file.filename):
        return 'File type not allowed', 400

    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    event_data = {
        'user': sender,
        'filename': filename,
        'url': f"/uploads/{filename}"
    }

    if mode == 'private' and receiver:
        room = generate_room(sender, receiver)
        socketio.emit('file', event_data, room=room)
        return "OK",200
    else:
        return 'cannot upload on global chat', 400


@socketio.on('join')
def handle_join(data):
    username = data['username']
    connected_users[request.sid] = username

@socketio.on('chat_mode')
def handle_chat_mode(data):
    sender = data['sender']
    receiver = data.get('receiver')
    mode = data['mode']
    if mode == 'private' and receiver:
        room = generate_room(sender, receiver)
        join_room(room)

@socketio.on('send_message')
def handle_send_message(data):
    sender = connected_users.get(request.sid)
    receiver = data.get('receiver')
    message = data['msg']
    mode = data.get('mode')

    msg_data = {
        'user': sender,
        'msg': message
    }

    if mode == 'private' and receiver:
        room = generate_room(sender, receiver)
        socketio.emit('new_message', msg_data, room=room)
    else:
        socketio.emit('new_message', msg_data, to=None)


@socketio.on('disconnect')
def handle_disconnect():
    connected_users.pop(request.sid, None)

if __name__ == '__main__':
    socketio.run(app, debug=True)
