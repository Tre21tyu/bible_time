# YOUR PROJECT TITLE: Bible time
#### Video Demo:  https://youtu.be/0k4oFe-9Zeo
#### Description:
TODO
# Time & Mind: A Personal Knowledge Management System

This project combines three distinct tools into a unified web application: a customizable clock, a Bible verse generator synchronized with time, and a Zettelkasten note-taking system. Built with Flask and modern web technologies, it serves as a comprehensive personal dashboard for time management, spiritual reflection, and knowledge organization.

## Project Overview

The application consists of four main features:

1. **Interactive Clock**: A customizable analog and digital clock display where users can modify colors to match their preferences. The clock includes both analog hands and a digital display, with smooth animations and persistent color settings through localStorage.

2. **Time-Based Bible Verses**: An innovative system that generates Bible verses based on the current time. For example, if it's 3:16, it might show John 3:16. The system includes:
   - Random verse selection from matching chapter/verse combinations
   - Automatic updates with time changes
   - Ability to pause and manually control verse display
   - Integration with the Bible.com API for verse retrieval

3. **Favorites System**: Users can save meaningful verses for later reference. The favorites system includes:
   - One-click saving of current verses
   - Dedicated favorites page for viewing saved verses
   - Ability to delete saved verses
   - Timestamp tracking for each saved verse

4. **Zettelkasten Note-Taking**: A full-featured note-taking system implementing the Zettelkasten method, featuring:
   - Split-pane interface with live preview
   - Wiki-style linking between notes using [[notation]]
   - Full-text search functionality
   - Automatic saving and version tracking
   - Visual feedback for existing vs. non-existing note links

## Technical Implementation

### Backend Structure (`app.py` and `models.py`)

The backend is built with Flask and SQLAlchemy, using a modular structure:

- `app.py`: Contains route handlers and application configuration
- `models.py`: Defines database models for notes and favorite verses
- `services/bible_service.py`: Handles Bible API interactions

Key design decisions in the backend:

1. **SQLite Database**: Chosen for its simplicity and portability. While PostgreSQL would offer more features, SQLite's file-based nature makes the application easier to deploy and maintain for personal use.

2. **Service Layer Pattern**: The Bible service is implemented as a separate class to encapsulate API logic and provide better error handling and caching opportunities.

### Frontend Architecture

The frontend is organized into distinct components:

1. **Templates**:
   - `base.html`: Common layout and navigation
   - `clock.html`: Clock interface with color customization
   - `quotes.html`: Bible verse display and controls
   - `favorites.html`: Saved verses management
   - `zettel.html`: Note-taking interface

2. **Static Files**:
   - `clock.js`: Clock animation and color management
   - `quotes.js`: Verse fetching and display logic
   - `zettel.js`: Note management and preview functionality
   - `style.css`: Global styles and layout

### Design Decisions and Tradeoffs

1. **Real-time Updates vs. Performance**:
   - The clock updates every second for smooth movement
   - Bible verses update every minute to reduce API calls
   - Note preview updates on input for immediate feedback

2. **Data Storage Approach**:
   - Notes are stored in SQLite for persistence and querying
   - Color preferences use localStorage for quick access
   - Verse favorites use SQLite for sharing potential

3. **UI/UX Considerations**:
   - Split-pane design in Zettelkasten for immediate feedback
   - Color customization for personal preference
   - Responsive layout for various screen sizes

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install flask flask-sqlalchemy requests
   ```
3. Set up your Bible API key in `app.py`
4. Initialize the database:
   ```bash
   python app.py
   ```

## Project Structure
```
your_project/
├── instance/
│   └── notes.db              # SQLite database
├── services/
│   └── bible_service.py      # Bible API service
├── static/
│   ├── css/
│   │   └── style.css        # Global styles
│   └── js/
│       ├── clock.js         # Clock functionality
│       ├── quotes.js        # Bible verse handling
│       └── zettel.js        # Note-taking system
├── templates/
│   ├── base.html            # Base template
│   ├── clock.html           # Clock page
│   ├── favorites.html       # Saved verses
│   ├── index.html          # Home page
│   ├── quotes.html         # Bible verses
│   └── zettel.html         # Note-taking
├── app.py                   # Main application
├── models.py               # Database models
└── requirements.txt        # Dependencies
```

## Future Improvements

1. **Authentication System**: Add user accounts for personalized experiences
2. **Export Functionality**: Allow exporting notes and favorites
3. **Enhanced Note Formatting**: Add support for Markdown in notes
4. **Verse Categories**: Add tagging system for favorite verses
5. **Mobile Optimization**: Improve mobile responsiveness

## Reflections on Development

This project evolved from three separate concepts into an integrated personal dashboard. The main challenge was creating a cohesive user experience while maintaining the independence of each feature. The decision to use Flask over alternatives like Django was made to maintain simplicity while still providing a robust foundation for future expansion.

The Zettelkasten implementation particularly required careful consideration of the user interface. The split-pane design was chosen over a tabbed interface to provide immediate feedback during note creation, though this did present challenges in mobile responsiveness that would need to be addressed in future updates.# bible_time
