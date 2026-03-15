let gameLoopId;

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

//collision detection
function updateGameObjects() {
  const enemies = gameObjects.filter((obj) => obj.type === "Enemy");
  const lasers = gameObjects.filter((obj) => obj.type === "Laser");

  //laser/enemy collision
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

  enemies.forEach((enemy) => {
    const playerRect = player.rectFromGameObject();
    if (intersectRect(playerRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_PLAYER, { enemy });
    }
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
    this.life = 3;
    this.points = 0;
  }

  //weapon controls
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

  //life system
  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }

  incrementPoints() {
    this.points += 100;
  }
}

//initialize player at bottom centre of screen
function createPlayer() {
  player = new Player(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
  player.img = playerImg;
  gameObjects.push(player);
}

function isPlayerDead() {
  return player.life <= 0;
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;
    playSfx(laserSound);

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
        clearInterval(id);
      }
    }, 300);
  }
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

function isEnemiesDead() {
  const enemies = gameObjects.filter(
    (obj) => obj.type === "Enemy" && !obj.dead,
  );
  return enemies.length === 0;
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
      //console.log("emitted message event: ", message);
    }
  }

  clear() {
    this.listeners = {};
  }
}
const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_PLAYER: "COLLISION_ENEMY_PLAYER",
  GAME_END_WIN: "GAME_END_WIN",
  GAME_END_LOSS: "GAME_END_LOSS",
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
  if (e.code === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
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

//audio
const laserSound = new Audio("assets/laser.wav");
const explosionSound = new Audio("assets/explosion.wav");

function playSfx(sfx) {
  sfx.currentTime = 0;
  sfx.play();
}

let playerImg,
  enemyImg,
  laserImg,
  lifeImg,
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
    player.incrementPoints();
    playSfx(explosionSound);

    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_PLAYER, (_, { enemy }) => {
    enemy.dead = true;
    player.decrementLife();
    playSfx(explosionSound);

    if (isPlayerDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return;
    }
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  //game win/loss
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });
}

function endGame(win) {
  clearInterval(gameLoopId);

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage("Victory!!\n-Press [Enter] to begin a new game-", "green");
    } else {
      displayMessage("You Died!!\n-Press [Enter] to begin a new game-");
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    eventEmitter.clear();
    initGame();
    gameLoopId = setInterval(gameLoop);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGameObjects(ctx);
  updateGameObjects();
  drawPoints();
  drawLife();
}

//life and point system and ui
function drawLife() {
  const START_POS = canvas.width - 180;
  for (let i = 0; i < player.life; i++) {
    ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  ctx.fillText("Points: " + player.points, 10, canvas.height - 20);
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

window.onload = async () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  //load textures asynchronously
  enemyImg = await loadTexture("assets/enemyShip.png");
  playerImg = await loadTexture("assets/player.png");
  laserImg = await loadTexture("assets/laserRed.png");
  lifeImg = await loadTexture("assets/life.png");

  //game setup and loop
  initGame();
  gameLoopId = setInterval(gameLoop, 100);
};
