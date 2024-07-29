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

const users = [];

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/map', (req, res) => {
    const username = req.query.username;
    res.render('map', { username });
});

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        users.push({ id: socket.id, username });
        io.emit('update-users', users);

        socket.on('send-location', (location) => {
            const user = users.find(u => u.id === socket.id);
            if (user) {
                io.emit('receive-location', { ...location, username: user.username, socketId: socket.id });
            }
        });

        socket.on('disconnect', () => {
            const index = users.findIndex(u => u.id === socket.id);
            if (index !== -1) {
                users.splice(index, 1);
                io.emit('update-users', users);
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
