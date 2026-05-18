import math
import os
import sys

import pygame


# ============================================================
# KONFIGURASI DASAR
# ============================================================
SCREEN_WIDTH = 960
SCREEN_HEIGHT = 640
FPS = 60

SPRITE_COLUMNS = 4
SPRITE_ROWS = 4

# Layout disesuaikan dengan robot.png yang diberikan:
# baris 0 = idle
# baris 1 = jalan ke kanan
# baris 2 = jalan ke kiri
#
# Karena file ini memiliki 4 frame per baris, animasi jalan dibuat
# menjadi 6 langkah halus dengan pola maju-mundur: 0,1,2,3,2,1.
ANIMATION_LAYOUT = {
    "idle": {"row": 0, "indices": [0, 1, 2, 3], "speed": 7},
    "right": {"row": 1, "indices": [0, 1, 2, 3, 2, 1], "speed": 10},
    "left": {"row": 2, "indices": [0, 1, 2, 3, 2, 1], "speed": 10},
}

ROBOT_SCALE = 1.0
ROBOT_SPEED = 240  # pixel per detik

SPRITE_FILE = "robot.png"


# ============================================================
# FUNGSI BANTU
# ============================================================
def make_gradient_background(width: int, height: int) -> pygame.Surface:
    """Membuat background gradasi biru-putih yang lembut."""
    surface = pygame.Surface((width, height))

    top_color = (238, 247, 255)
    bottom_color = (197, 225, 246)

    for y in range(height):
        ratio = y / height
        red = int(top_color[0] + (bottom_color[0] - top_color[0]) * ratio)
        green = int(top_color[1] + (bottom_color[1] - top_color[1]) * ratio)
        blue = int(top_color[2] + (bottom_color[2] - top_color[2]) * ratio)
        pygame.draw.line(surface, (red, green, blue), (0, y), (width, y))

    return surface


def slice_animation_frames(
    sprite_sheet: pygame.Surface,
    row: int,
    frame_indices: list[int],
    frame_width: int,
    frame_height: int,
) -> list[pygame.Surface]:
    """
    Memotong frame animasi dari sprite sheet secara otomatis.

    Setiap frame diambil dari grid 4x4 pada robot.png.
    """
    frames = []

    for column in frame_indices:
        frame_rect = pygame.Rect(
            column * frame_width,
            row * frame_height,
            frame_width,
            frame_height,
        )
        frame = pygame.Surface((frame_width, frame_height), pygame.SRCALPHA)
        frame.blit(sprite_sheet, (0, 0), frame_rect)
        frames.append(frame)

    return frames


def load_animations(sprite_path: str) -> dict[str, list[pygame.Surface]]:
    """Memuat sprite sheet lalu memotong semua animasi."""
    if not os.path.exists(sprite_path):
        raise FileNotFoundError(
            f"File '{sprite_path}' tidak ditemukan. "
            "Pastikan robot.png berada satu folder dengan main.py."
        )

    sprite_sheet = pygame.image.load(sprite_path).convert_alpha()

    frame_width = sprite_sheet.get_width() // SPRITE_COLUMNS
    frame_height = sprite_sheet.get_height() // SPRITE_ROWS

    if sprite_sheet.get_width() % SPRITE_COLUMNS != 0 or sprite_sheet.get_height() % SPRITE_ROWS != 0:
        raise ValueError(
            "Ukuran sprite sheet harus bisa dibagi rata menjadi grid 4x4."
        )

    animations = {}
    for name, config in ANIMATION_LAYOUT.items():
        raw_frames = slice_animation_frames(
            sprite_sheet,
            row=config["row"],
            frame_indices=config["indices"],
            frame_width=frame_width,
            frame_height=frame_height,
        )

        # Ukuran tampilan robot dapat diubah lewat ROBOT_SCALE.
        animations[name] = [
            pygame.transform.scale(
                frame,
                (
                    int(frame_width * ROBOT_SCALE),
                    int(frame_height * ROBOT_SCALE),
                ),
            )
            for frame in raw_frames
        ]

    return animations


def draw_rounded_button(
    surface: pygame.Surface,
    rect: pygame.Rect,
    text: str,
    font: pygame.font.Font,
    is_active: bool = False,
    is_hovered: bool = False,
) -> None:
    """Menggambar tombol modern dengan sudut rounded."""
    if is_active:
        button_color = (58, 134, 255)
        text_color = (255, 255, 255)
    elif is_hovered:
        button_color = (219, 235, 250)
        text_color = (45, 67, 89)
    else:
        button_color = (233, 243, 252)
        text_color = (45, 67, 89)

    shadow_rect = rect.move(0, 5)
    pygame.draw.rect(surface, (165, 194, 218), shadow_rect, border_radius=18)
    pygame.draw.rect(surface, button_color, rect, border_radius=18)

    label = font.render(text, True, text_color)
    label_rect = label.get_rect(center=rect.center)
    surface.blit(label, label_rect)


# ============================================================
# KELAS ROBOT
# ============================================================
class Robot:
    def __init__(self, animations: dict[str, list[pygame.Surface]]) -> None:
        self.animations = animations
        self.state = "idle"
        self.frames = self.animations[self.state]
        self.frame_index = 0
        self.animation_timer = 0.0

        self.image = self.frames[self.frame_index]
        self.rect = self.image.get_rect()
        self.rect.midbottom = (SCREEN_WIDTH // 2, SCREEN_HEIGHT - 120)

        # Posisi x disimpan sebagai float agar gerakan lebih smooth.
        self.x = float(self.rect.x)
        self.base_y = float(self.rect.y)

        self.velocity_x = 0.0
        self.idle_time = 0.0

    def set_state(self, new_state: str) -> None:
        """Mengganti animasi aktif jika state berubah."""
        if self.state != new_state:
            self.state = new_state
            self.frames = self.animations[self.state]
            self.frame_index = 0
            self.animation_timer = 0.0
            self.image = self.frames[self.frame_index]

    def move_left(self) -> None:
        self.velocity_x = -ROBOT_SPEED
        self.set_state("left")

    def move_right(self) -> None:
        self.velocity_x = ROBOT_SPEED
        self.set_state("right")

    def stop(self) -> None:
        self.velocity_x = 0.0
        self.set_state("idle")

    def update(self, dt: float) -> None:
        """Update posisi dan animasi berdasarkan delta time."""
        self.x += self.velocity_x * dt

        # Collision batas layar: robot tidak boleh keluar area tampilan.
        self.x = max(0, min(self.x, SCREEN_WIDTH - self.rect.width))
        self.rect.x = round(self.x)

        # Timer animasi berbasis waktu agar tetap halus walau FPS berubah.
        self.animation_timer += dt
        seconds_per_frame = 1 / ANIMATION_LAYOUT[self.state]["speed"]

        while self.animation_timer >= seconds_per_frame:
            self.animation_timer -= seconds_per_frame
            self.frame_index = (self.frame_index + 1) % len(self.frames)
            self.image = self.frames[self.frame_index]

        # Idle bobbing ringan. Detail antena idealnya berasal dari frame sprite idle.
        if self.state == "idle":
            self.idle_time += dt
            bob_offset = math.sin(self.idle_time * 3.0) * 5
            self.rect.y = round(self.base_y + bob_offset)
        else:
            self.rect.y = round(self.base_y)

    def draw(self, surface: pygame.Surface) -> None:
        surface.blit(self.image, self.rect)


# ============================================================
# PROGRAM UTAMA
# ============================================================
def main() -> None:
    pygame.init()
    pygame.display.set_caption("Robot Sprite Animation")

    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()

    background = make_gradient_background(SCREEN_WIDTH, SCREEN_HEIGHT)
    font = pygame.font.SysFont("arial", 26, bold=True)

    animations = load_animations(SPRITE_FILE)
    robot = Robot(animations)

    button_width = 150
    button_height = 58
    button_gap = 22
    total_width = (button_width * 3) + (button_gap * 2)
    start_x = (SCREEN_WIDTH - total_width) // 2
    button_y = SCREEN_HEIGHT - 88

    buttons = {
        "left": pygame.Rect(start_x, button_y, button_width, button_height),
        "stop": pygame.Rect(
            start_x + button_width + button_gap,
            button_y,
            button_width,
            button_height,
        ),
        "right": pygame.Rect(
            start_x + (button_width + button_gap) * 2,
            button_y,
            button_width,
            button_height,
        ),
    }

    running = True
    while running:
        dt = clock.tick(FPS) / 1000  # delta time dalam detik
        mouse_pos = pygame.mouse.get_pos()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    robot.move_left()
                elif event.key == pygame.K_RIGHT:
                    robot.move_right()
                elif event.key == pygame.K_SPACE:
                    robot.stop()

            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if buttons["left"].collidepoint(event.pos):
                    robot.move_left()
                elif buttons["right"].collidepoint(event.pos):
                    robot.move_right()
                elif buttons["stop"].collidepoint(event.pos):
                    robot.stop()

        robot.update(dt)

        screen.blit(background, (0, 0))

        # Bayangan lembut agar karakter terasa lebih hidup.
        shadow_rect = pygame.Rect(0, 0, 180, 28)
        shadow_rect.center = (robot.rect.centerx, robot.rect.bottom - 8)
        shadow_surface = pygame.Surface(shadow_rect.size, pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surface, (45, 83, 120, 55), shadow_surface.get_rect())
        screen.blit(shadow_surface, shadow_rect)

        robot.draw(screen)

        draw_rounded_button(
            screen,
            buttons["left"],
            "LEFT",
            font,
            is_active=robot.state == "left",
            is_hovered=buttons["left"].collidepoint(mouse_pos),
        )
        draw_rounded_button(
            screen,
            buttons["stop"],
            "STOP",
            font,
            is_active=robot.state == "idle",
            is_hovered=buttons["stop"].collidepoint(mouse_pos),
        )
        draw_rounded_button(
            screen,
            buttons["right"],
            "RIGHT",
            font,
            is_active=robot.state == "right",
            is_hovered=buttons["right"].collidepoint(mouse_pos),
        )

        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
