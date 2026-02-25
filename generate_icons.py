import os
from PIL import Image, ImageDraw, ImagePath

def generate_icons():
    sizes = [16, 48, 128]
    bg_color = (109, 40, 217) # Deep Indigo
    highlight_color = (16, 185, 129) # Emerald Green
    accent_color = (255, 255, 255) # White

    if not os.path.exists('icons'):
        os.makedirs('icons')

    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background: Rounded Square (Squircle)
        padding = size // 8
        rect = [padding, padding, size - padding, size - padding]
        radius = size // 4
        draw.rounded_rectangle(rect, radius=radius, fill=bg_color)

        # Symbol: Stylized "M" with a Highlight Swoosh
        # Draw a thick 'M'
        center = size // 2
        stroke_width = max(1, size // 8)

        # Lightning Bolt / Zap shape
        # Top Left -> Middle Right -> Middle Left -> Bottom Right
        points = [
            (size * 0.35, size * 0.25),  # Top Left
            (size * 0.65, size * 0.5),   # Mid Right
            (size * 0.4, size * 0.5),    # Mid Left
            (size * 0.7, size * 0.75)    # Bottom Right
        ]

        # Draw Bolt (Polygon)
        draw.polygon(points, fill=accent_color)

        # Add a "Highlight" underneath/glow
        glow_width = size // 10
        glow_offset = size // 20
        glow_points = [(p[0] + glow_offset, p[1] + glow_offset) for p in points]
        # Draw behind bolt? No, simplistic flat design is better for icon visibility at small sizes.

        # Let's try a simple highlight line under the bolt
        line_y = size * 0.8
        line_start = size * 0.3
        line_end = size * 0.7
        draw.line([line_start, line_y, line_end, line_y], fill=highlight_color, width=max(1, size // 12))

        # Save
        filename = f'icons/icon{size}.png'
        img.save(filename)
        print(f"Generated {filename}")

if __name__ == '__main__':
    generate_icons()
