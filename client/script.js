const socket = io();
const localVideo = document.getElementById('localVideo');
const userList = document.getElementById('userList');
const userIdDisplay = document.getElementById('userId');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleAudioBtn = document.getElementById('toggleAudio');
const peers = {};
let localStream;

// Get user media with lower resolution and frame rate
const constraints = {
    video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
    },
    audio: true
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        socket.emit('newUser'); // Notify server of new user
    })
    .catch(err => console.error('Failed to get local stream', err));

// Show the user ID
socket.on('yourID', id => {
    userIdDisplay.textContent = id;
});

// Update the list of online users
socket.on('updateUserList', users => {
    userList.innerHTML = '';
    users.forEach(user => {
        if (user !== socket.id) {
            const li = document.createElement('li');
            li.textContent = user;
            li.onclick = () => callUser(user);
            userList.appendChild(li);
        }
    });
});

// Handle incoming call
socket.on('incoming:call', async ({ from, offer }) => {
    const peerConnection = createPeerConnection(from);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer:call', { ans: answer, to: from });
});

// Answer a call
socket.on('inanswer:call', ({ from, answer }) => {
    const peerConnection = createPeerConnection(from);
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Create peer connection with ICE servers
function createPeerConnection(userId) {
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:your-turn-server:3478', username: 'user', credential: 'pass' }
        ]
    };

    const peerConnection = new RTCPeerConnection(iceServers);
    peers[userId] = peerConnection;

    // Add local tracks to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, to: userId });
        }
    };

    peerConnection.ontrack = event => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.autoplay = true;
        remoteVideo.controls = true;
        remoteVideo.id = `video-${userId}`; // Unique ID for the video element
        document.getElementById("videoContainer").appendChild(remoteVideo); // Display remote video
    };

    return peerConnection;
}

// Handle user left event
socket.on('user:left', userId => {
    console.log(`User left: ${userId}`);
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
        const videoElement = document.getElementById(`video-${userId}`);
        if (videoElement) {
            videoElement.remove();
        }
    }
});

// Call user function
function callUser(userId) {
    const peerConnection = createPeerConnection(userId);
    peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer);
        socket.emit('outgoing:call', { fromOffer: offer, to: userId });
    });
}

// Handle ICE candidates
socket.on('ice-candidate', ({ candidate, to }) => {
    const peerConnection = peers[to];
    if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Update user list on new connection
socket.on('user:joined', userId => {
    console.log(`User joined: ${userId}`);
});

// Notify the server about disconnection
window.addEventListener('beforeunload', () => {
    socket.emit('disconnect', socket.id);
});

// Toggle video and audio functions
toggleVideoBtn.onclick = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    toggleVideoBtn.textContent = videoTrack.enabled ? "Turn Off Video" : "Turn On Video";
};

toggleAudioBtn.onclick = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    toggleAudioBtn.textContent = audioTrack.enabled ? "Mute Audio" : "Unmute Audio";
};

