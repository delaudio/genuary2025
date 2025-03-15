const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const osc = require('node-osc');
const path = require('path');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create OSC server to receive messages from Ableton/Max
const oscServer = new osc.Server(7400, '0.0.0.0');

console.log('OSC server listening on port 7400');
console.log('Waiting for connections from Max/Ableton...');

// Handle incoming OSC messages from Ableton/Max
oscServer.on('message', (msg) => {
  const address = msg[0];
  const args = msg.slice(1);
  
  console.log(`Received OSC: ${address}`, args);
  
  // Forward the OSC data to all connected web clients
  io.emit('osc-data', {
    address: address,
    args: args
  });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Web client connected');
  
  // Let Ableton know when a client connects (optional)
  // You could set up a separate OSC client to send back to Ableton
  // const notifyClient = new osc.Client('127.0.0.1', 7500);
  // notifyClient.send('/threejs/client/connected', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Connect to this server from your browser to visualize Ableton data`);
}); 