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
let connectedUsers = []; // Stores information about all connected users

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/room/:id', (req, res) => {
  res.render('room', { roomId: req.params.id });
});

const getUsersInRoom = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return [];

  const users = [];
  for (const userId of room) {
    const user = connectedUsers.find(user => user.id === userId);
    if (user) {
      users.push({ id: user.id, username: user.username });
    }
  }
  return users;
};

io.on('connection', (socket) => {
  // Store connecting user information
  connectedUsers.push({ id: socket.id, username: socket.handshake.auth.username });

  socket.on('join-room', ({ roomId, username }) => {
    if (!io.sockets.adapter.rooms.get(roomId)) {
      io.sockets.adapter.rooms.set(roomId, new Set()); // Use a Set to store unique user IDs
    }

    // Add user to room
    io.sockets.adapter.rooms.get(roomId).add(socket.id);
    socket.join(roomId);

    // Broadcast user join to room
    io.to(roomId).emit('update-users', { users: getUsersInRoom(roomId), roomId });

    // Send all existing locations to the newly joined user
    rooms[roomId].forEach(user => {
      if (user.id !== socket.id && user.location) { // Exclude the current user and only send if location exists
        socket.emit('receive-location', { ...user.location, username: user.username, roomId });
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
      io.to(roomId).emit('receive-location', { ...location, username, roomId });
    });

    socket.on('leave-room', ({ roomId, username }) => {
      rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
      io.to(roomId).emit('update-users', { users: rooms[roomId], roomId });
      socket.leave(roomId);
    });

    socket.on('disconnect', () => {
      connectedUsers = connectedUsers.filter(user => user.id !== socket.id);
      Object.keys(rooms).forEach(roomId => {
        rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
        io.to(roomId).emit('update-users', { users: rooms[roomId], roomId });
      });
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
