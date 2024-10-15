# Video Chat Application

## Project Overview

This project implements a Peer-to-Peer (P2P) system using WebRTC to establish real-time communication between clients. The primary goal is to allow direct connections between two or more users to share video streams without routing through a central server, ensuring faster and more private connections.

## Features

- **Peer-to-Peer Video Communication**: Direct video streaming between peers using WebRTC.
- **Video Element Management**: Dynamic creation of video elements to manage streams.
- **Multiple User Support**: Each user gets a unique video element for easy identification and interaction.

## Prerequisites

Before running the project, ensure you have the following:

- Node.js (v14 or later)
- NPM (v6 or later)
- Git installed on your system
## Usage

To run the application locally, follow these steps:

1. Start the server:
    ```bash
    node server.js
    ```

2. Access the application in your browser at `http://localhost:3000`.

## Project Structure

```
/p2p-zairza
├── server1
│   ├── public
│   │   ├── index.html
│   │   └── script.js
│   ├── server.js
│   └── package.json
└── README.md
```

- **public/index.html**: Frontend of the application, which handles user interface and video streaming.
- **public/script.js**: JavaScript file to manage WebRTC connections, peer-to-peer communication, and handling video streams.
- **server.js**: Node.js server for handling signaling and WebRTC setup.
- **package.json**: Contains metadata and dependencies required by the project.

## How It Works

1. **Signaling**: WebRTC peers need to exchange metadata to establish a connection. This is done using a Node.js server acting as the signaling server.
2. **Connection**: Once the connection is established, peers can send video streams directly to each other.
3. **Dynamic Video Management**: When a new peer joins, a video element is created for each stream, and the stream is displayed automatically.

