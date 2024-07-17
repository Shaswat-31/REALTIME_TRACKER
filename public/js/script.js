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

        // const markers={};
        // socket.on('receive-location', (location) => {
        //     map.setView([location.latitude,location.longitude]);
        //     if(markers[id])
        //         markers[id].setLatLng([location.latitude,location.longitude]);
        //     else
        //         markers[id]=L.marker([location.latitude,location.longitude]).addTo(map);
        //     // L.marker([location.latitude, location.longitude]).addTo(map)
        //     //     .bindPopup(location.username)
        //     //     .openPopup();
        // });
        const markers = {};

// Listen for receive-location events
socket.on('receive-location', (location) => {
    map.setView([location.latitude, location.longitude]);

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