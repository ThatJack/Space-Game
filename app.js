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
}

class Player extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 75;
    this.type = "Hero";
    this.speed = 5;
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
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

  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }
}
const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};

const onKeydown = function (e) {
  console.log(e.keycode);
  //block default behaviour on arrow keys and space bar
  switch (e.keycode) {
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
  createEnemies();
  createPlayer();

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
}

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

function createEnemies(ctx, canvas, enemyImg) {
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

window.onload = async () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  //load textures
  const enemyImg = await loadTexture("assets/enemyShip.png");
  const playerImg = await loadTexture("assets/player.png");

  //draw
  //bg
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //player
  ctx.drawImage(
    playerImg,
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4,
  );

  createEnemies(ctx, canvas, enemyImg);
};
