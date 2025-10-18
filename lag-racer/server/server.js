const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const cors = require('cors');
app.use(cors());

// Game state
const players = {};
const LAG_SIMULATION = true; // The "bug" toggle

// Intentionally bad lag simulation
function addLag(callback, data) {
  if (LAG_SIMULATION && Math.random() > 0.7) {
    // Random lag between 100-800ms
    const lagTime = Math.floor(Math.random() * 700) + 100;
    setTimeout(() => callback(data), lagTime);
  } else {
    callback(data);
  }
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Initialize player
  players[socket.id] = {
    id: socket.id,
    x: 100,
    y: 300,
    rotation: 0,
    velocity: { x: 0, y: 0 },
    lap: 0,
    checkpoint: 0,
    powerups: {
      lagBomb: 1,
      ghost: 1,
      rewind: 1
    }
  };

  // Send existing players to new player
  socket.emit('currentPlayers', players);
  
  // Tell other players about new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle movement with intentional lag
  socket.on('playerMovement', (movementData) => {
    addLag((data) => {
      if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].rotation = data.rotation;
        players[socket.id].velocity = data.velocity;
        
        // Broadcast with additional desync
        socket.broadcast.emit('playerMoved', {
          id: socket.id,
          ...data
        });
      }
    }, movementData);
  });

  // Lag bomb powerup
  socket.on('useLagBomb', (targetId) => {
    if (players[socket.id]?.powerups.lagBomb > 0) {
      players[socket.id].powerups.lagBomb--;
      io.to(targetId).emit('lagBombHit', { duration: 2000 });
      socket.emit('powerupUsed', 'lagBomb');
    }
  });

  // Ghost mode (wall clipping)
  socket.on('useGhost', () => {
    if (players[socket.id]?.powerups.ghost > 0) {
      players[socket.id].powerups.ghost--;
      socket.emit('ghostActivated', { duration: 3000 });
      socket.emit('powerupUsed', 'ghost');
    }
  });

  // Rewind (position desync exploit)
  socket.on('useRewind', () => {
    if (players[socket.id]?.powerups.rewind > 0) {
      players[socket.id].powerups.rewind--;
      socket.emit('rewindActivated');
      socket.emit('powerupUsed', 'rewind');
    }
  });

  // Checkpoint system
  socket.on('checkpointReached', (checkpointId) => {
    if (players[socket.id]) {
      players[socket.id].checkpoint = checkpointId;
      if (checkpointId === 0) {
        players[socket.id].lap++;
        io.emit('lapCompleted', { id: socket.id, lap: players[socket.id].lap });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
  console.log(`🚗 Lag Racer Server running on port ${PORT}`);
  console.log(`⚠️  Lag simulation: ${LAG_SIMULATION ? 'ENABLED' : 'DISABLED'}`);
});