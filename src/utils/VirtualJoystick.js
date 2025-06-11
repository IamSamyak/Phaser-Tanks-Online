// export default class VirtualJoystick {
//   constructor(scene, x, y) {
//     this.scene = scene;
//     this.x = x;
//     this.y = y;
//     this.radius = 50;

//     // Create joystick base
//     this.base = this.scene.add.circle(x, y, this.radius, 0x555555, 0.5);

//     // Create joystick thumb (movable part)
//     this.thumb = this.scene.add.circle(x, y, this.radius / 2, 0xffffff, 0.8);
//     this.thumb.setInteractive();
//     this.scene.input.setDraggable(this.thumb);

//     this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
//       if (gameObject === this.thumb) {
//         let dx = dragX - this.x;
//         let dy = dragY - this.y;
//         let distance = Math.sqrt(dx * dx + dy * dy);

//         // Constrain thumb within joystick base
//         if (distance > this.radius) {
//           let angle = Math.atan2(dy, dx);
//           dragX = this.x + Math.cos(angle) * this.radius;
//           dragY = this.y + Math.sin(angle) * this.radius;
//         }

//         this.thumb.x = dragX;
//         this.thumb.y = dragY;
//         this.updateMovement(dx, dy);
//       }
//     });

//     this.scene.input.on('dragend', () => {
//       this.thumb.x = this.x;
//       this.thumb.y = this.y;
//     });
//   }

//   updateMovement(dx, dy) {
//     let angle = Math.atan2(dy, dx);
//     if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
//       if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
//         this.scene.events.emit('joystickMove', 'right');
//       } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
//         this.scene.events.emit('joystickMove', 'down');
//       } else if (angle < -Math.PI / 4 && angle > (-3 * Math.PI) / 4) {
//         this.scene.events.emit('joystickMove', 'up');
//       } else {
//         this.scene.events.emit('joystickMove', 'left');
//       }
//     }
//   }
// }
