//game objects
const gameObject = {
  x: 0,
  y: 0,
  type: "",
};

const moveable = {
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  },
};

const moveableObject = { ...gameObject, ...moveable };

function createHero(x, y) {
  return {
    ...moveableObject,
    x,
    y,
    type: "Hero",
  };
}

function createStatic(x, y, type) {
  return {
    ...gameObject,
    x,
    y,
    type,
  };
}

//event system
class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  //register listener for specific message type
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  //send message to all registered listeners
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((listener) => {
        listener(message, payload);
      });
    }
  }
}

const Messages = {
  HERO_MOVE_LEFT: "HERO_MOVE_LEFT",
  HERO_MOVE_RIGHT: "HERO_MOVE_RIGHT",
  ENEMY_SPOTTED: "ENEMY_SPOTTED",
};

const eventEmitter = new EventEmitter();
const hero = createHero(0, 0);

eventEmitter.on(Messages.HERO_MOVE_LEFT, () => {
  hero.moveTo(hero.x - 5, hero.y);
  console.log("Hero moved to ${hero.x}, ${hero.y}");
});

eventEmitter.on(Messages.HERO_MOVE_RIGHT, () => {
  hero.moveTo(hero.x + 5, hero.y);
  console.log("Hero moved to ${hero.x}, ${hero.y}");
});

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "A":
      eventEmitter.emit(Messages.HERO_MOVE_LEFT);
      break;
    case "D":
      eventEmitter.emit(Messages.HERO_MOVE_RIGHT);
      break;
  }
});
