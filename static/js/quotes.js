// static/js/quotes.js
const timeDisplay = document.getElementById('timeDisplay');
const verseText = document.getElementById('verseText');
const verseReference = document.getElementById('verseReference');
const pauseBtn = document.getElementById('pauseBtn');
const pauseBtnText = document.getElementById('pauseBtnText');
const nextVerseBtn = document.getElementById('nextVerseBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const countdown = document.getElementById('countdown');

let isPaused = false;
let currentVerse = null;
let countdownValue = 60;
let retryCount = 0;
const MAX_RETRIES = 5;

function showLoading() {
    loading.style.display = 'block';
    verseText.style.display = 'none';
    verseReference.style.display = 'none';
    errorMessage.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    verseText.style.display = 'block';
    verseReference.style.display = 'block';
}

function showError(message) {
    if (retryCount >= MAX_RETRIES) {
        errorMessage.textContent = `Failed to load verse after ${retryCount} attempts. Please try again later.`;
        errorMessage.style.display = 'block';
        loading.style.display = 'none';
    }
}

async function fetchVerse(hour, minute) {
    try {
        const response = await fetch(`/api/verse/${hour}/${minute}`);
        if (!response.ok) throw new Error('Failed to fetch verse');
        retryCount = 0; // Reset retry count on successful fetch
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        retryCount++;
        throw error;
    }
}

async function updateVerse(force = false) {
    if (isPaused && !force) return;
    
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Update time display
    timeDisplay.textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    // Only fetch new verse if minute has changed or forced update
    if (!currentVerse || currentVerse.minute !== minute || force) {
        showLoading();
        
        try {
            const verse = await fetchVerse(hour, minute);
            if (verse) {
                currentVerse = { ...verse, minute };
                verseText.textContent = verse.text;
                verseReference.textContent = `${verse.book} ${verse.chapter}:${verse.verse}`;
                hideLoading();
                errorMessage.style.display = 'none';
                countdownValue = 60; // Reset countdown
            } else {
                showLoading();
            }
        } catch (error) {
            if (retryCount >= MAX_RETRIES) {
                showError();
            } else {
                showLoading();
                // Try again in 5 seconds
                setTimeout(() => updateVerse(force), 5000);
            }
        }
    }
}

function updateCountdown() {
    if (!isPaused) {
        countdownValue -= 1;
        if (countdownValue <= 0) {
            countdownValue = 60;
        }
        countdown.textContent = countdownValue;
    }
}

// Event Listeners
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtnText.textContent = isPaused ? 'Resume' : 'Pause';
});

nextVerseBtn.addEventListener('click', () => {
    retryCount = 0; // Reset retry count on manual refresh
    updateVerse(true);
});

// Initial update and start intervals
updateVerse();
setInterval(updateVerse, 1000); // Check every second for minute changes
setInterval(updateCountdown, 1000); // Update countdown every second