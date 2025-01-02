# app.py
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from services.bible_service import BibleService
import logging
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notes.db'
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['BIBLE_API_KEY'] = 'fa72307bd52b34e0c9e8e5568b11271b'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Ensure the instance folder exists
import os
if not os.path.exists('instance'):
    os.makedirs('instance')

# Import models after db initialization
from models import Note, FavoriteVerse

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = app.logger

# Initialize Bible Service
bible_service = BibleService(app.config['BIBLE_API_KEY'])

# Bible verse routes
@app.route('/api/verse/<int:hour>/<int:minute>')
def get_verse(hour, minute):
    try:
        verse = bible_service.get_verse_by_time(hour, minute)
        if verse:
            return jsonify(verse)
        return jsonify({'error': 'No verse found'}), 404
    except Exception as e:
        logger.error(f"Error fetching verse: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Favorites routes
@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    if request.method == 'POST':
        data = request.json
        try:
            favorite = FavoriteVerse(
                book=data['book'],
                chapter=data['chapter'],
                verse=data['verse'],
                text=data['text']
            )
            db.session.add(favorite)
            db.session.commit()
            return jsonify(favorite.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    else:
        favorites = FavoriteVerse.query.order_by(FavoriteVerse.saved_at.desc()).all()
        return jsonify([f.to_dict() for f in favorites])

@app.route('/api/favorites/<int:id>', methods=['DELETE'])
def remove_favorite(id):
    favorite = FavoriteVerse.query.get_or_404(id)
    try:
        db.session.delete(favorite)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Note routes
@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    if request.method == 'POST':
        data = request.json
        try:
            # Check if note with this title already exists
            existing_note = Note.query.filter_by(title=data['title']).first()
            if existing_note:
                return jsonify({'error': 'A note with this title already exists'}), 400
                
            note = Note(
                title=data['title'],
                content=data['content']
            )
            db.session.add(note)
            db.session.commit()
            return jsonify(note.id)
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error saving note: {str(e)}")
            return jsonify({'error': str(e)}), 400
    else:
        try:
            notes = Note.query.order_by(Note.updated_at.desc()).all()
            return jsonify([note.to_dict() for note in notes])
        except Exception as e:
            logger.error(f"Error fetching notes: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/notes/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def handle_note(id):
    note = Note.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify({
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'updated_at': note.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    elif request.method == 'PUT':
        data = request.json
        try:
            note.title = data['title']
            note.content = data['content']
            db.session.commit()
            return '', 204
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    
    else:  # DELETE
        try:
            db.session.delete(note)
            db.session.commit()
            return '', 204
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

# Page routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/clock')
def clock():
    return render_template('clock.html')

@app.route('/quotes')
def quotes():
    return render_template('quotes.html')

@app.route('/favorites')
def favorites():
    return render_template('favorites.html')

@app.route('/zettel')
def zettel():
    return render_template('zettel.html')

def init_db():
    with app.app_context():
        db.create_all()
        logger.info("Database initialized!")

if __name__ == '__main__':
    init_db()  # Initialize database tables
    app.run(debug=True)