let state = "menu";

let player;
let platforms = [];
let coins = [];

let cameraY = 0;
let score = 0;

let jumpStreak = 0;
let lastJumpTime = 0;
let jumpBoost = 0;

let comboTextTimer = 0;

let money = Number(localStorage.getItem("money")) || 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;

let upgrades = {
    jump: Number(localStorage.getItem("jumpUpgrade")) || 16,
    speed: Number(localStorage.getItem("speedUpgrade")) || 5
};

class Player {
    constructor() {
        this.x = width / 2;
        this.y = 500;
        this.w = 30;
        this.h = 40;
        this.vx = 0;
        this.vy = 0;
    }

    update() {

        this.vx = 0;

        if (keyIsDown(LEFT_ARROW) || keyIsDown(65))
            this.vx = -upgrades.speed;

        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68))
            this.vx = upgrades.speed;

        this.vy += 0.4;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.w) this.x = width;
        if (this.x > width) this.x = -this.w;

        for (let p of platforms) {

            if (
                this.x + this.w > p.x &&
                this.x < p.x + p.w &&
                this.y + this.h > p.y &&
                this.y + this.h < p.y + 15 &&
                this.vy > 0
            ) {
                this.y = p.y - this.h;

                jumpStreak++;
                lastJumpTime = millis();
                comboTextTimer = 60;

                jumpBoost = min(jumpStreak * 0.6, 8);

                this.vy = -(upgrades.jump + jumpBoost);
            }
        }

        // reset combo
        if (millis() - lastJumpTime > 1800) {
            jumpStreak = 0;
            jumpBoost = 0;
        }

        for (let i = coins.length - 1; i >= 0; i--) {

            let c = coins[i];

            if (
                dist(
                    this.x + this.w / 2,
                    this.y + this.h / 2,
                    c.x,
                    c.y
                ) < 20
            ) {
                money += 10;
                localStorage.setItem("money", money);
                coins.splice(i, 1);
            }
        }

        let screenY = this.y - cameraY;

        if (screenY < 250) {
            let climb = 250 - screenY;
            cameraY -= climb;

            score += floor(climb);

            if (score > highScore) {
                highScore = score;
                localStorage.setItem("highScore", highScore);

                firebase.database()
                    .ref('/climbleaderboard/' )
                    .set({

                        username: chosenName,
                        score: highScore

                    });
            }
        }

        if (this.y > cameraY + height + 250) {
            state = "menu";
        }
    }

    draw() {
        fill(220, 50, 50);
        rect(this.x, this.y - cameraY, this.w, this.h, 5);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont("Arial");
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function startGame() {

    score = 0;
    cameraY = 0;

    player = new Player();

    platforms = [];
    coins = [];

    platforms.push({
        x: width / 2 - 80,
        y: 550,
        w: 160
    });

    for (let i = 1; i < 30; i++) {
        addPlatform(800 - i * 70);
    }

    state = "play";
}

function addPlatform(y) {

    let p = {
        x: random(50, width - 200),
        y: y,
        w: random(60, 120)
    };

    platforms.push(p);

    if (random() < 0.45) {
        coins.push({
            x: p.x + p.w / 2,
            y: p.y - 20
        });
    }
}

function generatePlatforms() {

    while (platforms.length < 50) {

        let highest = Math.min(...platforms.map(p => p.y));

        addPlatform(highest - random(70, 110));
    }

    platforms = platforms.filter(
        p => p.y - cameraY < height + 400
    );
}

function drawMenu() {

    background(70, 150, 220);

    textAlign(CENTER);

    fill(255);
    textSize(60);
    text("SUMMIT RUSH", width / 2, 100);

    textSize(25);
    text("High Score: " + highScore, width / 2, 150);
    text("Money: $" + money, width / 2, 185);

    // PLAY BUTTON
    fill(50, 200, 50);
    rect(width / 2 - 100, 230, 200, 60, 10);

    fill(255);
    textSize(32);
    text("PLAY", width / 2, 270);

    // SHOP PANEL (clean)
    fill(255, 255, 255, 180);
    rect(180, 330, 540, 220, 12);

    fill(0);

    textSize(30);
    text("SHOP", width / 2, 375);

    textSize(20);
    text("1 - Jump Upgrade ($100)", width / 2, 430);
    text("2 - Speed Upgrade ($150)", width / 2, 460);

    textSize(18);
    text("Jump Power: " + upgrades.jump, width / 2, 500);
    text("Speed: " + upgrades.speed, width / 2, 525);
}

function drawGame() {

    background(135, 206, 235);

    player.update();
    generatePlatforms();

    fill(120, 80, 40);
    for (let p of platforms) {
        rect(p.x, p.y - cameraY, p.w, 20);
    }

    fill(255, 215, 0);
    for (let c of coins) {
        circle(c.x, c.y - cameraY, 18);
    }

    player.draw();

    fill(0);
    textAlign(LEFT);
    textSize(22);

    text("Score: " + score, 20, 30);
    text("$" + money, 20, 60);
    text("ESC = Menu", 20, 90);

    // combo display
    if (comboTextTimer > 0) {
        textAlign(CENTER);
        text("COMBO x" + jumpStreak, width / 2, 100);
        comboTextTimer--;
    }
}

function draw() {

    if (state === "menu") drawMenu();
    if (state === "play") drawGame();
}

function mousePressed() {

    if (state === "menu") {

        if (
            mouseX > width / 2 - 100 &&
            mouseX < width / 2 + 100 &&
            mouseY > 230 &&
            mouseY < 290
        ) {
            startGame();
        }
    }
}

function keyPressed() {

    if (keyCode === ESCAPE && state === "play") {
        state = "menu";
    }

    if (state === "menu") {

        if (key === "1" && money >= 100) {
            money -= 100;
            upgrades.jump += 1;
        }

        if (key === "2" && money >= 150) {
            money -= 150;
            upgrades.speed += 1;
        }

        localStorage.setItem("money", money);
        localStorage.setItem("jumpUpgrade", upgrades.jump);
        localStorage.setItem("speedUpgrade", upgrades.speed);
    }
}



