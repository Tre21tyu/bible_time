// static/js/clock.js
const hourEl = document.querySelector('.hour')
const minuteEl = document.querySelector('.minute')
const secondEl = document.querySelector('.second')
const timeEl = document.querySelector('.time')
const dateEl = document.querySelector('.date')

// Color pickers
const primaryColorPicker = document.getElementById('primary-color')
const secondaryColorPicker = document.getElementById('secondary-color')
const clockBorderColorPicker = document.getElementById('clock-border-color')

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Load saved colors from localStorage or use defaults
document.documentElement.style.setProperty('--primary-color', localStorage.getItem('primary-color') || '#000000');
document.documentElement.style.setProperty('--secondary-color', localStorage.getItem('secondary-color') || '#ffffff');
document.documentElement.style.setProperty('--clock-border-color', localStorage.getItem('clock-border-color') || '#000000');

// Set initial color picker values
primaryColorPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#000000';
secondaryColorPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || '#ffffff';
clockBorderColorPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--clock-border-color').trim() || '#000000';

// Color picker event listeners
primaryColorPicker.addEventListener('change', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('primary-color', color);
});

secondaryColorPicker.addEventListener('change', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--secondary-color', color);
    localStorage.setItem('secondary-color', color);
});

clockBorderColorPicker.addEventListener('change', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--clock-border-color', color);
    localStorage.setItem('clock-border-color', color);
});

function setTime() {
    const time = new Date();
    const month = time.getMonth();
    const day = time.getDay();
    const date = time.getDate();
    const hours = time.getHours();
    const hoursForClock = hours >= 13 ? hours % 12 : hours;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Rotate clock hands
    hourEl.style.transform = `translate(-50%, -100%) rotate(${scale(hoursForClock * 60 + minutes, 0, 720, 0, 360)}deg)`;
    minuteEl.style.transform = `translate(-50%, -100%) rotate(${scale(minutes * 60 + seconds, 0, 3600, 0, 360)}deg)`;
    secondEl.style.transform = `translate(-50%, -100%) rotate(${scale(seconds, 0, 60, 0, 360)}deg)`;

    // Update digital time display
    timeEl.innerHTML = `${hoursForClock}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`;
    dateEl.innerHTML = `${days[day]}, ${months[month]} <span class="circle">${date}</span>`;
}

// Scale function to map a range of numbers to another range
const scale = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Update clock every second
setTime();
setInterval(setTime, 1000);
