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

        socket.on('receive-location', (location) => {
            L.marker([location.latitude, location.longitude]).addTo(map)
                .bindPopup(location.username)
                .openPopup();
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