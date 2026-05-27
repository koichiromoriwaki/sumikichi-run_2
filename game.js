// ===============================
// SUMIKICHI RUN WEB
// 軽量化版 game.js
// ===============================

const config = {

    type: Phaser.WEBGL,

    width: 360,
    height: 640,

    backgroundColor: "#f5ebd8",

    fps: {
        target: 30,
        forceSetTimeOut: true
    },

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

// ===============================
// グローバル
// ===============================

let player;
let playerFrames = [];

let currentFrame = 0;

let playerVelocityY = 0;

let gravity = 0.20;

let jumpCount = 0;

let groundY = 560;

let obstacles = [];
let feathers = [];

let score = 0;
let bestScore = 0;

let gameStarted = false;
let gameOver = false;

let scoreText;
let bestText;

let lastScore = -1;

let titleTexts = [];

let guideImage;

let animationTimer = 0;

let isNight = false;

// ===============================
// preload
// ===============================

function preload() {

    // 先頭スペース絶対禁止

    this.load.image(
        "sumikichi1",
        "sumikichi_1.png"
    );

    this.load.image(
        "sumikichi2",
        "sumikichi_2.png"
    );

    this.load.image(
        "cactus",
        "cactus.png"
    );

    this.load.image(
        "rock",
        "rock.png"
    );

    this.load.image(
        "drone",
        "drone.png"
    );

    this.load.image(
        "feather",
        "feather.png"
    );

    this.load.image(
        "guide",
        "guide.png"
    );
}

// ===============================
// create
// ===============================

function create() {

    // ===========================
    // BEST SCORE
    // ===========================

    const saved = localStorage.getItem(
        "sumikichi_best"
    );

    if(saved){

        bestScore = parseInt(saved);
    }

    // ===========================
    // 背景
    // ===========================

    this.sky = this.add.rectangle(
        180,
        320,
        360,
        640,
        0xf5ebd8
    );

    // ===========================
    // 月
    // ===========================

    this.moon = this.add.circle(
        300,
        100,
        30,
        0xfff0aa
    );

    this.moon.visible = false;

    // ===========================
    // 雲
    // ===========================

    this.clouds = [];

    for(let i = 0; i < 2; i++){

        let cloud = this.add.ellipse(
            120 + i * 180,
            100 + i * 20,
            90,
            45,
            0xffffff
        );

        this.clouds.push(cloud);
    }

    // ===========================
    // 地面
    // ===========================

    this.ground = this.add.rectangle(
        180,
        610,
        360,
        80,
        0x7a4f28
    );

    // ===========================
    // 地面ライン
    // ===========================

    this.groundLines = [];

    for(let i = 0; i < 8; i++){

        let line = this.add.rectangle(

            i * 50,
            585,

            20,
            4,

            0x503010
        );

        this.groundLines.push(line);
    }

    // ===========================
    // ガイド
    // ===========================

    guideImage = this.add.image(
        180,
        360,
        "guide"
    );

    guideImage.displayWidth = 220;
    guideImage.displayHeight = 220;

    // ===========================
    // タイトル
    // ===========================

    let title = this.add.text(

        30,
        30,

        "すみきち\nぱたぱたラン！",

        {
            fontSize: "28px",
            color: "#222",
            align: "center"
        }
    );

    let startText = this.add.text(

        70,
        170,

        "タップしてスタート！",

        {
            fontSize: "24px",
            color: "#222"
        }
    );

    titleTexts.push(title);
    titleTexts.push(startText);

    // ===========================
    // プレイヤー
    // ===========================

    playerFrames = [

        this.add.image(
            70,
            groundY - 20,
            "sumikichi1"
        ),

        this.add.image(
            70,
            groundY - 20,
            "sumikichi2"
        )
    ];

    playerFrames.forEach(frame => {

        frame.displayWidth = 70;
        frame.displayHeight = 70;

        frame.visible = false;
    });

    player = playerFrames[0];

    player.visible = true;

    // ===========================
    // SCORE
    // ===========================

    scoreText = this.add.text(

        10,
        10,

        "SCORE : 0",

        {
            fontSize: "22px",
            color: "#222"
        }
    );

    bestText = this.add.text(

        10,
        40,

        "BEST : " + bestScore,

        {
            fontSize: "18px",
            color: "#222"
        }
    );

    scoreText.visible = false;
    bestText.visible = false;

    // ===========================
    // タップ
    // ===========================

    this.input.on(

        "pointerdown",

        () => {

            // START

            if(!gameStarted){

                gameStarted = true;

                guideImage.visible = false;

                titleTexts.forEach(t => {
                    t.visible = false;
                });

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

            if(jumpCount < 3){

                if(jumpCount === 0){

                    playerVelocityY = -9;
                }

                else if(jumpCount === 1){

                    playerVelocityY = -11;
                }

                else{

                    playerVelocityY = -9;
                }

                jumpCount++;
            }
        }
    );

    // ===========================
    // 障害物生成
    // ===========================

    this.time.addEvent({

        delay: 2800,

        loop: true,

        callback: () => {

            if(!gameStarted || gameOver){
                return;
            }

            spawnObstacle(this);
        }
    });

    // ===========================
    // 羽生成
    // ===========================

    this.time.addEvent({

        delay: 4000,

        loop: true,

        callback: () => {

            if(!gameStarted || gameOver){
                return;
            }

            spawnFeather(this);
        }
    });
}

// ===============================
// update
// ===============================

function update(time, delta) {

    if(!gameStarted || gameOver){
        return;
    }

    // ===========================
    // 昼夜
    // ===========================

    if(Math.floor(score / 1000) % 2 === 0){

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

        scoreText.setColor("#ffffff");
        bestText.setColor("#ffffff");
    }

    // ===========================
    // スピード
    // ===========================

    let obstacleSpeed =
        2 + score * 0.0003;

    // ===========================
    // 雲
    // ===========================

    this.clouds.forEach(cloud => {

        cloud.x -= obstacleSpeed * 0.1;

        if(cloud.x < -60){

            cloud.x = 420;
        }
    });

    // ===========================
    // 地面ライン
    // ===========================

    this.groundLines.forEach(line => {

        line.x -= obstacleSpeed * 1.5;

        if(line.x < -20){

            line.x = 400;
        }
    });

    // ===========================
    // 重力
    // ===========================

    playerVelocityY += gravity;

    player.y += playerVelocityY;

    if(player.y >= groundY - 20){

        player.y = groundY - 20;

        playerVelocityY = 0;

        jumpCount = 0;
    }

    // ===========================
    // パタパタ
    // ===========================

    animationTimer += delta;

    if(animationTimer > 180){

        player.visible = false;

        currentFrame++;

        if(currentFrame >= playerFrames.length){

            currentFrame = 0;
        }

        player = playerFrames[currentFrame];

        player.visible = true;

        animationTimer = 0;
    }

    playerFrames.forEach(frame => {

        frame.x = 70;
        frame.y = player.y;
    });

    // ===========================
    // 障害物
    // ===========================

    obstacles.forEach(obstacle => {

        obstacle.x -= obstacleSpeed;

        // 当たり判定

        if(

            Phaser.Geom.Intersects.RectangleToRectangle(

                player.getBounds(),
                obstacle.getBounds()
            )
        ){

            gameOver = true;

            if(score > bestScore){

                bestScore = Math.floor(score);

                localStorage.setItem(
                    "sumikichi_best",
                    bestScore
                );
            }

            this.add.text(

                60,
                260,

                "GAME OVER",

                {
                    fontSize: "32px",
                    color: "#ff0000"
                }
            );

            this.add.text(

                70,
                320,

                "TAP TO RETRY",

                {
                    fontSize: "22px",
                    color: "#ffffff"
                }
            );
        }
    });

    // 画面外削除

    obstacles = obstacles.filter(obstacle => {

        if(obstacle.x < -100){

            obstacle.destroy();
            return false;
        }

        return true;
    });

    // ===========================
    // 羽
    // ===========================

    feathers.forEach(feather => {

        feather.x -= obstacleSpeed;

        if(

            Phaser.Geom.Intersects.RectangleToRectangle(

                player.getBounds(),
                feather.getBounds()
            )
        ){

            score += 100;

            feather.destroy();

            feathers =
                feathers.filter(
                    f => f !== feather
                );
        }
    });

    // 画面外削除

    feathers = feathers.filter(feather => {

        if(feather.x < -50){

            feather.destroy();
            return false;
        }

        return true;
    });

    // ===========================
    // スコア
    // ===========================

    score += 0.03;

    if(Math.floor(score) !== lastScore){

        lastScore = Math.floor(score);

        scoreText.setText(
            "SCORE : " + lastScore
        );

        bestText.setText(
            "BEST : " + bestScore
        );
    }
}

// ===============================
// 障害物生成
// ===============================

function spawnObstacle(scene){

    let types = [
        "cactus",
        "rock",
        "drone"
    ];

    let type = Phaser.Utils.Array.GetRandom(
        types
    );

    let obstacle;

    if(type === "cactus"){

        obstacle = scene.add.image(
            420,
            groundY - 20,
            "cactus"
        );

        obstacle.displayWidth = 60;
        obstacle.displayHeight = 70;
    }

    else if(type === "rock"){

        obstacle = scene.add.image(
            420,
            groundY - 15,
            "rock"
        );

        obstacle.displayWidth = 70;
        obstacle.displayHeight = 55;
    }

    else{

        obstacle = scene.add.image(
            420,
            groundY - 120,
            "drone"
        );

        obstacle.displayWidth = 70;
        obstacle.displayHeight = 50;
    }

    obstacle.passed = false;

    obstacles.push(obstacle);
}

// ===============================
// 羽生成
// ===============================

function spawnFeather(scene){

    let feather = scene.add.image(

        420,

        Phaser.Math.Between(
            220,
            420
        ),

        "feather"
    );

    feather.displayWidth = 40;
    feather.displayHeight = 40;

    feathers.push(feather);
}
