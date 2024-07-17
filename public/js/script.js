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
    attribution: 'Shaswat kumar mishra'
}).addTo(map);

const markers = {};

// Listen for receive-location events
socket.on('receive-location', (location) => {
    // Check if a marker for this username already exists
    if (markers[location.username]) {
        // If it exists, update its position
        markers[location.username].setLatLng([location.latitude, location.longitude]);
    } else {
        // If it doesn't exist, create a new marker
        markers[location.username] = L.marker([location.latitude, location.longitude])
            .addTo(map)
            .bindPopup(location.username)
            .openPopup();
    }
});

// Listen for the update-users event to populate the dropdown
socket.on('update-users', (users) => {
    const userDropdown = document.getElementById('user-dropdown');
    userDropdown.innerHTML = '';

    // Populate the dropdown with usernames
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        userDropdown.appendChild(option);
    });

    // Add event listener to select a user and center the map on their location
    userDropdown.addEventListener('change', () => {
        const selectedUsername = userDropdown.value;
        const selectedUser = users.find(user => user.username === selectedUsername);

        if (selectedUser && selectedUser.location) {
            const { latitude, longitude } = selectedUser.location;
            map.setView([latitude, longitude], 15); // Set the map view to the selected user's location
        }
    });
});
