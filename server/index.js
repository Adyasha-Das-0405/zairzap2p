const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = new Map();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  users.set(socket.id, socket.id);

  // Notify other users about the new connection
  socket.broadcast.emit("user:joined", socket.id);
  io.emit("updateUserList", Array.from(users.values())); // Emit the updated user list

  // Handle outgoing call
  socket.on("outgoing:call", ({ fromOffer, to }) => {
    console.log(`Call from ${socket.id} to ${to}`);
    socket.to(to).emit("incoming:call", { from: socket.id, offer: fromOffer });
  });

  // Handle answer to call
  socket.on("answer:call", ({ ans, to }) => {
    console.log(`Call answered by ${socket.id} to ${to}`);
    socket.to(to).emit("inanswer:call", { from: socket.id, answer: ans });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit("user:left", socket.id);
    users.delete(socket.id);
    io.emit("updateUserList", Array.from(users.values())); // Emit the updated user list
  });
});

// Serve static files from the client1 directory
app.use(express.static(path.resolve(__dirname, "../client")));

// Get list of connected users
app.get("/", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "../client/index.html"));
});

// Start the server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

