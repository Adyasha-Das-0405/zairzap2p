const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 8000;


app.use(express.static(path.resolve(__dirname, '../client')));

let hostId = null;

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    
    socket.on('roleSelected', ({ role, username }) => {
        if (role === 'host') {
            hostId = socket.id;
            console.log(`Host selected: ${username} (${hostId})`);
        } else {
            console.log(`Participant selected: ${username}`);
            if (hostId) {
                
                socket.to(hostId).emit('newParticipant', socket.id);
            }
        }
    });

    
    socket.on('startStream', ({ username }) => {
        console.log(`Host (${username}) started streaming.`);
    });

    
    socket.on('offer', ({ to, offer }) => {
        io.to(to).emit('offer', { from: socket.id, offer });
    });

    
    socket.on('answer', ({ to, answer }) => {
        io.to(to).emit('answer', { from: socket.id, answer });
    });

    
    socket.on('iceCandidate', ({ to, candidate }) => {
        io.to(to).emit('iceCandidate', { from: socket.id, candidate });
    });

    
    socket.on('chatMessage', ({ message, username, isHost }) => {
        const chatMessage = {
            message,
            username,
            isHost,
        };
        io.emit('chatMessage', chatMessage); 
    });

    socket.on('disconnect', () => {
        if (socket.id === hostId) {
            console.log('Host disconnected. Ending stream.');
            hostId = null;
            io.emit('hostDisconnected');
        } else {
            console.log(`Participant disconnected: ${socket.id}`);
        }
    });
});


server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

