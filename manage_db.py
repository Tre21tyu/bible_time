# manage_db.py
from app import app, db
from models import Note, FavoriteVerse

def reset_database():
    with app.app_context():
        # Drop all tables
        print("Dropping all tables...")
        db.drop_all()
        # Create all tables
        print("Creating all tables...")
        db.create_all()
        print("Database reset complete!")

if __name__ == "__main__":
    reset_database()