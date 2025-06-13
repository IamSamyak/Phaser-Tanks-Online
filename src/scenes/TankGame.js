import Phaser from 'phaser';
import { setTileSize, TILE_SIZE, tileMapping } from '../utils/tileMapping.js';
import BulletManager from '../managers/BulletManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import TankController from '../managers/TankController.js';
import RoomPopup from '../ui/RoomPopup.js';
import { bonusTypes } from '../utils/bonusTypes.js';
import MessageHandler from '../managers/MessageHandler.js';
import CoordinateHelper from '../managers/CoordinateHelper.js';

export default class TankGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TankGame' });
  }

  preload() {
    this.load.image('brick', '/assets/tiles/brick.png');
    this.load.image('stone', '/assets/tiles/stone.png');
    this.load.image('bush', '/assets/tiles/bush.png');
    this.load.image('water', '/assets/tiles/water.png');
    this.load.image('ice', '/assets/tiles/ice.png');

    this.load.image('tank', '/assets/PlayerAssets/tankv1.png');
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('base', '/assets/base.png');
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 70,
      frameHeight: 65,
    });

    bonusTypes.forEach(bonus => {
      this.load.image(bonus.key, bonus.path);
    });
  }

  connectWebSocket(roomId, level = "1") {
    const wsUrl = roomId
      ? `ws://192.168.1.7:8080/ws/join/${roomId}`
      : `ws://192.168.1.7:8080/ws/create?level=${level}`;

    this.socket = new WebSocket(wsUrl);
    this.messageHandler = new MessageHandler(this, this.socket);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandler.handle(data);

      if (data.type === 'start') {
        this.players = [];
        this.playerId = data.playerId;
        this.players.push(data.playerId);
        this.roomId = data.roomId;
        console.log(`Connected to room ID: ${data.roomId} as Player ${data.playerId}`);

        this.levelMap = data.levelMap.map(line => [...line]);
        this.renderLevel(this.levelMap);

        this.tank = this.spawnManager.spawnTank(data.x, data.y, data.direction);
        this.asset = this.spawnManager.spawnAsset(13, 25, 'base', data.direction);

        this.initializeGameplay();
        this.showShareLinkUI(data.roomId);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  create() {
    this.spawnManager = new SpawnManager(this);

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    if (roomId) {
      this.connectWebSocket(roomId);
    } else {
      new RoomPopup(this, (roomId, level) => {
        this.connectWebSocket(roomId, level);
      });
    }

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
      frameRate: 1,
      hideOnComplete: true,
    });
  }

  calculateTileSize(levelMap) {
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    const cols = levelMap[0].length;
    const rows = levelMap.length;

    const tileSizeX = Math.floor(screenWidth / cols);
    const tileSizeY = Math.floor(screenHeight / rows);

    this.dynamicTileSize = Math.min(tileSizeX, tileSizeY);
  }

  renderLevel(levelMap) {
    this.calculateTileSize(levelMap);
    this.tileSprites = [];
    this.levelMap = levelMap;

    const totalWidth = levelMap[0].length * this.dynamicTileSize;
    const totalHeight = levelMap.length * this.dynamicTileSize;
    this.offsetX = (this.sys.game.config.width - totalWidth) / 2;
    this.offsetY = (this.sys.game.config.height - totalHeight) / 2;

    this.coordHelper = new CoordinateHelper(this.offsetX, this.offsetY, this.dynamicTileSize);

    for (let y = 0; y < levelMap.length; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < levelMap[y].length; x++) {
        const char = levelMap[y][x];
        const tileName = tileMapping[char];
        const { x: xPos, y: yPos } = this.coordHelper.toPixel(x, y);

        if (!tileName || tileName === 'empty') {
          this.tileSprites[y][x] = null;
          continue;
        }

        const tile = this.add.image(xPos, yPos, tileName);
        tile.setOrigin(0, 0);
        tile.setDisplaySize(this.dynamicTileSize, this.dynamicTileSize);
        this.tileSprites[y][x] = tile;
      }
    }

    // Optional debug grid
    for (let x = 0; x < levelMap[0].length; x++) {
      const { x: xPos } = this.coordHelper.toPixel(x, 0);
      this.add.text(xPos + 4, this.offsetY - 10, x.toString(), {
        fontSize: '10px',
        color: '#00ff00',
      });
    }

    for (let y = 0; y < levelMap.length; y++) {
      const { y: yPos } = this.coordHelper.toPixel(0, y);
      this.add.text(this.offsetX - 12, yPos + 2, y.toString(), {
        fontSize: '10px',
        color: '#00ff00',
      });
    }
  }

  initializeGameplay() {
    this.tankSpeed = 100;
    this.bulletSpeed = 100;
    this.bonusGroup = this.add.group();
    this.enemies = new Map();

    this.bulletManager = new BulletManager(this, this.levelMap, this, this.socket);
    this.tankController = new TankController(this, this.tank, this.bulletManager, this.levelMap);
  }

  spawnCollisionEffect(x, y) {
    this.spawnManager.spawnExplosion(x, y);
  }

  update(time) {
    if (!this.tank || !this.tankController) return;
    this.tankController.update(time);
  }

  showShareLinkUI(roomId) {
    const gameUrl = `${window.location.origin}?roomId=${roomId}`;
    const shareDiv = document.createElement('div');
    shareDiv.id = 'share-link-ui';
    shareDiv.style.position = 'absolute';
    shareDiv.style.top = '10px';
    shareDiv.style.right = '10px';
    shareDiv.style.backgroundColor = '#222';
    shareDiv.style.color = '#fff';
    shareDiv.style.padding = '10px';
    shareDiv.style.borderRadius = '8px';
    shareDiv.style.zIndex = 1000;
    shareDiv.innerHTML = `
      <div style="margin-bottom: 5px;">Room Link:</div>
      <input type="text" value="${gameUrl}" id="room-link" readonly style="width: 200px; margin-bottom: 5px;">
      <button id="copy-link">Copy</button>
    `;

    document.body.appendChild(shareDiv);

    document.getElementById('copy-link').onclick = () => {
      const input = document.getElementById('room-link');
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value)
        .then(() => alert('Room link copied to clipboard!'))
        .catch(() => alert('Failed to copy link.'));
    };
  }

  shutdownShareLinkUI() {
    const el = document.getElementById('share-link-ui');
    if (el) el.remove();
  }
}
