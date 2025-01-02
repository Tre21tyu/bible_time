let notesLoaded = false;

// static/js/zettel.js
// Add these at the top of your zettel.js file
const DEFAULT_SETTINGS = {
    leaderKey: 'Space',
    emmetKey: 'Space+e',
    saveKey: 'Space+s'
};

let currentSettings = { ...DEFAULT_SETTINGS };
let isRecording = false;
let recordingFor = null;

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('zettelSettings');
    if (saved) {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
    updateSettingsDisplay();
    updateShortcutHelp();
    return currentSettings;
}
// Add these new functions
function updateShortcutHelp() {
    const shortcutContent = document.getElementById('shortcutContent');
    shortcutContent.textContent = `${currentSettings.leaderKey}+${currentSettings.emmetKey.split('+')[1]}: Expand Emmet | ${currentSettings.leaderKey}+${currentSettings.saveKey.split('+')[1]}: Save | Esc: Normal Mode`;
}
// Handle shortcut help visibility
document.addEventListener('DOMContentLoaded', function () {
    const shortcutContent = document.getElementById('shortcutContent');
    const toggleButton = document.getElementById('toggleShortcuts');

    // Load saved visibility state
    const isVisible = localStorage.getItem('shortcutHelpVisible') === 'true';
    if (isVisible) {
        shortcutContent.style.display = 'block';
    }

    toggleButton.addEventListener('click', () => {
        const newState = shortcutContent.style.display !== 'block';
        shortcutContent.style.display = newState ? 'block' : 'none';
        localStorage.setItem('shortcutHelpVisible', newState);
    });
});

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('zettelSettings', JSON.stringify(currentSettings));
    updateEditorKeybindings();
    updateShortcutHelp();
    closeSettings();
}

// Update the settings modal display
function updateSettingsDisplay() {
    Object.keys(currentSettings).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = currentSettings[key];
        }
    });
}

// Modal controls
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    updateSettingsDisplay();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    isRecording = false;
    recordingFor = null;
}

// Key recording
function recordKey(inputId) {
    if (isRecording) return;

    isRecording = true;
    recordingFor = inputId;
    const btn = document.querySelector(`[onclick="recordKey('${inputId}')"]`);
    btn.classList.add('recording');
    btn.textContent = 'Press key...';

    const input = document.getElementById(inputId);
    input.value = 'Recording...';
}

// Convert key event to readable string
function getKeyString(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let key = e.key;
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    return parts.join('+');
}

// Handle keyboard events for recording
document.addEventListener('keydown', function (e) {
    if (!isRecording) return;

    e.preventDefault();
    const keyString = getKeyString(e);

    const input = document.getElementById(recordingFor);
    input.value = keyString;

    const btn = document.querySelector(`[onclick="recordKey('${recordingFor}')"]`);
    btn.classList.remove('recording');
    btn.textContent = 'Record Key';

    currentSettings[recordingFor] = keyString;

    isRecording = false;
    recordingFor = null;
});

// Update editor keybindings based on settings
function updateEditorKeybindings() {
    const settings = loadSettings();
    const leaderKey = settings.leaderKey.toLowerCase();

    // Update CodeMirror extraKeys
    editor.setOption('extraKeys', {
        [settings.emmetKey.toLowerCase()]: 'emmetExpandAbbreviation',
        [settings.saveKey.toLowerCase()]: function (cm) {
            saveNote();
        },
        'Tab': 'emmetExpandAbbreviationAll',
        'Ctrl-Space': 'autocomplete'
    });
}

// Initialize settings on load
document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
});

// Close settings modal when clicking outside
document.addEventListener('click', function (e) {
    const modal = document.getElementById('settingsModal');
    const content = modal.querySelector('.settings-content');
    if (e.target === modal) {
        closeSettings();
    }
});

let currentNote = null;
let notes = [];
let editor;

// Initialize CodeMirror with Vim mode
function initializeEditor() {
    const textarea = document.getElementById('noteContent');
    const settings = loadSettings();

    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'htmlmixed',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        keyMap: 'vim',
        autofocus: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    });

    // Initialize Emmet
    emmetCodeMirror(editor);

    // Vim mode indicator
    const vimModeIndicator = document.getElementById('vim-mode');

    // Define custom Vim ex commands
    CodeMirror.Vim.defineEx('write', 'w', function () {
        saveNote();
    });

    CodeMirror.Vim.defineEx('quit', 'q', function () {
        if (currentNote && confirm('Quit without saving?')) {
            clearEditor();
        }
    });

    CodeMirror.Vim.defineEx('wq', 'wq', function () {
        saveNote().then(() => clearEditor());
    });

    // Update vim mode indicator more robustly
editor.on('vim-mode-change', function(event) {
    updateVimModeIndicator();
});

editor.on('keyHandled', function() {
    updateVimModeIndicator();
});

editor.on('focus', function() {
    updateVimModeIndicator();
});
    // Add vim state change handler
    CodeMirror.Vim.defineOption('insertmode', false, 'boolean');
    CodeMirror.Vim.defineEx('set', '', function (cm, params) {
        if (params.argString.match(/insertmode/)) {
            const currentMode = editor.state.vim.mode;
            vimModeIndicator.textContent = currentMode.toUpperCase();
            console.log('Vim option changed, mode:', currentMode);
        }
    });

    // Handle changes for live preview
    editor.on('change', debounce(updatePreview, 300));

    return editor;
}

// Utility function to debounce preview updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// DOM Elements
const notesList = document.getElementById('notesList');
const searchBox = document.getElementById('searchBox');
const newNoteBtn = document.getElementById('newNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const notePreview = document.getElementById('notePreview');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

// Note CRUD Operations
async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        if (!response.ok) {
            throw new Error('Failed to load notes');
        }
        notes = await response.json();
        renderNotesList();
        notesLoaded = true;
        console.log('Notes loaded:', notes.length);
    } catch (error) {
        console.error('Error loading notes:', error);
        // Show error in the notes list area
        notesList.innerHTML = '<div class="error-message">Failed to load notes. Please try refreshing.</div>';
    }
}

async function loadNote(id) {
    try {
        const response = await fetch(`/api/notes/${id}`);
        currentNote = await response.json();
        noteTitle.value = currentNote.title;
        editor.setValue(currentNote.content);
        updatePreview();
        highlightCurrentNote();
    } catch (error) {
        console.error('Error loading note:', error);
    }
}

async function saveNote() {
    const title = noteTitle.value.trim();
    const content = editor.getValue().trim();

    if (!title) {
        alert('Please enter a title');
        return;
    }

    try {
        // Check for duplicate title
        const duplicateNote = notes.find(note => 
            note.title.toLowerCase() === title.toLowerCase() && 
            (!currentNote || note.id !== currentNote.id)
        );
        
        if (duplicateNote) {
            alert('A note with this title already exists');
            return;
        }

        const method = currentNote ? 'PUT' : 'POST';
        const url = currentNote 
            ? `/api/notes/${currentNote.id}`
            : '/api/notes';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save note');
        }

        if (!currentNote) {
            // New note
            await loadNote(data); // data should be the new note ID
        }
        
        await loadNotes(); // Refresh the notes list
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert(error.message || 'Failed to save note');
    }
}

// UI Functions
function renderNotesList() {
    notesList.innerHTML = notes
        .map(note => `
            <div class="note-item ${currentNote && note.id === currentNote.id ? 'active' : ''}" 
                 onclick="loadNote(${note.id})">
                <div>${note.title}</div>
                <small>${note.updated_at}</small>
            </div>
        `)
        .join('');
}

function clearEditor() {
    currentNote = null;
    noteTitle.value = '';
    editor.setValue('');
    updatePreview();
    highlightCurrentNote();
}

function highlightCurrentNote() {
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (currentNote && item.onclick.toString().includes(currentNote.id)) {
            item.classList.add('active');
        }
    });
}

function updatePreview() {
    const content = editor.getValue();
    let html = content;

    // Convert [[links]] to HTML
    html = html.replace(/\[\[(.*?)\]\]/g, (match, link) => {
        const noteExists = notes.some(note => note.title === link);
        return `<a href="#" class="wiki-link" ${noteExists ? `onclick="loadNoteByTitle('${link}')"` :
            'style="color: #e74c3c;"'}>${link}</a>`;
    });

    // Convert line breaks and handle basic markdown
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    notePreview.innerHTML = html;
    console.log('Preview updated');
}

async function loadNoteByTitle(title) {
    const note = notes.find(n => n.title === title);
    if (note) {
        await loadNote(note.id);
    }
}

// Add this helper function
function getCurrentVimMode() {
    if (!editor?.state?.vim) return 'NORMAL';
    if (editor.state.vim.insertMode) return 'INSERT';
    if (editor.state.vim.visualMode) return 'VISUAL';
    return 'NORMAL';
}

// Add this function for more reliable mode indication updates
function updateVimModeIndicator() {
    const vimModeIndicator = document.getElementById('vim-mode');
    const currentMode = getCurrentVimMode();
    vimModeIndicator.textContent = currentMode;
}

// Filter notes
function filterNotes(query) {
    const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase())
    );
    notesList.innerHTML = filtered
        .map(note => `
            <div class="note-item ${currentNote && note.id === currentNote.id ? 'active' : ''}" 
                 onclick="loadNote(${note.id})">
                <div>${note.title}</div>
                <small>${note.updated_at}</small>
            </div>
        `)
        .join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function () {
    editor = initializeEditor();
    // Load notes first, then set up the editor
    await loadNotes();
    // If no notes are visible, show a message
    if (!notes.length) {
        notesList.innerHTML = '<div class="note-item empty-state">No notes yet. Create your first note!</div>';
    }
});

searchBox.addEventListener('input', e => filterNotes(e.target.value));
newNoteBtn.addEventListener('click', clearEditor);
saveNoteBtn.addEventListener('click', saveNote);
deleteNoteBtn.addEventListener('click', deleteNote);

// Keep track of leader key state
let leaderKeyPressed = false;
let leaderKeyTimeout = null;

// Regular save button click handler
document.getElementById('saveNoteBtn').addEventListener('click', function (e) {
    e.preventDefault();
    saveNote();
});

// Update keydown handler for better space handling
document.addEventListener('keydown', function(e) {
    updateVimModeIndicator(); // Update mode on every keypress
    const currentMode = getCurrentVimMode();
    const target = e.target;

    if (isRecording) {
        // ... recording handler code ...
        return;
    }

    const isInEditor = target.classList.contains('CodeMirror-scroll') || 
                      target.closest('.CodeMirror');
// Space as leader key
    if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey && isInEditor) {
        if (currentMode === 'NORMAL') {
            e.preventDefault();
            e.stopPropagation();
            leaderKeyPressed = true;
            clearTimeout(leaderKeyTimeout);
            leaderKeyTimeout = setTimeout(() => {
                leaderKeyPressed = false;
            }, 1000);
            console.log('Leader key pressed');
        }
        return;
    }

    // Leader key combinations
    if (leaderKeyPressed && currentMode === 'NORMAL' && isInEditor) {
        const key = e.key.toLowerCase();
        console.log('Checking leader combo:', key);

        if (key === 's') {  // Simplified check for save
            e.preventDefault();
            e.stopPropagation();
            saveNote();
            leaderKeyPressed = false;
            console.log('Save triggered');
        } else if (key === 'e') {  // Simplified check for Emmet
            e.preventDefault();
            e.stopPropagation();
            editor.execCommand('emmetExpandAbbreviation');
            leaderKeyPressed = false;
            console.log('Emmet triggered');
        }
    }
});
async function saveNote() {
    const title = noteTitle.value.trim();
    const content = editor.getValue().trim();

    if (!title) {
        alert('Please enter a title');
        return;
    }

    try {
        // Only check for existing note if this is a new note or title has changed
        if (!currentNote || currentNote.title !== title) {
            const existingNote = notes.find(note => note.title === title);
            if (existingNote) {
                alert('A note with this title already exists');
                return;
            }
        }

        const method = currentNote ? 'PUT' : 'POST';
        const url = currentNote 
            ? `/api/notes/${currentNote.id}`
            : '/api/notes';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save note');
        }

        // Update preview immediately after save
        updatePreview();

        if (!currentNote) {
            const noteId = await response.json();
            await loadNote(noteId);
        } else {
            // Update current note in memory
            currentNote.content = content;
            currentNote.title = title;
        }
        
        await loadNotes();
    } catch (error) {
        console.error('Error saving note:', error);
        alert(error.message);
    }
}

// Add some CSS for the empty state
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        color: #666;
        text-align: center;
        padding: 1rem;
        font-style: italic;
    }
    .error-message {
        color: #e74c3c;
        text-align: center;
        padding: 1rem;
        background: #fde8e7;
        border-radius: 4px;
        margin: 1rem;
    }
`;
document.head.appendChild(style);