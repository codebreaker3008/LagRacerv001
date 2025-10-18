# 🏎️💥 LAG RACER v0.0.1 ALPHA

> *In a dying world, even mistakes are useful.*

## What does it do?

Lag Racer is a multiplayer racing game where **every bug became a feature**. Network lag? That's a weapon. Wall clipping? That's a powerup. Position desync? That's a strategic ability.

Race against friends in an intentionally broken multiplayer arena where the bugs are the game.

### "Features" (All Former Bugs)

- **💣 Lag Bomb** - Freeze opponents with forced server lag (2000ms delay)
- **👻 Ghost Mode** - Phase through walls using collision detection failures  
- **⏪ Rewind** - Exploit position desync to teleport backward
- **🌐 Unstable Connection** - Random lag spikes make every race unpredictable
- **📟 Glitch Aesthetic** - Screen shake, CONNECTION INTERRUPTED messages, jittery opponents

## How did you build it?

**Tech Stack:**
- Frontend: Phaser.js (game engine), Socket.io-client, Vite
- Backend: Node.js, Express, Socket.io
- Physics: Arcade physics with custom drifty controls
- Multiplayer: Real-time WebSocket (intentionally unoptimized)

**The Process:**
1. Started building a racing game at 3 AM
2. Everything broke by 6 AM (lag, desyncs, wall clipping)
3. Tried to fix it. Failed.
4. 10 AM: Had an epiphany - "What if the lag IS the game?"
5. Renamed all bugs to "mechanics"
6. Added visual effects to make bugs look intentional
7. Shipped it at 11:59 PM

**Design Philosophy:** 
> "If it's not broken, break it. Then call it a feature."

## Why is it cursed/awesome?

**Cursed because:**
- The server has intentional lag simulation (`addLag()` function)
- Collision detection can be turned off on demand
- Position updates are deliberately desynced
- The game gets WORSE with more players (and that's the point)
- Debug mode is always visible
- "Known Issues: Everything"

**Awesome because:**
- Every rage-inducing bug from real multiplayer games is now strategic
- You can weaponize lag against your friends
- The meta-commentary: the game IS the hackathon experience
- It's actually fun (somehow)
- Players ask "Is it broken or am I bad at driving?" (Answer: Yes)

## How to Run
```bash
# Server
cd server
npm install
npm start

# Client (different terminal)
cd client  
npm install
npm run dev
```

Open `http://localhost:3000` in 2-4 browser tabs for multiplayer chaos.

## Controls

- **Arrow Keys** - Drive (with intentional drift)
- **1** - Lag Bomb (freeze opponent)
- **2** - Ghost Mode (phase through walls)
- **3** - Rewind (teleport backward)

## Known Issues

- Everything lags ✅ (feature)
- Cars teleport randomly ✅ (feature)
- Collisions are optional ✅ (feature)
- Server crashes sometimes ✅ (enhances apocalypse theme)
- Other players look jittery ✅ (retro aesthetic)

**Status:** Working as intended

## Cursed Proof
<img width="1885" height="887" alt="Screenshot 2025-10-18 205039" src="https://github.com/user-attachments/assets/1b70c046-c0bf-48ae-b980-f95cb0187082" />
<img width="1865" height="876" alt="Screenshot 2025-10-18 205025" src="https://github.com/user-attachments/assets/d539a709-9538-4a0c-baeb-7863dcf0b585" />


## License

MIT - Do whatever you want. It's already broken anyway.

---

*"We didn't make a racing game that broke. We made a racing game where broken IS the game."*
