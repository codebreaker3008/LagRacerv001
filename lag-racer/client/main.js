import Phaser from 'phaser';
import { io } from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

// Game variables
let player;
let otherPlayers = {};
let cursors;
let walls;
let checkpoints;
let currentCheckpoint = 0;
let currentLap = 0;
let powerups = { lagBomb: 1, ghost: 1, rewind: 1 };
let isGhostMode = false;
let isLagged = false;
let laggedUntil = 0;
let lastPositions = [];
let scene; // Store scene reference

function preload() {
  // Nothing to preload - we'll draw everything
}

function create() {
  scene = this;
  
  // Create track first
  createTrack(scene);
  
  // THEN create player
  createPlayer(scene);
  
  // Setup controls
  cursors = scene.input.keyboard.createCursorKeys();
  scene.input.keyboard.on('keydown-ONE', () => usePowerup('lagBomb'));
  scene.input.keyboard.on('keydown-TWO', () => usePowerup('ghost'));
  scene.input.keyboard.on('keydown-THREE', () => usePowerup('rewind'));
  
  // Socket events
  setupSocketEvents(scene);
  
  // Camera
scene.cameras.main.setZoom(0.68);
scene.cameras.main.centerOn(600, 400);
scene.cameras.main.setScroll(0, 0);
  
  console.log('✅ Game created successfully!');
}

function createPlayer(scene) {
  // Create player sprite
  player = scene.physics.add.sprite(150, 400, null);
  
  // Draw player car as a simple shape
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xff0000, 1);
  
  // Draw car pointing UP (important for rotation to work right)
  graphics.fillRect(0, 0, 30, 50);
  
  graphics.generateTexture('playerCar', 30, 50);
  graphics.destroy();
  
  player.setTexture('playerCar');
  player.setDisplaySize(30, 50);
  player.setCollideWorldBounds(true);
  
  // UPDATED PHYSICS - Better handling
  player.setDrag(50); // Less drag = more slide
  player.setAngularDrag(0); // No angular drag
  player.setMaxVelocity(400); // Slightly faster
  player.body.useDamping = true; // Smoother deceleration
  player.setFriction(0.1); // Add some friction
  
  // Initial rotation (face right/forward)
  player.angle = 90;
  
  // NOW setup collisions (after both player and walls exist)
  if (walls) {
    scene.physics.add.collider(player, walls, null, () => {
      return !isGhostMode;
    });
  }
  
  // Setup checkpoint overlaps
  if (checkpoints) {
    scene.physics.add.overlap(player, checkpoints, hitCheckpoint, null, scene);
  }
  
  console.log('✅ Player created');
}

function createTrack(scene) {
  walls = scene.physics.add.staticGroup();
  
  // Draw track outline
  const trackGraphics = scene.add.graphics();
  trackGraphics.lineStyle(10, 0x444444, 1);
  
  // Outer boundary
  trackGraphics.strokeRect(50, 50, 1100, 700);
  
  // Inner boundary  
  trackGraphics.strokeRect(200, 200, 800, 400);
  
  // Create actual physics walls
  // Top outer wall
  const topWall = walls.create(600, 50, null);
  topWall.setDisplaySize(1100, 20);
  topWall.body.updateFromGameObject();
  topWall.setTint(0x333333);
  
  // Bottom outer wall
  const bottomWall = walls.create(600, 750, null);
  bottomWall.setDisplaySize(1100, 20);
  bottomWall.body.updateFromGameObject();
  bottomWall.setTint(0x333333);
  
  // Left outer wall
  const leftWall = walls.create(50, 400, null);
  leftWall.setDisplaySize(20, 700);
  leftWall.body.updateFromGameObject();
  leftWall.setTint(0x333333);
  
  // Right outer wall
  const rightWall = walls.create(1150, 400, null);
  rightWall.setDisplaySize(20, 700);
  rightWall.body.updateFromGameObject();
  rightWall.setTint(0x333333);
  
  // Top inner wall
  const topInner = walls.create(600, 200, null);
  topInner.setDisplaySize(800, 20);
  topInner.body.updateFromGameObject();
  topInner.setTint(0x333333);
  
  // Bottom inner wall
  const bottomInner = walls.create(600, 600, null);
  bottomInner.setDisplaySize(800, 20);
  bottomInner.body.updateFromGameObject();
  bottomInner.setTint(0x333333);
  
  // Left inner wall
  const leftInner = walls.create(200, 400, null);
  leftInner.setDisplaySize(20, 400);
  leftInner.body.updateFromGameObject();
  leftInner.setTint(0x333333);
  
  // Right inner wall
  const rightInner = walls.create(1000, 400, null);
  rightInner.setDisplaySize(20, 400);
  rightInner.body.updateFromGameObject();
  rightInner.setTint(0x333333);
  
  // Create checkpoints
  checkpoints = scene.physics.add.staticGroup();
  
  const cp0 = checkpoints.create(150, 125, null);
  cp0.setDisplaySize(40, 40);
  cp0.body.updateFromGameObject();
  cp0.setTint(0x00ff00);
  cp0.setAlpha(0.5);
  cp0.checkpointId = 0;
  
  const cp1 = checkpoints.create(1050, 125, null);
  cp1.setDisplaySize(40, 40);
  cp1.body.updateFromGameObject();
  cp1.setTint(0x00ff00);
  cp1.setAlpha(0.5);
  cp1.checkpointId = 1;
  
  const cp2 = checkpoints.create(1050, 675, null);
  cp2.setDisplaySize(40, 40);
  cp2.body.updateFromGameObject();
  cp2.setTint(0x00ff00);
  cp2.setAlpha(0.5);
  cp2.checkpointId = 2;
  
  const cp3 = checkpoints.create(150, 675, null);
  cp3.setDisplaySize(40, 40);
  cp3.body.updateFromGameObject();
  cp3.setTint(0x00ff00);
  cp3.setAlpha(0.5);
  cp3.checkpointId = 3;
  
  // Add checkpoint labels
  scene.add.text(140, 115, '0', { fontSize: '16px', color: '#00ff00' });
  scene.add.text(1040, 115, '1', { fontSize: '16px', color: '#00ff00' });
  scene.add.text(1040, 665, '2', { fontSize: '16px', color: '#00ff00' });
  scene.add.text(140, 665, '3', { fontSize: '16px', color: '#00ff00' });
  
  console.log('✅ Track created');
}

function setupSocketEvents(scene) {
  socket.on('connect', () => {
    console.log('✅ Connected to server!', socket.id);
    document.getElementById('connection-status').textContent = '✅ CONNECTED';
    document.getElementById('connection-status').style.color = '#00ff00';
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    document.getElementById('connection-status').textContent = '❌ DISCONNECTED';
    document.getElementById('connection-status').style.color = '#ff0000';
  });
  
  socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
      if (id !== socket.id) {
        addOtherPlayer(scene, players[id]);
      }
    });
  });
  
  socket.on('newPlayer', (playerInfo) => {
    addOtherPlayer(scene, playerInfo);
  });
  
  socket.on('playerMoved', (playerInfo) => {
    if (otherPlayers[playerInfo.id]) {
      otherPlayers[playerInfo.id].x = playerInfo.x;
      otherPlayers[playerInfo.id].y = playerInfo.y;
      otherPlayers[playerInfo.id].rotation = playerInfo.rotation;
    }
  });
  
  socket.on('playerDisconnected', (playerId) => {
    if (otherPlayers[playerId]) {
      otherPlayers[playerId].destroy();
      delete otherPlayers[playerId];
    }
  });
  
  socket.on('lagBombHit', (data) => {
    activateLag(data.duration);
  });
  
  socket.on('ghostActivated', (data) => {
    activateGhost(data.duration);
  });
  
  socket.on('rewindActivated', () => {
    activateRewind();
  });
  
  socket.on('powerupUsed', (type) => {
    powerups[type]--;
    updatePowerupUI();
  });
  
  socket.on('lapCompleted', (data) => {
    if (data.id === socket.id) {
      currentLap = data.lap;
      document.getElementById('lap').textContent = currentLap;
    }
  });
}

function addOtherPlayer(scene, playerInfo) {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x0000ff, 1);
  graphics.fillRect(0, 0, 30, 50);
  graphics.generateTexture('otherCar', 30, 50);
  graphics.destroy();
  
  const otherPlayer = scene.add.sprite(playerInfo.x, playerInfo.y, 'otherCar');
  otherPlayer.setDisplaySize(30, 50);
  otherPlayer.playerId = playerInfo.id;
  otherPlayers[playerInfo.id] = otherPlayer;
  
  console.log('Added other player:', playerInfo.id);
}

function update(time, delta) {
  if (!player || !player.body) return;
  
  // Save position history for rewind
  if (time % 100 < delta) {
    lastPositions.push({ 
      x: player.x, 
      y: player.y, 
      rotation: player.rotation 
    });
    if (lastPositions.length > 30) lastPositions.shift();
  }
  
  // Check if lag expired
  if (isLagged && time > laggedUntil) {
    isLagged = false;
    document.getElementById('lag-indicator').style.display = 'none';
  }
  
  // BETTER ARCADE RACING CONTROLS
// TANK CONTROLS (Like Mario Kart / Classic Arcade)
// DRIFTY ARCADE CONTROLS (Most Fun!)
if (!isLagged) {
  const acceleration = 20;
  const maxSpeed = 400;
  const turnSpeed = 3.5;
  const drift = 0.94; // Higher = more drift
  
  let currentSpeed = Math.sqrt(
    player.body.velocity.x ** 2 + player.body.velocity.y ** 2
  );
  
  // Apply drift/friction
  player.setVelocity(
    player.body.velocity.x * drift,
    player.body.velocity.y * drift
  );
  
  // Accelerate
  if (cursors.up.isDown) {
    const angle = player.rotation - Math.PI / 2;
    player.setVelocity(
      player.body.velocity.x + Math.cos(angle) * acceleration,
      player.body.velocity.y + Math.sin(angle) * acceleration
    );
    
    // Cap speed
    currentSpeed = Math.sqrt(player.body.velocity.x ** 2 + player.body.velocity.y ** 2);
    if (currentSpeed > maxSpeed) {
      player.setVelocity(
        player.body.velocity.x * (maxSpeed / currentSpeed),
        player.body.velocity.y * (maxSpeed / currentSpeed)
      );
    }
  }
  
  // Brake
  if (cursors.down.isDown) {
    player.setVelocity(
      player.body.velocity.x * 0.9,
      player.body.velocity.y * 0.9
    );
  }
  
  // Steering - scales with speed for realistic feel
  const steerInfluence = Math.min(currentSpeed / 100, 1.5);
  if (cursors.left.isDown) {
    player.angle -= turnSpeed * steerInfluence;
  }
  if (cursors.right.isDown) {
    player.angle += turnSpeed * steerInfluence;
  }
  
  // Align velocity to car direction slightly (reduces side-sliding)
  if (currentSpeed > 50 && cursors.up.isDown) {
    const angle = player.rotation - Math.PI / 2;
    const targetVelX = Math.cos(angle) * currentSpeed;
    const targetVelY = Math.sin(angle) * currentSpeed;
    
    player.setVelocity(
      player.body.velocity.x * 0.95 + targetVelX * 0.05,
      player.body.velocity.y * 0.95 + targetVelY * 0.05
    );
  }
  
  // Send position to server
  if (time % 50 < delta) {
    socket.emit('playerMovement', {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
      velocity: { x: player.body.velocity.x, y: player.body.velocity.y }
    });
  }
}
  
  // Update FPS
  if (time % 500 < delta) {
    document.getElementById('fps').textContent = Math.round(game.loop.actualFps);
  }
}


function hitCheckpoint(player, checkpoint) {
  // Check if this is the next checkpoint in sequence
  if (checkpoint.checkpointId === currentCheckpoint) {
    currentCheckpoint++;
    
    // If we completed all checkpoints, increment lap
    if (currentCheckpoint > 3) {
      currentCheckpoint = 0;
      currentLap++;
      document.getElementById('lap').textContent = currentLap;
      socket.emit('checkpointReached', 0);
      
      // Flash effect
      scene.cameras.main.flash(300, 0, 255, 0);
    } else {
      socket.emit('checkpointReached', checkpoint.checkpointId);
    }
    
    // Visual feedback
    checkpoint.setTint(0xffff00);
    setTimeout(() => checkpoint.setTint(0x00ff00), 200);
  }
}

function usePowerup(type) {
  if (powerups[type] <= 0) {
    console.log('No', type, 'powerups left!');
    return;
  }
  
  console.log('Using powerup:', type);
  
  if (type === 'lagBomb') {
    const otherPlayerIds = Object.keys(otherPlayers);
    if (otherPlayerIds.length > 0) {
      const targetId = otherPlayerIds[0];
      socket.emit('useLagBomb', targetId);
      console.log('Lag bomb sent to', targetId);
    } else {
      console.log('No other players to target!');
    }
  } else if (type === 'ghost') {
    socket.emit('useGhost');
  } else if (type === 'rewind') {
    socket.emit('useRewind');
  }
}

function activateLag(duration) {
  console.log('💥 LAG BOMB HIT! Lagged for', duration, 'ms');
  isLagged = true;
  laggedUntil = Date.now() + duration;
  document.getElementById('lag-indicator').style.display = 'block';
  
  // Screen shake
  scene.cameras.main.shake(duration, 0.005);
  
  // Stop player
  player.setVelocity(0, 0);
  player.setAngularVelocity(0);
}

function activateGhost(duration) {
  console.log('👻 GHOST MODE ACTIVATED!');
  isGhostMode = true;
  player.setTint(0x00ffff);
  player.setAlpha(0.5);
  
  setTimeout(() => {
    isGhostMode = false;
    player.clearTint();
    player.setAlpha(1);
    console.log('Ghost mode ended');
  }, duration);
}

function activateRewind() {
  console.log('⏪ REWIND ACTIVATED!');
  if (lastPositions.length > 5) {
    const rewindPos = lastPositions[Math.floor(lastPositions.length * 0.3)];
    player.setPosition(rewindPos.x, rewindPos.y);
    player.setRotation(rewindPos.rotation);
    player.setVelocity(0, 0);
    
    // Glitch effect
    scene.cameras.main.flash(200, 255, 255, 0);
  }
}

function updatePowerupUI() {
  document.getElementById('lagbomb-count').textContent = powerups.lagBomb;
  document.getElementById('ghost-count').textContent = powerups.ghost;
  document.getElementById('rewind-count').textContent = powerups.rewind;
}

// Initial UI
updatePowerupUI();
document.getElementById('lap').textContent = currentLap;