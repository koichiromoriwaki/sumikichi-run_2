const config = {

    type: Phaser.CANVAS,

    width: 360,
    height: 640,

    backgroundColor: "#f5ebd8",

    scale: {

        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    scene: {
        preload,
        create,
        update
    }
};

new Phaser.Game(config);

// =====================
// グローバル
// =====================

let player;

let velocityY = 0;

let gravity = 0.22;

let jumpCount = 0;

let groundY = 560;

let obstacles = [];

let score = 0;

let bestScore = 0;

let scoreText;
let bestText;

let gameStarted = false;
let gameOver = false;

let isNight = false;

// =====================
// preload
// =====================

function preload() {

    this.load.image("sumikichi", "sumikichi_1.png");

    this.load.image("cactus", "cactus.png");

    this.load.image("guide", "guide.png");
}

// =====================
// create
// =====================

function create() {

    // ベストスコア

    const saved =
        localStorage.getItem("sumikichi_best");

    if(saved){

        bestScore = parseInt(saved);
    }

    // 背景

    this.sky = this.add.rectangle(
        180,
        320,
        360,
        640,
        0xf5ebd8
    );

    // 月

    this.moon = this.add.circle(
        300,
        120,
        30,
        0xfff0aa
    );

    this.moon.visible = false;

    // 地面

    this.ground = this.add.rectangle(
        180,
        610,
        360,
        60,
        0x7a4f28
    );

    // タイトル

    this.title = this.add.text(

        40,
        70,

        "すみきち\nぱたぱたラン！",

        {
            fontSize: "34px",
            color: "#222",
            align: "center"
        }
    );

    this.startText = this.add.text(

        60,
        180,

        "タップしてスタート！",

        {
            fontSize: "28px",
            color: "#222"
        }
    );

    // ガイド

    this.guide = this.add.image(
        180,
        360,
        "guide"
    );

    this.guide.setScale(0.35);

    // プレイヤー

    player = this.add.image(
        80,
        groundY,
        "sumikichi"
    );

    player.setScale(0.22);

    // SCORE

    scoreText = this.add.text(

        12,
        10,

        "SCORE : 0",

        {
            fontSize: "22px",
            color: "#222"
        }
    );

    bestText = this.add.text(

        12,
        40,

        "BEST : " + bestScore,

        {
            fontSize: "18px",
            color: "#222"
        }
    );

    scoreText.visible = false;
    bestText.visible = false;

    // タップ

    this.input.on("pointerdown", () => {

        // START

        if(!gameStarted){

            gameStarted = true;

            this.title.visible = false;
            this.startText.visible = false;
            this.guide.visible = false;

            scoreText.visible = true;
            bestText.visible = true;

            return;
        }

        // RETRY

        if(gameOver){

            location.reload();
            return;
        }

        // JUMP

        if(jumpCount < 2){

            velocityY = -8.5;

            jumpCount++;
        }
    });

    // 障害物生成

    this.time.addEvent({

        delay: 2200,

        loop: true,

        callback: () => {

            if(!gameStarted || gameOver){
                return;
            }

            spawnObstacle(this);
        }
    });
}

// =====================
// update
// =====================

function update() {

    if(!gameStarted || gameOver){
        return;
    }

    // 昼夜切替

    if(Math.floor(score / 800) % 2 === 0){

        isNight = false;

        this.sky.fillColor = 0xf5ebd8;

        this.moon.visible = false;

        scoreText.setColor("#222");
        bestText.setColor("#222");
    }
    else{

        isNight = true;

        this.sky.fillColor = 0x162040;

        this.moon.visible = true;

        scoreText.setColor("#fff");
        bestText.setColor("#fff");
    }

    // スピード

    let speed = 2.8;

    // 重力

    velocityY += gravity;

    player.y += velocityY;

    if(player.y >= groundY){

        player.y = groundY;

        velocityY = 0;

        jumpCount = 0;
    }

    // 障害物

    obstacles.forEach(obstacle => {

        obstacle.x -= speed;

        // スコア

        if(!obstacle.passed && obstacle.x < 80){

            obstacle.passed = true;

            score += 100;
        }

        // 当たり

        if(

            Phaser.Geom.Intersects.RectangleToRectangle(

                player.getBounds(),
                obstacle.getBounds()
            )
        ){

            gameOver = true;

            if(score > bestScore){

                bestScore = score;

                localStorage.setItem(
                    "sumikichi_best",
                    bestScore
                );
            }

            this.add.text(

                40,
                260,

                "GAME OVER",

                {
                    fontSize: "42px",
                    color: "#ff0000"
                }
            );

            this.add.text(

                60,
                320,

                "TAP TO RETRY",

                {
                    fontSize: "26px",
                    color: "#ffffff"
                }
            );
        }

        // 画面外削除

        if(obstacle.x < -100){

            obstacle.destroy();
        }
    });

    // スコア

    score += 0.05;

    scoreText.setText(
        "SCORE : " + Math.floor(score)
    );

    bestText.setText(
        "BEST : " + bestScore
    );
}

// =====================
// 障害物
// =====================

function spawnObstacle(scene){

    let obstacle = scene.add.image(
        420,
        groundY + 5,
        "cactus"
    );

    obstacle.setScale(0.18);

    obstacle.passed = false;

    obstacles.push(obstacle);
}
