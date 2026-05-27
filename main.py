# =========================
# SUMIKICHI RUN
# =========================

import pygame
import random
import os

pygame.init()
pygame.mixer.init()

# =========================
# 画面設定
# =========================

WIDTH = 720
HEIGHT = 1280

screen = pygame.display.set_mode((WIDTH, HEIGHT))

pygame.display.set_caption("SUMIKICHI RUN")

clock = pygame.time.Clock()

# =========================
# フォント
# =========================

font = pygame.font.SysFont(
    "Yu Gothic UI",
    72
)

small_font = pygame.font.SysFont(
    "Yu Gothic UI",
    50
)

title_font = pygame.font.SysFont(
    "Yu Gothic UI",
    64,
    bold=True
)
# =========================
# 効果音
# =========================

crow_sound = pygame.mixer.Sound(
    "assets/crow.mp3"
)

crow_sound.set_volume(0.0)

# =========================
# BEST SCORE
# =========================

best_score = 0

if os.path.exists("best_score.txt"):

    with open("best_score.txt", "r") as f:

        best_score = int(f.read())

# =========================
# 地面
# =========================

ground_y = HEIGHT - 170

# =========================
# 色
# =========================

DAY_SKY = (255, 245, 220)
NIGHT_SKY = (20, 30, 60)

GROUND_COLOR = (120, 80, 40)

WHITE = (255, 255, 255)
BLACK = (20, 20, 20)

YELLOW = (255, 220, 0)

# =========================
# プレイヤー
# =========================

player_size = 140

player_x = 120
player_y = ground_y - 70

player_velocity_y = 0

gravity = 1.2

jump_count = 0

# =========================
# スミ吉画像
# =========================

player_images = [

    pygame.image.load(
        "assets/sumikichi_1.png"
    ),

    pygame.image.load(
        "assets/sumikichi_2.png"
    )
]

for i in range(len(player_images)):

    player_images[i] = pygame.transform.scale(
        player_images[i],
        (player_size, player_size)
    )

animation_timer = 0
animation_frame = 0

# =========================
# 障害物画像
# =========================

cactus_image = pygame.image.load(
    "assets/cactus.png"
)

rock_image = pygame.image.load(
    "assets/rock.png"
)

drone_image = pygame.image.load(
    "assets/drone.png"
)

feather_image = pygame.image.load(
    "assets/feather.png"
)

cactus_image = pygame.transform.scale(
    cactus_image,
    (120, 140)
)

rock_image = pygame.transform.scale(
    rock_image,
    (140, 120)
)

drone_image = pygame.transform.scale(
    drone_image,
    (140, 100)
)

# =========================
# ガイド画像
# =========================

guide_image = pygame.image.load(
    "assets/guide.png"
)

guide_image = pygame.transform.scale(
    guide_image,
    (700, 700)
)

feather_image = pygame.transform.scale(
    feather_image,
    (80, 80)
)

# =========================
# オブジェクト
# =========================

obstacles = []

feathers = []

spawn_timer = 0
feather_timer = 0

# =========================
# 背景スクロール
# =========================

bg_x = 0

# =========================
# スコア
# =========================

score = 0



# =========================
# 状態
# =========================

game_over = False
paused = False
show_title = True

near_miss_timer = 0

# =========================
# メインループ
# =========================

running = True

while running:

    dt = clock.tick(60)

    # =====================
    # 難易度上昇
    # =====================

    obstacle_speed = 12 + score * 0.003

    # =====================
    # 昼夜循環
    # =====================

    cycle = (score // 1000) % 2

    if cycle == 0:

        sky_color = DAY_SKY

    else:

        sky_color = NIGHT_SKY

    # =====================
    # イベント
    # =====================

    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:

            if event.key == pygame.K_p:

                paused = not paused

        if event.type == pygame.MOUSEBUTTONDOWN:

            # タイトル画面
            if show_title:

                show_title = False

            # リトライ
            elif game_over:

                player_y = ground_y - 70

                player_velocity_y = 0

                obstacles.clear()

                feathers.clear()

                score = 0

                jump_count = 0

                game_over = False

            # ジャンプ
            elif not paused:

                if jump_count < 3:

                    if jump_count == 0:

                        player_velocity_y = -24

                    elif jump_count == 1:

                        player_velocity_y = -32

                    else:

                        player_velocity_y = -26

                    jump_count += 1

                    crow_sound.play()

    # =====================
    # 更新
    # =====================

    if not game_over and not paused and not show_title:

        # -----------------
        # 背景スクロール
        # -----------------

        bg_x -= obstacle_speed

        if bg_x <= -WIDTH:
            bg_x = 0

        # -----------------
        # 重力
        # -----------------

        player_velocity_y += gravity

        player_y += player_velocity_y

        if player_y >= ground_y - 70:

            player_y = ground_y - 70

            player_velocity_y = 0

            jump_count = 0

        # -----------------
        # アニメーション
        # -----------------

        animation_timer += dt

        if animation_timer > 120:

            animation_frame += 1

            if animation_frame >= len(player_images):
                animation_frame = 0

            animation_timer = 0

        # -----------------
        # 障害物生成
        # -----------------

        spawn_timer += dt

        if spawn_timer > 1400:

            obstacle_type = random.choice(
                ["cactus", "rock", "drone"]
            )

            obstacle = {
                "type": obstacle_type,
                "x": WIDTH + 100,
                "passed": False
            }

            obstacles.append(obstacle)

            spawn_timer = 0

        # -----------------
        # 羽生成
        # -----------------

        feather_timer += dt

        if feather_timer > 3000:

            feather = {

                "x": WIDTH + 100,

                "y": random.randint(
                    500,
                    850
                )
            }

            feathers.append(feather)

            feather_timer = 0

        # -----------------
        # 障害物移動
        # -----------------

        for obstacle in obstacles:

            obstacle["x"] -= obstacle_speed

        obstacles = [

            o for o in obstacles

            if o["x"] > -200
        ]

        # -----------------
        # 羽移動
        # -----------------

        for feather in feathers:

            feather["x"] -= obstacle_speed

        feathers = [

            f for f in feathers

            if f["x"] > -100
        ]

        # -----------------
        # プレイヤー判定
        # -----------------

        player_rect = pygame.Rect(

            player_x + 20,
            player_y + 20,

            player_size - 40,
            player_size - 40
        )

        # -----------------
        # 障害物判定
        # -----------------

        for obstacle in obstacles:

            if obstacle["type"] == "cactus":

                obstacle_rect = pygame.Rect(

                    obstacle["x"] + 20,
                    ground_y - 90,

                    80,
                    120
                )

            elif obstacle["type"] == "rock":

                obstacle_rect = pygame.Rect(

                    obstacle["x"] + 20,
                    ground_y - 70,

                    100,
                    100
                )

            else:

                obstacle_rect = pygame.Rect(

                    obstacle["x"] + 20,
                    ground_y - 350,

                    100,
                    80
                )

            # =====================
            # ニアミス
            # =====================

            near_x = abs(
                obstacle_rect.centerx
                - player_rect.centerx
            )

            near_y = abs(
                obstacle_rect.centery
                - player_rect.centery
            )

            if (

                near_x < 70
                and near_y < 110

                and not obstacle["passed"]

                and not player_rect.colliderect(
                    obstacle_rect
                )
            ):

                score += 50

                near_miss_timer = 60

                obstacle["passed"] = True

            # =====================
            # 衝突
            # =====================

            if player_rect.colliderect(
                obstacle_rect
            ):

                game_over = True

                if int(score) > best_score:

                    best_score = int(score)

                    with open(
                        "best_score.txt",
                        "w"
                    ) as f:

                        f.write(
                            str(best_score)
                        )

        # -----------------
        # 羽取得
        # -----------------

        for feather in feathers[:]:

            feather_rect = pygame.Rect(

                feather["x"],
                feather["y"],

                60,
                60
            )

            if player_rect.colliderect(
                feather_rect
            ):

                score += 100

                feathers.remove(feather)

        # -----------------
        # スコア
        # -----------------

        score += 0.1

    # =====================
    # 描画
    # =====================

    screen.fill(sky_color)

    # -----------------
    # タイトル画面
    # -----------------

# -----------------
# タイトル画面
# -----------------

    if show_title:

        title = title_font.render(
            "すみきち ぱたぱたラン！",
            True,
            BLACK
        )

        sub = small_font.render(
            "タップしてスタート！",
            True,
            BLACK
        )

        explain1 = small_font.render(
            "3段ジャンプ！",
            True,
            BLACK
        )

        explain2 = small_font.render(
            "羽を集めよう！",
            True,
            BLACK
        )

        explain3 = small_font.render(
            "障害物をよけろ！",
            True,
            BLACK
        )

        # guide画像
        screen.blit(
            guide_image,
            (120, 360)
        )

        screen.blit(title, (60, 90))
        screen.blit(sub, (170, 220))

        screen.blit(explain1, (220, 930))
        screen.blit(explain2, (190, 1010))
        screen.blit(explain3, (160, 1090))

        pygame.display.update()

        continue

    # -----------------
    # 月
    # -----------------

    if cycle == 1:

        pygame.draw.circle(

            screen,

            (255, 255, 180),

            (600, 180),

            60
        )

    # -----------------
    # 雲
    # -----------------

    for i in range(3):

        cloud_x = (i * 300 + bg_x) % (WIDTH + 300)

        pygame.draw.circle(
            screen,
            WHITE,
            (cloud_x, 200),
            60
        )

        pygame.draw.circle(
            screen,
            WHITE,
            (cloud_x + 60, 200),
            50
        )

        pygame.draw.circle(
            screen,
            WHITE,
            (cloud_x + 30, 160),
            55
        )

    # -----------------
    # 地面
    # -----------------

    pygame.draw.rect(

        screen,

        GROUND_COLOR,

        (
            0,
            ground_y,

            WIDTH,
            HEIGHT
        )
    )

    # -----------------
    # 地面ライン
    # -----------------

    for i in range(20):

        line_x = (
            i * 80 + bg_x * 2
        ) % (WIDTH + 100)

        pygame.draw.rect(

            screen,

            (80, 50, 20),

            (
                line_x,
                ground_y + 50,

                40,
                8
            )
        )

    # -----------------
    # 羽
    # -----------------

    for feather in feathers:

        screen.blit(

            feather_image,

            (
                feather["x"],
                feather["y"]
            )
        )

    # -----------------
    # スミ吉
    # -----------------

    screen.blit(

        player_images[animation_frame],

        (
            player_x,
            player_y
        )
    )

    # -----------------
    # 障害物
    # -----------------

    for obstacle in obstacles:

        if obstacle["type"] == "cactus":

            screen.blit(

                cactus_image,

                (
                    obstacle["x"],
                    ground_y - 70
                )
            )

        elif obstacle["type"] == "rock":

            screen.blit(

                rock_image,

                (
                    obstacle["x"],
                    ground_y - 90
                )
            )

        else:

            screen.blit(

                drone_image,

                (
                    obstacle["x"],
                    ground_y - 350
                )
            )

    # -----------------
    # スコア
    # -----------------

    score_text = font.render(

        f"SCORE : {int(score)}",

        True,

        BLACK
    )

    best_text = small_font.render(

        f"BEST : {best_score}",

        True,

        BLACK
    )

    screen.blit(
        score_text,
        (30, 30)
    )

    screen.blit(
        best_text,
        (30, 110)
    )

    # -----------------
    # ニアミス表示
    # -----------------

    if near_miss_timer > 0:

        near_miss_timer -= 1

        near_text = small_font.render(

            "NEAR MISS +50",

            True,

            YELLOW
        )

        screen.blit(
            near_text,
            (180, 250)
        )

    # -----------------
    # ポーズ
    # -----------------

    if paused:

        pause_text = font.render(

            "PAUSED",

            True,

            BLACK
        )

        screen.blit(
            pause_text,
            (180, HEIGHT // 2)
        )

    # -----------------
    # GAME OVER
    # -----------------

    if game_over:

        over_text = font.render(

            "GAME OVER",

            True,

            (255, 0, 0)
        )

        retry_text = small_font.render(

            "TAP TO RETRY",

            True,

            BLACK
        )

        screen.blit(

            over_text,

            (120, HEIGHT // 2 - 100)
        )

        screen.blit(

            retry_text,

            (180, HEIGHT // 2)
        )

    pygame.display.update()

pygame.quit()