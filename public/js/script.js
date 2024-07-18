const socket = io();
let currentRoomId = '<%= roomId %>';
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

function joinRoom(roomId) {
    socket.emit('join-room', { roomId, username });
    currentRoomId = roomId;
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('send-location', { latitude, longitude, roomId: currentRoomId });
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

let markers = {};
let mapCentralized = false;

function clearPreviousData() {
    for (const username in markers) {
        map.removeLayer(markers[username]);
    }
    markers = {};
    mapCentralized = false;
    const userDropdown = document.getElementById('user-dropdown');
    userDropdown.innerHTML = '';
}

socket.on('receive-location', (location) => {
    if (location.roomId !== currentRoomId) return;

    if (!mapCentralized) {
        map.setView([location.latitude, location.longitude], 15);
        mapCentralized = true;
    }

    if (markers[location.username]) {
        markers[location.username].setLatLng([location.latitude, location.longitude]);
    } else {
        markers[location.username] = L.marker([location.latitude, location.longitude])
            .addTo(map)
            .bindPopup(location.username)
            .openPopup();
    }
});

socket.on('update-users', ({ users, roomId }) => {
    if (roomId !== currentRoomId) return;

    const userDropdown = document.getElementById('user-dropdown');
    userDropdown.innerHTML = '';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        userDropdown.appendChild(option);
    });

    userDropdown.addEventListener('change', () => {
        const selectedUsername = userDropdown.value;
        const selectedUser = users.find(user => user.username === selectedUsername);

        if (selectedUser && selectedUser.location) {
            const { latitude, longitude } = selectedUser.location;
            map.setView([latitude, longitude], 15);
        }
    });
});

joinRoom(currentRoomId);

document.getElementById('room-select').addEventListener('change', (event) => {
    const newRoomId = event.target.value;
    if (newRoomId !== currentRoomId) {
        socket.emit('leave-room', { roomId: currentRoomId, username });
        clearPreviousData();
        joinRoom(newRoomId);
    }
});
