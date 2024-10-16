const socket = io();
let localStream;
let peerConnections = {};
const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
let role;
let username;

// Function to select role and start stream
function selectRole(selectedRole) {
    username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter your name.');
        return;
    }

    role = selectedRole;
    socket.emit('roleSelected', { role, username });
    document.getElementById('roleSelection').style.display = 'none';
    document.getElementById('meeting').style.display = 'block';

    if (role === 'host') {
        document.getElementById('hostControls').style.display = 'block';
        initializeHostStream();
    } else {
        document.getElementById('hostControls').style.display = 'none';
    }
}

// Initialize stream for host
async function initializeHostStream() {
    try {
        console.log('Initializing host stream...');
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('hostVideo').srcObject = localStream;
        socket.emit('startStream', { username });

        socket.on('newParticipant', (participantId) => {
            console.log(`New participant: ${participantId}`);
            const peerConnection = new RTCPeerConnection(config);
            peerConnections[participantId] = peerConnection;

            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('iceCandidate', {
                        to: participantId,
                        candidate: event.candidate
                    });
                }
            };

            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    console.log('Sending offer to participant...');
                    socket.emit('offer', {
                        to: participantId,
                        offer: peerConnection.localDescription
                    });
                });
        });
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

// Handle offer from host (for participants)
socket.on('offer', async ({ from, offer }) => {
    console.log('Received offer from host...');
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[from] = peerConnection;

    peerConnection.ontrack = event => {
        console.log('Receiving track from host...');
        document.getElementById('hostVideo').srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('iceCandidate', {
                to: from,
                candidate: event.candidate
            });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', {
        to: from,
        answer: peerConnection.localDescription
    });
});

// Handle answer from participant (for host)
socket.on('answer', ({ from, answer }) => {
    console.log('Received answer from participant...');
    peerConnections[from].setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidates
socket.on('iceCandidate', ({ from, candidate }) => {
    console.log('Received ICE candidate...');
    peerConnections[from].addIceCandidate(new RTCIceCandidate(candidate));
});

// Chat handling code remains the same
const form = document.getElementById('chatForm');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('chatInput').value;
    socket.emit('chatMessage', { message, username, isHost: role === 'host' });
    document.getElementById('chatInput').value = '';
});

socket.on('chatMessage', ({ message, username, isHost }) => {
    const messages = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = `${username}${isHost ? ' (Host)' : ''}: ${message}`;
    messages.appendChild(newMessage);
});

