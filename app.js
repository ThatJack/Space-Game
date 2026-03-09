//load image texture
function loadTexture(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image: ${path}"));
    };
  });
}

//GameObject classes
class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }
}

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function drawGameObjects(ctx) {
  gameObjects.forEach((obj) => obj.draw(ctx));
}

function updateGameObjects() {
  const enemies = gameObjects.filter((obj) => obj.type === "Enemy");
  const lasers = gameObjects.filter((obj) => obj.type === "Laser");

  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (
        intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())
      ) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy,
        });
      }
    });
  });

  //remove dead objects
  gameObjects = gameObjects.filter((obj) => !obj.dead);
}

class Player extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 75;
    this.type = "Hero";
    this.speed = 5;
    this.cooldown = 0;
  }

  fire() {
    gameObjects.push(new Laser(this.x + 45, this.y - 10));
    this.cooldown = 500;

    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
      } else {
        clearInterval(id);
      }
    }, 200);
  }

  canFire() {
    return this.cooldown === 0;
  }
}

//initialize player at bottom centre of screen
function createPlayer() {
  player = new Player(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
  player.img = playerImg;
  gameObjects.push(player);
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;

    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    //automatically move down until reaching bottom of screen
    const id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        console.log("Stopped at", this.y);
        clearInterval(id);
      }
    }, 300);
  }
}

//event handling
class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  //register listeners for a message
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  //inform listeners of message emission
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
      console.log("emitted message event: ", message);
    }
  }
}
const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_PLAYER: "COLLISION_ENEMY_PLAYER",
};

const onKeydown = function (e) {
  //block default behaviour on arrow keys and space bar
  switch (e.code) {
    case 37:
    case 39:
    case 38:
    case 40:
    case 32:
      e.preventDefault();
      break;
    default:
      break;
  }
};
window.addEventListener("keydown", onKeydown);

//emit events when a key is lifted
window.addEventListener("keyup", (evt) => {
  if (evt.code === "KeyW") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.code === "KeyS") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  }
  if (evt.code === "KeyA") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.code === "KeyD") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  }
  if (evt.code === "Space") {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  }
});

let playerImg,
  enemyImg,
  laserImg,
  canvas,
  ctx,
  gameObjects = [],
  player,
  eventEmitter = new EventEmitter();

function initGame() {
  gameObjects = [];
  createEnemies(ctx, canvas, enemyImg);
  createPlayer();

  //register player for key events
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    player.y -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    player.y += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    player.x -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    player.x += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    //fire laser
    if (player.canFire()) {
      player.fire();
    }
  });

  //collision handling
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
  });
}

function createEnemies(ctx, canvas, enemyImg) {
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  //create pattern of enemies
  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

window.onload = async () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  //load textures asynchronously
  enemyImg = await loadTexture("assets/enemyShip.png");
  playerImg = await loadTexture("assets/player.png");
  laserImg = await loadTexture("assets/laserRed.png");

  //game setup and loop
  initGame();
  const gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameObjects(ctx);
    updateGameObjects();
  }, 100);
};
