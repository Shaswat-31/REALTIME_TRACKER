import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/room/:id', (req, res) => {
    res.render('room', { roomId: req.params.id });
});

io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, username }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push({ id: socket.id, username });
        socket.join(roomId);
        io.to(roomId).emit('update-users', rooms[roomId]);

        // Send all existing locations to the newly joined user
        rooms[roomId].forEach(user => {
            if (user.id !== socket.id && user.location) { // Exclude the current user and only send if location exists
                socket.emit('receive-location', { ...user.location, username: user.username });
            }
        });

        socket.on('send-location', (location) => {
            // Store location with user
            rooms[roomId] = rooms[roomId].map(user => {
                if (user.id === socket.id) {
                    user.location = location;
                }
                return user;
            });
            io.to(roomId).emit('receive-location', { ...location, username });
        });

        socket.on('disconnect', () => {
            rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
            io.to(roomId).emit('update-users', rooms[roomId]);
        });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
