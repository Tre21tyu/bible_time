# utils/bible_loader.py
import requests
import json
from app import db
from models import BibleVerse

API_KEY = 'fa72307bd52b34e0c9e8e5568b11271b'  
API_URL = 'https://api.scripture.api.bible/v1/bibles'

def fetch_verses():
    headers = {
        'api-key': API_KEY
    }
    
    # First, get the Bible ID (using KJV)
    response = requests.get(f'{API_URL}', headers=headers)
    bibles = response.json()['data']
    kjv_bible = next(bible for bible in bibles if bible['abbreviation'] == 'KJV')
    
    # Now fetch books
    response = requests.get(f'{API_URL}/{kjv_bible["id"]}/books', headers=headers)
    books = response.json()['data']
    
    for book in books:
        # Fetch chapters
        response = requests.get(f'{API_URL}/{kjv_bible["id"]}/books/{book["id"]}/chapters', headers=headers)
        chapters = response.json()['data']
        
        for chapter in chapters:
            # Fetch verses
            response = requests.get(f'{API_URL}/{kjv_bible["id"]}/chapters/{chapter["id"]}/verses', headers=headers)
            verses = response.json()['data']
            
            for verse in verses:
                new_verse = BibleVerse(
                    book=book['name'],
                    chapter=int(chapter['number']),
                    verse=int(verse['number']),
                    text=verse['text']
                )
                db.session.add(new_verse)
    
    db.session.commit()

if __name__ == '__main__':
    db.create_all()
    fetch_verses()