import logging
from flask import Flask, Blueprint, jsonify, render_template, request, redirect, url_for, session
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
import spotipy
import os
from dotenv import load_dotenv
from functools import wraps
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s [%(levelname)s] - %(message)s')

# Retrieve environment variables
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI')
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY')

# Log the redirect URI
logging.debug(f"Redirect URI: {REDIRECT_URI}")

# Create SpotifyClientCredentials instance with credentials
client_credentials_manager = SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
spotify = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

# Initialize Flask app
app = Flask(__name__)
app.debug = True
app.secret_key = FLASK_SECRET_KEY

# Spotify OAuth setup with additional scopes
sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope='user-top-read user-read-recently-played playlist-read-private playlist-modify-public playlist-modify-private'
)

# Authentication Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def index():
    if not session.get('token_info'):
        auth_url = sp_oauth.get_authorize_url()
        logging.info("Redirecting to auth_url: %s", auth_url)
        return redirect(auth_url)
    return redirect(url_for('profile'))

@auth_bp.route('/callback')
def callback():
    auth_code = request.args.get('code')
    error = request.args.get('error')

    if error:
        logging.error("Error received from Spotify: %s", error)
        return f"Error received from Spotify: {error}", 400

    if not auth_code:
        logging.error("Authorization code not found in the URL")
        return 'Authorization code not found in the URL', 400

    try:
        token_info = sp_oauth.get_access_token(auth_code)
    except Exception as e:
        logging.error("Error obtaining access token: %s", e)
        return 'Failed to obtain access token', 500

    if not token_info:
        logging.error("Failed to obtain access token")
        return 'Failed to obtain access token', 500

    session['token_info'] = token_info
    return redirect(url_for('profile'))

app.register_blueprint(auth_bp)

def spotify_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token_info = session.get('token_info')
        if not token_info:
            logging.error("Token not found in the session")
            return jsonify({'error': 'Token not found'}), 404

        try:
            if is_token_expired(token_info):
                token_info = refresh_token(token_info)
                session['token_info'] = token_info
            return f(spotify=spotipy.Spotify(auth=token_info['access_token']), *args, **kwargs)
        except Exception as e:
            logging.error("Error: %s", e)
            return jsonify({'error': str(e)}), 500

    return decorated_function

def is_token_expired(token_info):
    now = datetime.now().timestamp()
    return token_info['expires_at'] - now < 60

def refresh_token(token_info):
    refreshed_token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
    return refreshed_token_info

@app.route('/profile')
@spotify_auth_required
def profile(spotify):
    user_info = spotify.me()
    logging.info("User information retrieved from Spotify API: %s", user_info)
    return render_template('profile.html', user_info=user_info)

@app.route('/recent-tracks')
@spotify_auth_required
def recent_tracks(spotify):
    try:
        tracks = spotify.current_user_recently_played(limit=10)
        logging.info("Recent tracks retrieved: %s", tracks)
        return render_template('recent_tracks.html', tracks=tracks)
    except spotipy.exceptions.SpotifyException as e:
        logging.error("Error retrieving recent tracks: %s", e)
        return jsonify({'error': 'Failed to retrieve recent tracks'}), 500

@app.route('/playlists')
@spotify_auth_required
def playlists(spotify):
    try:
        playlists = spotify.current_user_playlists()
        logging.info("User playlists retrieved: %s", playlists)
        return render_template('playlists.html', playlists=playlists)
    except spotipy.exceptions.SpotifyException as e:
        logging.error("Error retrieving playlists: %s", e)
        return jsonify({'error': 'Failed to retrieve playlists'}), 500

@app.route('/playlist-tracks')
@spotify_auth_required
def playlist_tracks(spotify):
    try:
        playlist_ids = request.args.getlist('playlist_ids')
        if not playlist_ids:
            return jsonify({'error': 'No playlist IDs provided'}), 400
        
        all_tracks = []
        for playlist_id in playlist_ids:
            logging.info(f"Fetching tracks for playlist ID: {playlist_id}")
            tracks = spotify.playlist_tracks(playlist_id)
            track_ids = [track['track']['id'] for track in tracks['items']]
            audio_features = spotify.audio_features(track_ids)
            for track, feature in zip(tracks['items'], audio_features):
                track['track']['audio_features'] = feature
                track['track'].pop('available_markets', None)
                track['track'].pop('external_ids', None)
                all_tracks.append(track['track'])
        
        logging.info(f"Total tracks retrieved: {len(all_tracks)}")
        return jsonify(all_tracks)
    except spotipy.exceptions.SpotifyException as e:
        logging.error("Error retrieving tracks from playlists: %s", e)
        return jsonify({'error': 'Failed to retrieve tracks from playlists'}), 500
    except Exception as e:
        logging.error("Unexpected error: %s", e)
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/playlist_builder')
@spotify_auth_required
def playlist_builder(spotify):
    try:
        playlists = spotify.current_user_playlists()
        logging.info("User playlists retrieved: %s", playlists)
        return render_template('playlist_builder.html', playlists=playlists)
    except spotipy.exceptions.SpotifyException as e:
        logging.error("Error retrieving playlists: %s", e)
        return jsonify({'error': 'Failed to retrieve playlists'}), 500

@app.route('/playlist_creator')
@spotify_auth_required
def playlist_creator(spotify):
    return render_template('playlist_creator.html')

@app.route('/create_playlist', methods=['POST'])
@spotify_auth_required
def create_playlist(spotify):
    try:
        data = request.json
        logging.debug(f"Received data: {data}")

        if not data or 'tracks' not in data:
            logging.error("No track data provided")
            return jsonify({'error': 'No track data provided'}), 400

        track_uris = []
        for track in data['tracks']:
            if 'uri' in track:
                track_uris.append(track['uri'])  # Correctly access the URI directly from the track object
            else:
                logging.error(f"Track missing 'uri': {track}")
                return jsonify({'error': "Track data missing 'uri' key"}), 400

        if not track_uris:
            logging.error("No track URIs found")
            return jsonify({'error': 'No track URIs found'}), 400

        user_id = spotify.me()['id']
        playlist = spotify.user_playlist_create(user_id, 'New Playlist', public=True)
        spotify.user_playlist_add_tracks(user_id, playlist['id'], track_uris)
        
        return jsonify({'success': True})
    except spotipy.exceptions.SpotifyException as e:
        logging.error(f"Spotify API error: {e}")
        return jsonify({'error': 'Spotify API error'}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({'error': 'Unexpected error occurred'}), 500


if __name__ == '__main__':
    app.run()
