import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

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
    socket.on('create-room', ({ roomName, username }) => {
        const roomId = uuidv4();
        rooms[roomId] = [{ id: socket.id, username }];
        socket.join(roomId);
        socket.emit('room-created', { roomId });
    });

    socket.on('join-room', ({ roomId, username }) => {
        if (!rooms[roomId]) {
            socket.emit('error', { message: 'Room does not exist' });
            return;
        }
        rooms[roomId].push({ id: socket.id, username });
        socket.join(roomId);
        io.to(roomId).emit('update-users', rooms[roomId]);

        rooms[roomId].forEach(user => {
            if (user.location) {
                socket.emit('receive-location', { ...user.location, username: user.username });
            }
        });

        socket.on('send-location', (location) => {
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
