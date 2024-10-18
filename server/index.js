const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
let participantsList = {};

const port = 8000;

app.use(express.static(path.resolve(__dirname, '../client')));

let hostId = null;

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('roleSelected', ({ role, username }) => {
        if (role === 'host') {
            hostId = socket.id;
            console.log(`Host selected: ${username} (${hostId})`);
            participantsList[socket.id] = username; // Add host to participants
            io.emit('updateParticipants', { participants: participantsList });
        } else {
            console.log(`Participant selected: ${username}`);
            if (hostId) {
                participantsList[socket.id] = username; // Add participant to the list
                socket.to(hostId).emit('newParticipant', { id: socket.id, username });
                io.emit('updateParticipants', { participants: participantsList }); // Notify all participants
            }
        }
    });

    socket.on('startStream', ({ username }) => {
        console.log(`Host (${username}) started streaming.`);
        // Notify participants to start the streaming process
        if (hostId) {
            io.emit('hostStreaming', { hostId: socket.id });
        }
    });

    // Send offer to the participant
    socket.on('offer', ({ to, offer }) => {
        io.to(to).emit('offer', { from: socket.id, offer });
    });

    // Handle answer from the participant
    socket.on('answer', ({ to, answer }) => {
        io.to(to).emit('answer', { from: socket.id, answer });
    });

    // Handle ICE candidates
    socket.on('iceCandidate', ({ to, candidate }) => {
        io.to(to).emit('iceCandidate', { from: socket.id, candidate });
    });

    // Handle chat messages
    socket.on('chatMessage', ({ message, username, isHost }) => {
        const chatMessage = {
            message,
            username,
            isHost,
        };
        io.emit('chatMessage', chatMessage);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete participantsList[socket.id]; // Remove participant from the list
        io.emit('updateParticipants', { participants: participantsList }); // Notify all participants
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
