

# 🕹️ Phaser Tanks Online

Phaser Tanks Online is a top-down multiplayer tank game inspired by classic 1990s arcade games. It uses Phaser 3 for the frontend and Java Spring Boot with WebSocket for the backend. Two players can play together in a room and fight off enemies controlled by backend AI.


## 🚀 Features

- 👥 Multiplayer: Two players per room using a 4-digit room code  
- 🔄 Real-time WebSocket communication  
- 🤖 Backend-controlled enemy movements  
- 🧱 Grid-based map with collision handling  
- 💥 Bullet shooting and destruction  
- 🎮 Joystick + keyboard controls  
- 🖥️ Frontend built with Phaser 3  
- ⚙️ Backend built with Spring Boot  


## 🛠️ Technologies Used

### 🎨 Frontend
- ⚡ Phaser 3  
- 💻 JavaScript  
- 🔌 WebSocket  
- 🎮 rexVirtualJoystick (for mobile/touch controls)

### 🔧 Backend
- ☕ Java 17+  
- 🌱 Spring Boot  
- 🔌 WebSocket  
- 🧵 Java concurrency  
- 🗺️ Grid-based map management



## ▶️ How to Run

### 1.  Run Backend (Java Spring Boot)
```bash
git clone https://github.com/IamSamyak/Phaser-Tank-Backend
cd Phaser-Tank-Backend
mvn spring-boot:run
```
### 2. Run Frontend (Phaser Game)

```bash
git clone https://github.com/IamSamyak/Phaser-Tanks-Online.git
cd Phaser-Tanks-Online
npm install
npm run dev
```

Open your browser and go to the local URL shown (usually  `http://localhost:5173/`).


## 🎯 How to Play

1. 🧑 Player 1 creates a room and receives a 4-digit room ID
2. 👨‍🦰 Player 2 enters the same ID to join
3. 🌍 Both players see the same game world
4. ⌨️ Move using keyboard or joystick
5. 🔫 Shoot enemies and defend the base

## 🧭 Future Improvements

-   🔋 Power-ups and health system
-   🏆 Leaderboard and scoring
-   🗂️ Room browser and chat
-   🛸 More enemy types and behaviors
-   🗺️ Map editor and random level rotation

## 📄 License

MIT License - you are free to use, modify, and distribute.
