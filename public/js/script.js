const socket = io();
const roomId = '<%= roomId %>';
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

socket.emit('join-room', { roomId, username });

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('send-location', { latitude, longitude });
    }, (error) => {
        console.error(error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    });
}

const map = L.map('map').setView([0, 0], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Shaswat Kumar Mishra'
}).addTo(map);

// Create an object to store markers by socket ID
const markers = {};

// Listen for receive-location events
socket.on('receive-location', (location) => {
    const { latitude, longitude, username, socketId } = location;

    // Center the map to the user's location
    if (socketId === socket.id) {
        map.setView([latitude, longitude]);
    }

    // Check if a marker for this socket ID already exists
    if (markers[socketId]) {
        // If it exists, update its position
        markers[socketId].setLatLng([latitude, longitude]);
    } else {
        // If it doesn't exist, create a new marker
        markers[socketId] = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(username)
            .openPopup();
    }
});

// Listen for update-users events
socket.on('update-users', (users) => {
    const userDropdown = document.getElementById('user-dropdown');
    userDropdown.innerHTML = '';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        userDropdown.appendChild(option);
    });
});
