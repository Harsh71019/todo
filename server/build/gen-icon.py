#!/usr/bin/env python3
"""Generates a 1024x1024 Taskflow app icon as PNG."""
import struct, zlib, math, os

SIZE = 1024

def write_png(path, w, h, data_rgba):
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            r, g, b, a = data_rgba[y * w + x]
            raw += bytes([r, g, b, a])

    def chunk(tag, body):
        c = tag + body
        return struct.pack('>I', len(body)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 6)))
        f.write(chunk(b'IEND', b''))

def lerp(a, b, t):
    return a + (b - a) * t

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

pixels = [(0, 0, 0, 0)] * (SIZE * SIZE)

cx, cy = SIZE / 2, SIZE / 2
outer_r = SIZE * 0.46
inner_r = SIZE * 0.44
corner_r = SIZE * 0.22  # rounded corner radius for the squircle

# --- draw a squircle (superellipse, n=5) background ---
for y in range(SIZE):
    for x in range(SIZE):
        nx = (x - cx) / outer_r
        ny = (y - cy) / outer_r
        # superellipse: |x|^n + |y|^n <= 1, n=4 gives nice rounded square
        val = abs(nx) ** 4 + abs(ny) ** 4

        if val > 1.0:
            pixels[y * SIZE + x] = (0, 0, 0, 0)
            continue

        # gradient: top-left cornflower blue → bottom-right indigo
        t = (nx + ny + 2) / 4  # 0..1 across diagonal
        r = int(lerp(96, 55, t))    # 60 → 55
        g = int(lerp(165, 48, t))   # 165 → 48
        b_val = int(lerp(250, 163, t))  # 250 → 163

        # soft edge anti-alias
        edge = clamp((1.0 - val) * SIZE * 0.012, 0, 1)
        alpha = int(255 * edge)

        pixels[y * SIZE + x] = (r, g, b_val, alpha)

# --- draw a white checkmark ---
# Points (normalised -1..1): start (−0.30, 0.05) → mid (−0.02, 0.33) → end (0.38, −0.25)
def line_alpha(x, y, ax, ay, bx, by, thickness):
    """Signed distance from point (x,y) to line segment (ax,ay)→(bx,by), returns coverage."""
    dx, dy = bx - ax, by - ay
    ln = math.sqrt(dx*dx + dy*dy)
    if ln == 0:
        return 0
    t_val = clamp(((x - ax)*dx + (y - ay)*dy) / (ln*ln), 0, 1)
    px_c, py_c = ax + t_val*dx, ay + t_val*dy
    dist = math.sqrt((x - px_c)**2 + (y - py_c)**2)
    half = thickness / 2
    return clamp((half - dist) / (half * 0.15), 0, 1)

# Checkmark arms (in pixel space)
arm1 = (cx - 0.30*SIZE*0.46, cy + 0.05*SIZE*0.46,
        cx - 0.02*SIZE*0.46, cy + 0.33*SIZE*0.46)
arm2 = (cx - 0.02*SIZE*0.46, cy + 0.33*SIZE*0.46,
        cx + 0.38*SIZE*0.46, cy - 0.25*SIZE*0.46)
thickness = SIZE * 0.088

for y in range(SIZE):
    for x in range(SIZE):
        bg = pixels[y * SIZE + x]
        if bg[3] == 0:
            continue
        a1 = line_alpha(x, y, arm1[0], arm1[1], arm1[2], arm1[3], thickness)
        a2 = line_alpha(x, y, arm2[0], arm2[1], arm2[2], arm2[3], thickness)
        alpha_check = clamp(a1 + a2, 0, 1)
        if alpha_check > 0:
            br, bg_c, bb, ba = bg
            wr, wg, wb = 255, 255, 255
            fr = int(lerp(br, wr, alpha_check))
            fg = int(lerp(bg_c, wg, alpha_check))
            fb = int(lerp(bb, wb, alpha_check))
            pixels[y * SIZE + x] = (fr, fg, fb, ba)

out = os.path.join(os.path.dirname(__file__), 'icon.iconset', 'icon_1024x1024.png')
write_png(out, SIZE, SIZE, pixels)
print(f'Written {out}')
