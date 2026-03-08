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
