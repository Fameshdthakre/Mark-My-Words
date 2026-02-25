import os
from PIL import Image, ImageDraw

def generate_icons():
    sizes = [16, 48, 128]

    # Electric Indigo Theme
    # Gradient emulation (simple solid for now as PIL gradients are tricky without numpy)
    bg_color_top = (109, 40, 217)  # Violet 700 (#6d28d9)
    bg_color_bot = (76, 29, 149)   # Violet 900 (#4c1d95)

    accent_emerald = (16, 185, 129) # Emerald (#10b981)
    accent_white = (248, 250, 252) # Slate 50 (#f8fafc)

    if not os.path.exists('icons'):
        os.makedirs('icons')

    for size in sizes:
        # Create image with alpha
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # 1. Background (Rounded Squircle)
        padding = size // 8
        rect = [padding, padding, size - padding, size - padding]
        radius = size // 4

        # Draw background (simulated gradient via overlapping shapes?)
        # For simplicity/sharpness at small sizes, use a solid deep indigo with a lighter border
        draw.rounded_rectangle(rect, radius=radius, fill=bg_color_bot, outline=bg_color_top, width=max(1, size // 32))

        # 2. Icon: Stylized Highlighter Tip / "M"
        # Let's do a bold diagonal highlight stroke (Emerald) over a text-like line (White)

        # Coordinates for "Text Line" (White Rect)
        line_h = max(1, size // 8)
        line_w = size * 0.5
        line_x = (size - line_w) // 2
        line_y = size * 0.65

        # Draw "Text" line
        draw.line(
            [(line_x, line_y), (line_x + line_w, line_y)],
            fill=accent_white,
            width=line_h
        )

        # Coordinates for "Highlighter Stroke" (Emerald, semi-transparent look?)
        # Since it's an icon, solid is better.
        # Diagonal stroke across the text line
        stroke_w = max(1, size // 6)
        start_x = size * 0.35
        start_y = size * 0.4
        end_x = size * 0.65
        end_y = size * 0.8

        # Draw Highlighter Stroke (behind text? or over?)
        # Over text looks like highlighting.
        # Let's make it translucent-ish by drawing on a separate layer and compositing?
        # Or just solid emerald. Solid emerald reads better as an app icon.

        draw.line(
            [(start_x, start_y), (end_x, end_y)],
            fill=accent_emerald,
            width=stroke_w
        )

        # 3. Add a small "Sparkle" or "Zap" accent in the corner
        sparkle_center = (size * 0.75, size * 0.3)
        sparkle_r = size // 16
        if size > 16:
             draw.ellipse(
                (sparkle_center[0]-sparkle_r, sparkle_center[1]-sparkle_r,
                 sparkle_center[0]+sparkle_r, sparkle_center[1]+sparkle_r),
                fill=accent_white
            )

        # Save
        filename = f'icons/icon{size}.png'
        img.save(filename)
        print(f"Generated {filename}")

if __name__ == '__main__':
    generate_icons()
