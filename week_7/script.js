const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: "game-container",
    backgroundColor: "#031403",
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: {
        create,
        update
    }
};
// Game logic has been done with assistance of Github copilot

const game = new Phaser.Game(config);

let player;
let cursors;
let fireKey;
let bullets;
let enemies;
let collectibles;
let scoreText;
let livesText;
let gameOverText;

let score = 0;
let lives = 3;
let lastShotTime = 0;
let playerIsInvulnerable = false;
let isGameOver = false;

function create() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(0x00ff66, 1);
    gfx.fillRect(0, 0, 34, 20);
    gfx.fillStyle(0x003311, 1);
    gfx.fillRect(4, 4, 26, 12);
    gfx.generateTexture("player-ship", 34, 20);
    gfx.clear();

    gfx.fillStyle(0xff3366, 1);
    gfx.fillRect(0, 0, 28, 18);
    gfx.fillStyle(0x5c001a, 1);
    gfx.fillRect(4, 4, 20, 10);
    gfx.generateTexture("enemy-ship", 28, 18);
    gfx.clear();

    gfx.fillStyle(0x66ff66, 1);
    gfx.fillRect(0, 0, 4, 12);
    gfx.generateTexture("laser", 4, 12);
    gfx.clear();

    gfx.fillStyle(0x33cc33, 1);
    gfx.fillCircle(8, 8, 8);
    gfx.generateTexture("item-small", 16, 16);
    gfx.clear();

    gfx.fillStyle(0x00ffff, 1);
    gfx.fillCircle(10, 10, 10);
    gfx.generateTexture("item-big", 20, 20);
    gfx.destroy();

    player = this.physics.add.image(400, 450, "player-ship");
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    bullets = this.physics.add.group({
        defaultKey: "laser",
        maxSize: 20
    });

    enemies = this.physics.add.group();
    for (let i = 0; i < 6; i += 1) {
        const enemy = enemies.create(100 + i * 110, 70, "enemy-ship");
        enemy.setData("speedX", Phaser.Math.Between(60, 120));
    }

    collectibles = this.physics.add.group();
    for (let i = 0; i < 4; i += 1) {
        spawnCollectible(this, "item-small", 10);
    }
    for (let i = 0; i < 2; i += 1) {
        spawnCollectible(this, "item-big", 25);
    }

    scoreText = this.add.text(16, 10, "Score: 0", {
        fontSize: "20px",
        color: "#99ff99"
    });
    livesText = this.add.text(16, 36, "Lives: 3", {
        fontSize: "20px",
        color: "#99ff99"
    });
    gameOverText = this.add.text(400, 250, "", {
        fontSize: "42px",
        color: "#ff4444"
    }).setOrigin(0.5);

    this.physics.add.overlap(player, collectibles, collectItem, null, this);
    this.physics.add.overlap(bullets, enemies, shootEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitByEnemy, null, this);
}

function update(time, delta) {
    if (isGameOver) {
        player.setVelocity(0, 0);
        return;
    }

    player.setVelocity(0, 0);
    const playerSpeed = 220;

    if (cursors.left.isDown) {
        player.setVelocityX(-playerSpeed);
    } else if (cursors.right.isDown) {
        player.setVelocityX(playerSpeed);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-playerSpeed);
    } else if (cursors.down.isDown) {
        player.setVelocityY(playerSpeed);
    }

    if (fireKey.isDown && time - lastShotTime > 220) {
        fireBullet.call(this, time);
    }

    enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
            return;
        }

        enemy.x += (enemy.getData("speedX") * delta) / 1000;
        if (enemy.x >= 780 || enemy.x <= 20) {
            enemy.setData("speedX", -enemy.getData("speedX"));
            enemy.y = Phaser.Math.Clamp(enemy.y + 14, 55, 180);
        }
    });

    collectibles.children.iterate((item) => {
        if (!item || !item.active) {
            return;
        }

        item.y += (item.getData("fallSpeed") * delta) / 1000;
        if (item.y > 520) {
            resetCollectible(item);
        }
    });

    bullets.children.iterate((bullet) => {
        if (!bullet || !bullet.active) {
            return;
        }

        bullet.y -= 450 * (delta / 1000);
        if (bullet.y < -20) {
            bullet.setActive(false);
            bullet.setVisible(false);
        }
    });
}

function fireBullet(time) {
    const bullet = bullets.get(player.x, player.y - 18);
    if (!bullet) {
        return;
    }

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.enable = true;
    lastShotTime = time;
}

function spawnCollectible(scene, texture, value) {
    const item = collectibles.create(
        Phaser.Math.Between(30, 770),
        Phaser.Math.Between(60, 350),
        texture
    );
    item.setData("value", value);
    item.setData("fallSpeed", Phaser.Math.Between(70, 130));
}

function resetCollectible(item) {
    item.x = Phaser.Math.Between(30, 770);
    item.y = Phaser.Math.Between(-80, -20);
    item.setData("fallSpeed", Phaser.Math.Between(70, 130));
}

function collectItem(playerShip, item) {
    score += item.getData("value");
    scoreText.setText(`Score: ${score}`);
    resetCollectible(item);
}

function shootEnemy(bullet, enemy) {
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.enable = false;

    score += 50;
    scoreText.setText(`Score: ${score}`);

    enemy.x = Phaser.Math.Between(30, 770);
    enemy.y = Phaser.Math.Between(50, 130);
    enemy.setData("speedX", Phaser.Math.Between(60, 120) * (Math.random() < 0.5 ? -1 : 1));
}

function hitByEnemy(playerShip, enemy) {
    if (playerIsInvulnerable) {
        return;
    }

    lives -= 1;
    livesText.setText(`Lives: ${lives}`);
    playerIsInvulnerable = true;

    enemy.x = Phaser.Math.Between(30, 770);
    enemy.y = 60;

    player.setAlpha(0.4);
    this.time.delayedCall(700, () => {
        player.setAlpha(1);
        playerIsInvulnerable = false;
    });

    if (lives <= 0) {
        isGameOver = true;
        gameOverText.setText("GAME OVER");
    }
}