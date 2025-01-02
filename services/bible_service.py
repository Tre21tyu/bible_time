# services/bible_service.py
import requests
import random

class BibleService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.scripture.api.bible/v1"
        self.headers = {"api-key": api_key}
        self.bible_id = "de4e12af7f28f599-01"  # Standard KJV Bible ID
        self._books = None
    
    def get_books(self):
        """Get list of Bible books"""
        if self._books:
            return self._books
            
        url = f"{self.base_url}/bibles/{self.bible_id}/books"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        self._books = response.json()["data"]
        return self._books
    
    def get_verse(self, book_id, chapter, verse):
        """Get a specific verse"""
        url = f"{self.base_url}/bibles/{self.bible_id}/verses/{book_id}.{chapter}.{verse}"
        params = {
            'content-type': 'text',
            'include-notes': 'false',
            'include-titles': 'false'
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()["data"]

    def get_verse_by_time(self, hour, minute):
        """Get a verse based on hour and minute"""
        try:
            books = self.get_books()
            book = random.choice(books)
            
            # Keep chapter and verse within reasonable bounds
            chapter = min(max(hour, 1), 150)  # Most books don't have more than 150 chapters
            verse = min(max(minute, 1), 176)   # Longest chapter (Psalm 119) has 176 verses
            
            verse_data = self.get_verse(book["id"], chapter, verse)
            if verse_data:
                return {
                    "book": book["name"],
                    "chapter": chapter,
                    "verse": verse,
                    "text": verse_data["content"].strip()
                }
            
            # If specific verse not found, try verse 1
            verse_data = self.get_verse(book["id"], chapter, 1)
            if verse_data:
                return {
                    "book": book["name"],
                    "chapter": chapter,
                    "verse": 1,
                    "text": verse_data["content"].strip()
                }
                
            return None
            
        except Exception as e:
            print(f"Error getting verse by time: {str(e)}")
            return None