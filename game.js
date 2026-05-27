// ===============================
// SUMIKICHI RUN WEB
// 完全版 game.js
// ===============================

const config = {

    type: Phaser.AUTO,

    width: 720,
    height: 1280,

    backgroundColor: "#f5ebd8",

    parent: "game-container",

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

// ===============================
// ふわふわ設定
// ===============================

let gravity = 0.28;

let jumpCount = 0;

let groundY = 1110;

let obstacles = [];
let feathers = [];

let score = 0;
let bestScore = 0;

let combo = 0;

let gameStarted = false;
let gameOver = false;

let scoreText;
let bestText;

let titleTexts = [];

let guideImage;

let animationTimer = 0;

let isNight = false;

// ===============================
// preload
// ===============================

function preload() {

    this.load.image(
        "sumikichi1",
        "assets/sumikichi_1.png"
    );

    this.load.image(
        "sumikichi2",
        "assets/sumikichi_2.png"
    );

    this.load.image(
        "cactus",
        "assets/cactus.png"
    );

    this.load.image(
        "rock",
        "assets/rock.png"
    );

    this.load.image(
        "drone",
        "assets/drone.png"
    );

    this.load.image(
        "feather",
        "assets/feather.png"
    );

    this.load.image(
        "guide",
        "assets/guide.png"
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
        360,
        640,
        720,
        1280,
        0xf5ebd8
    );

    // ===========================
    // 月
    // ===========================

    this.moon = this.add.circle(
        600,
        180,
        60,
        0xfff0aa
    );

    this.moon.visible = false;

    // ===========================
    // 雲
    // ===========================

    this.clouds = [];

    for(let i = 0; i < 4; i++){

        let cloud = this.add.ellipse(
            200 + i * 220,
            170 + i * 20,
            180,
            90,
            0xffffff
        );

        this.clouds.push(cloud);
    }

    // ===========================
    // 地面
    // ===========================

    this.ground = this.add.rectangle(
        360,
        1210,
        720,
        220,
        0x7a4f28
    );

    // ===========================
    // 地面ライン
    // ===========================

    this.groundLines = [];

    for(let i = 0; i < 20; i++){

        let line = this.add.rectangle(

            i * 80,
            1170,

            40,
            8,

            0x503010
        );

        this.groundLines.push(line);
    }

    // ===========================
    // ガイド画像
    // ===========================

    guideImage = this.add.image(
        360,
        760,
        "guide"
    );

    guideImage.displayWidth = 520;
    guideImage.displayHeight = 520;

    // ===========================
    // タイトル
    // ===========================

    let title = this.add.text(

        70,
        55,

        "すみきち ぱたぱたラン！",

        {
            fontSize: "50px",
            color: "#222"
        }
    );

    let startText = this.add.text(

        150,
        240,

        "タップしてスタート！",

        {
            fontSize: "44px",
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
            120,
            groundY - 40,
            "sumikichi1"
        ),

        this.add.image(
            120,
            groundY - 40,
            "sumikichi2"
        )
    ];

    playerFrames.forEach(frame => {

        frame.displayWidth = 140;
        frame.displayHeight = 140;

        frame.visible = false;
    });

    player = playerFrames[0];

    player.visible = true;

    // ===========================
    // SCORE
    // ===========================

    scoreText = this.add.text(

        30,
        30,

        "SCORE : 0",

        {
            fontSize: "48px",
            color: "#222"
        }
    );

    bestText = this.add.text(

        30,
        90,

        "BEST : " + bestScore,

        {
            fontSize: "36px",
            color: "#222"
        }
    );

    // タイトル中は非表示

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

                // ===================
                // ふわふわジャンプ
                // ===================

                if(jumpCount === 0){

                    playerVelocityY = -14;
                }

                else if(jumpCount === 1){

                    playerVelocityY = -18;
                }

                else{

                    playerVelocityY = -15;
                }

                jumpCount++;
            }
        }
    );

    // ===========================
    // 障害物生成
    // ===========================

    this.time.addEvent({

        delay: 2600,

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

        delay: 3500,

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
    // 昼夜切替
    // ===========================

    if(Math.floor(score / 1500) % 2 === 0){

        isNight = false;

        this.sky.fillColor = 0xf5ebd8;

        this.moon.visible = false;

        // 昼文字

        scoreText.setColor("#222");
        bestText.setColor("#222");
    }

    else{

        isNight = true;

        this.sky.fillColor = 0x162040;

        this.moon.visible = true;

        // 夜文字

        scoreText.setColor("#ffffff");
        bestText.setColor("#ffffff");
    }

    // ===========================
    // 全体スピード
    // ===========================

    let obstacleSpeed =
        3 + score * 0.0008;

    // ===========================
    // 雲
    // ===========================

    this.clouds.forEach(cloud => {

        cloud.x -= obstacleSpeed * 0.2;

        if(cloud.x < -120){

            cloud.x = 820;
        }
    });

    // ===========================
    // 地面ライン
    // ===========================

    this.groundLines.forEach(line => {

        line.x -= obstacleSpeed * 2;

        if(line.x < -40){

            line.x = 760;
        }
    });

    // ===========================
    // 重力
    // ===========================

    playerVelocityY += gravity;

    player.y += playerVelocityY;

    if(player.y >= groundY - 40){

        player.y = groundY - 40;

        playerVelocityY = 0;

        jumpCount = 0;
    }

    // ===========================
    // パタパタ
    // ===========================

    animationTimer += delta;

    if(animationTimer > 150){

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

        frame.x = 120;
        frame.y = player.y;
    });

    // ===========================
    // 障害物
    // ===========================

    obstacles.forEach(obstacle => {

        obstacle.x -= obstacleSpeed;

        // ニアミス

        if(
            !obstacle.passed
            &&
            obstacle.x < 170
        ){

            obstacle.passed = true;

            combo++;

            score += 50 * combo;

            showCombo(this);
        }

        // 当たり判定

        if(

            Phaser.Geom.Intersects.RectangleToRectangle(

                player.getBounds(),
                obstacle.getBounds()
            )
        ){

            gameOver = true;

            combo = 0;

            if(score > bestScore){

                bestScore = Math.floor(score);

                localStorage.setItem(

                    "sumikichi_best",
                    bestScore
                );
            }

            this.add.text(

                120,
                550,

                "GAME OVER",

                {
                    fontSize: "72px",
                    color: "#ff0000"
                }
            );

            this.add.text(

                150,
                650,

                "TAP TO RETRY",

                {
                    fontSize: "48px",
                    color: "#ffffff"
                }
            );
        }
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

    // ===========================
    // スコア
    // ===========================

    score += 0.05;

    scoreText.setText(
        "SCORE : " + Math.floor(score)
    );

    bestText.setText(
        "BEST : " + bestScore
    );
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
            820,
            groundY - 45,
            "cactus"
        );

        obstacle.displayWidth = 120;
        obstacle.displayHeight = 140;
    }

    else if(type === "rock"){

        obstacle = scene.add.image(
            820,
            groundY - 35,
            "rock"
        );

        obstacle.displayWidth = 140;
        obstacle.displayHeight = 120;
    }

    else{

        obstacle = scene.add.image(
            820,
            groundY - 240,
            "drone"
        );

        obstacle.displayWidth = 140;
        obstacle.displayHeight = 100;
    }

    obstacle.passed = false;

    obstacles.push(obstacle);
}

// ===============================
// 羽生成
// ===============================

function spawnFeather(scene){

    let feather = scene.add.image(

        820,

        Phaser.Math.Between(
            500,
            850
        ),

        "feather"
    );

    feather.displayWidth = 80;
    feather.displayHeight = 80;

    feathers.push(feather);
}

// ===============================
// COMBO表示
// ===============================

function showCombo(scene){

    if(combo < 2){
        return;
    }

    let comboText = scene.add.text(

        240,
        260,

        "COMBO x" + combo,

        {
            fontSize: "42px",
            color: "#ffcc00"
        }
    );

    scene.tweens.add({

        targets: comboText,

        y: 200,

        alpha: 0,

        duration: 800,

        onComplete: () => {

            comboText.destroy();
        }
    });
}