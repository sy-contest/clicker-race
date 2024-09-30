import os
import json
from flask import Flask, render_template, request, jsonify, session
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv
from .config import get_firebase_config

load_dotenv()

app = Flask(__name__, template_folder='../templates', static_folder='../static')

app.secret_key = os.getenv('FLASK_SECRET_KEY')
if not app.secret_key:
    raise ValueError("No FLASK_SECRET_KEY set for Flask application")

firebase_service_account = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT'))
cred = credentials.Certificate(firebase_service_account)
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    game_id = request.json.get('game_id')

    if not username or not game_id:
        return jsonify({'success': False, 'message': 'Username and game ID are required'}), 400

    game_ref = db.reference(f'games/{game_id}')
    game = game_ref.get()

    if not game:
        return jsonify({'success': False, 'message': 'Invalid game ID'}), 404

    if game['status'] == 'finished':
        return jsonify({'success': False, 'message': 'Game has already finished'}), 403

    if game['player1'] == username:
        player = 'player1'
    elif game['player2'] == username:
        player = 'player2'
    else:
        return jsonify({'success': False, 'message': 'Username not associated with this game'}), 403

    session['username'] = username
    session['game_id'] = game_id
    session['player'] = player

    if game['player1'] and game['player2']:
        game_ref.update({'status': 'playing'})

    return jsonify({'success': True, 'player': player})

@app.route('/click', methods=['POST'])
def click():
    if 'username' not in session or 'game_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    game_id = session['game_id']
    player = session['player']

    game_ref = db.reference(f'games/{game_id}')
    game = game_ref.get()

    if not game:
        return jsonify({'success': False, 'message': 'Game not found'}), 404

    if game['status'] != 'playing':
        return jsonify({'success': False, 'message': 'Game is not in playing state'}), 400

    # Increment click count
    new_count = game[f'{player}_clicks'] + 1
    game_ref.update({f'{player}_clicks': new_count})

    if new_count >= 100:
        game_ref.update({'status': 'finished', 'winner': player})
        return jsonify({'success': True, 'message': 'You win!', 'winner': player, 'clicks': new_count})
    else:
        return jsonify({'success': True, 'message': 'Click recorded', 'clicks': new_count})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/config')
def config():
    try:
        return get_firebase_config()
    except Exception as e:
        app.logger.error(f"Error in config: {str(e)}")
        return jsonify({'error': 'Failed to get Firebase config'}), 500

if __name__ == '__main__':
    app.run(debug=True)