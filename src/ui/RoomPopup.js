export default class RoomPopup {
  constructor(scene, onJoinOrCreate) {
    this.scene = scene;
    this.onJoinOrCreate = onJoinOrCreate;
    this.createPopup();
  }

  createPopup() {
    const container = document.createElement('div');
    container.id = 'room-popup';
    container.style.position = 'absolute';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.backgroundColor = '#222';
    container.style.color = '#fff';
    container.style.padding = '20px';
    container.style.borderRadius = '10px';
    container.style.textAlign = 'center';
    container.style.zIndex = '1000';

    container.innerHTML = `
      <h3>Enter Room ID or Create New</h3>
      <input id="room-id-input" type="text" placeholder="Room ID (optional)" style="padding: 5px; width: 80%;" />
      <br><br>
      <label for="level-select">Choose Level:</label>
      <select id="level-select" style="margin-top: 5px;">
        <option value="1">Level 1</option>
        <option value="2">Level 2</option>
        <option value="3">Level 3</option>
      </select>
      <br><br>
      <button id="join-room-btn" style="margin-right: 10px;">Join Room</button>
      <button id="create-room-btn">Create Room</button>
    `;

    document.body.appendChild(container);

    document.getElementById('join-room-btn').onclick = () => {
      const roomId = document.getElementById('room-id-input').value.trim();
      if (roomId) {
        this.destroy();
        this.onJoinOrCreate(roomId); // joining doesn't need level
      } else {
        alert('Enter a Room ID to join.');
      }
    };

    document.getElementById('create-room-btn').onclick = () => {
      const level = document.getElementById('level-select').value;
      this.destroy();
      this.onJoinOrCreate(null, level); // pass level when creating
    };
  }

  destroy() {
    const popup = document.getElementById('room-popup');
    if (popup) {
      popup.remove();
    }
  }
}
