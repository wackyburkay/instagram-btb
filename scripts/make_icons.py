#!/usr/bin/env python3
"""Draw the extension icon: two opposing white arrows on a red square.

Writes icons/icon-<size>.png for every size the browsers need, plus
icons/app-icon-1024.png, a square version for the Safari Mac app. Requires
Pillow (pip install pillow).

Usage:
    python3 scripts/make_icons.py
"""

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
SIZES = [16, 32, 48, 96, 128, 512, 1024]

RED = (232, 33, 46, 255)
WHITE = (255, 255, 255, 255)
BLACK = (17, 17, 17, 255)

CANVAS = 2048  # drawn large, then scaled down for smooth edges

# Arrow shape, in units where the symbol's half-size is 1.
SHIFT = 0.26         # sideways offset between the two arrows
HALF_WIDTH = 0.16    # half the shaft thickness
STRAIGHT_END = -0.02 # where the straight shaft ends and the hook starts
HOOK_RADIUS = 0.30
HOOK_DEGREES = 130


def stroke(centerline, half_width):
    """Polygon for a thick line along `centerline`."""
    centerline = [p for i, p in enumerate(centerline) if i == 0 or p != centerline[i - 1]]
    left, right = [], []
    for i, (x, y) in enumerate(centerline):
        ax, ay = centerline[max(i - 1, 0)]
        bx, by = centerline[min(i + 1, len(centerline) - 1)]
        tx, ty = bx - ax, by - ay
        length = math.hypot(tx, ty)
        nx, ny = -ty / length, tx / length
        left.append((x + nx * half_width, y + ny * half_width))
        right.append((x - nx * half_width, y - ny * half_width))
    return left + right[::-1]


def arrow_shapes():
    """One arrow pointing up, in units where the symbol's half-size is 1.

    Returns (body, tail): the body is the head and straight shaft, the tail
    hooks to the left so two arrows rotated 180 degrees interlock in an S.
    """
    head = [(0.0, -0.98), (-0.42, -0.36), (0.42, -0.36)]
    straight = stroke([(0.0, -0.40), (0.0, STRAIGHT_END)], HALF_WIDTH)

    r, cy = HOOK_RADIUS, STRAIGHT_END
    hook = [(-r + r * math.cos(math.radians(HOOK_DEGREES * s / 24)),
             cy + r * math.sin(math.radians(HOOK_DEGREES * s / 24))) for s in range(25)]
    hook.insert(0, (0.0, cy - 0.1))  # overlap the straight part so there's no seam
    return [head, straight], [stroke(hook, HALF_WIDTH)]


def transform(points, rotate_deg, shift, scale):
    a = math.radians(rotate_deg)
    out = []
    for x, y in points:
        x, y = x + shift[0], y + shift[1]
        xr = x * math.cos(a) - y * math.sin(a)
        yr = x * math.sin(a) + y * math.cos(a)
        out.append((CANVAS / 2 + xr * scale, CANVAS / 2 + yr * scale))
    return out


def fill(polygons, grow=0):
    """Mask of the given polygons, grown outward by `grow` pixels for outlines."""
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    for points in polygons:
        draw.polygon(points, fill=255)
        if grow:
            # A thick line around the edge plus round caps at the corners grows
            # the shape evenly on all sides.
            draw.line(points + [points[0]], fill=255, width=int(grow * 2), joint="curve")
            for x, y in points:
                draw.ellipse((x - grow, y - grow, x + grow, y + grow), fill=255)
    return mask


def draw_master(rounded=True):
    """The icon at CANVAS size. `rounded=False` gives a full-bleed square."""
    scale = CANVAS * 0.34
    body, tail = arrow_shapes()
    shift = (SHIFT, 0.0)
    outline_px = CANVAS * 0.026
    shadow_px = int(CANVAS * 0.026)

    icon = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    background = Image.new("L", (CANVAS, CANVAS), 0)
    ImageDraw.Draw(background).rounded_rectangle(
        (0, 0, CANVAS - 1, CANVAS - 1), radius=int(CANVAS * 0.2) if rounded else 0, fill=255
    )
    icon.paste(RED, mask=background)

    # The sideways shift tilts the line between the two tips, so rotate less than
    # 45 degrees to keep the tips pointing at the corners.
    rotation = 45 - math.degrees(math.atan2(shift[0], 0.98))

    def place(shapes, turn):
        return [transform(shape, rotation + turn, shift, scale) for shape in shapes]

    lower, upper = place(body + tail, 180), place(body + tail, 0)
    lower_body = place(body, 180)

    # Center the symbol, including its outline and shadow, in the square.
    union = fill(lower + upper, outline_px)
    union = ImageChops.lighter(union, ImageChops.offset(union, -shadow_px, shadow_px))
    left, top, right, bottom = union.getbbox()
    dx, dy = CANVAS / 2 - (left + right) / 2, CANVAS / 2 - (top + bottom) / 2

    def moved(polygons):
        return [[(x + dx, y + dy) for x, y in points] for points in polygons]

    # Each arrow gets its own outline, so black separates them where they overlap.
    # Drawing the lower arrow's body again last tucks each tail under the other
    # arrow's shaft, which makes the two interlock.
    for polygons, redraw in ((lower, False), (upper, False), (lower_body, True)):
        polygons = moved(polygons)
        outline = fill(polygons, outline_px)
        white = fill(polygons)
        if redraw:
            # Skip the outline across the cut end of the redrawn shaft: it would
            # draw a line over the top arrow. Only keep the outline along its sides,
            # i.e. outside the full lower arrow.
            lower_area = fill(moved(lower))
            outline = ImageChops.subtract(outline, lower_area)
            # Paint white slightly past the shaft's edges, within the lower arrow,
            # so no sliver of the top arrow's outline shows through.
            white = ImageChops.multiply(fill(polygons, outline_px), lower_area)
        else:
            shadow = ImageChops.offset(outline, -shadow_px, shadow_px)
            icon.paste(BLACK, mask=ImageChops.multiply(shadow, background))
        icon.paste(BLACK, mask=outline)
        icon.paste(WHITE, mask=white)
    return icon


def main():
    OUT.mkdir(exist_ok=True)
    master = draw_master()
    for size in SIZES:
        master.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)

    # The Mac app icon. macOS rounds app icons itself; one that already has
    # transparent corners gets shrunk into a grey frame, so give it a square.
    draw_master(rounded=False).resize((1024, 1024), Image.LANCZOS).save(
        OUT / "app-icon-1024.png", optimize=True
    )
    print(f"Wrote {len(SIZES) + 1} icons to {OUT.relative_to(ROOT).as_posix()}/")


if __name__ == "__main__":
    main()
