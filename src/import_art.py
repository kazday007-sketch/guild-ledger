# Copies the game-ready art into ../assets as web-sized WebP files.
#   python3 src/import_art.py /path/to/art
# The art folder is the one described in its README (cards/*-4x5, icons, characters, ui, backgrounds).
# Nothing is cropped: card art is already fitted whole into a 4:5 window.
import os, sys, glob
from collections import deque
from PIL import Image, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')

def save(im, rel, size=None, q=80):
    path = os.path.join(out, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if size: im.thumbnail(size, Image.LANCZOS)
    im.save(path, 'WEBP', quality=q, method=6)

def cut_out(path, step=14, wall=30, dark=None):
    # Icons and seals are painted on a vignetted slate square inside a near-black outline.
    # Flood the slate from the edges, stopping at the outline, and make it transparent.
    # With `dark`, flood only pixels darker than that instead (a black surround).
    im = Image.open(path).convert('RGBA'); w, h = im.size; px = im.load()
    lum = lambda c: (c[0] * 3 + c[1] * 6 + c[2]) / 10
    seen = bytearray(w * h); q = deque()
    for i in range(w):
        for x, y in ((i, 0), (i, h - 1), (0, i), (w - 1, i)):
            if not seen[y * w + x]: seen[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft(); c = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                n = px[nx, ny]
                ok = lum(n) < dark if dark else lum(n) > wall and max(abs(n[k] - c[k]) for k in range(3)) <= step
                if ok:
                    seen[ny * w + nx] = 1; q.append((nx, ny))
    mask = Image.frombytes('L', (w, h), bytes(0 if v else 255 for v in seen))
    im.putalpha(mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))
    return im

def each(pattern):
    return sorted(glob.glob(os.path.join(src, pattern)))

def strip(name, prefix):
    return os.path.splitext(os.path.basename(name))[0].removeprefix(prefix)

# Card art: monsters by suit + rank, elites by rank, weapons by rank, potions by size.
for f in each('cards/monsters-4x5/*.png'):
    parts = strip(f, 'card-monster-').split('-')  # spades-02-rats -> spades, 02
    save(Image.open(f).convert('RGB'), f'cards/{parts[0]}-{int(parts[1])}.webp')
for f in each('cards/weapons-4x5/*.png'):
    save(Image.open(f).convert('RGB'), f'cards/weapon-{int(strip(f, "card-weapon-").split("-")[0])}.webp')
for f in each('cards/potions-4x5/*.png'):
    save(Image.open(f).convert('RGB'), f'cards/{strip(f, "card-")}.webp')
save(Image.open(os.path.join(src, 'cards/card-back.png')).convert('RGBA'), 'cards/back.webp', (200, 280))

# Icons (relics, services, emblem, HUD) and wax seals, cut out of their slate squares.
# Shown small, so 128px is plenty for 2x screens.
for f in each('icons/*.png') + each('icons/hud/*.png'):
    save(cut_out(f), f'icons/{strip(f, "")}.webp', (128, 128))
for f in each('ui/seal-*.png'):
    save(cut_out(f), f'ui/{strip(f, "")}.webp', (128, 128))
# Effects are already transparent.
for f in each('effects/*.png'):
    save(Image.open(f).convert('RGBA'), f'fx/{strip(f, "fx-")}.webp', (192, 192))
emblem = cut_out(os.path.join(src, 'icons/emblem-guild.png'))
emblem.resize((64, 64), Image.LANCZOS).save(os.path.join(out, 'icons', 'favicon.png'))

# Stamps keep their transparency; the word (PAID, STRIKE, RAISED) is set in code.
for f in each('ui/stamp-*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (320, 145))

# Contract parchment: the torn edges sit on black, so make the dark surround transparent.
save(cut_out(os.path.join(src, 'ui/contract-parchment.png'), step=40, wall=-1, dark=70), 'ui/contract-parchment.webp', (360, 470))

for f in each('ui/textures/*.png'):
    save(Image.open(f).convert('RGB'), f'ui/{strip(f, "")}.webp', (512, 512), 75)
for f in each('characters/*.png'):
    save(Image.open(f).convert('RGB'), f'portraits/{strip(f, "")}.webp', (240, 300))
for f in each('backgrounds/*.jpg'):
    save(Image.open(f).convert('RGB'), f'backgrounds/{strip(f, "bg-")}.webp', None, 72)

n = sum(len(fs) for _, _, fs in os.walk(out))
kb = sum(os.path.getsize(os.path.join(d, x)) for d, _, fs in os.walk(out) for x in fs) // 1024
print(f'wrote {n} files to assets/ ({kb} KB)')

# Batch 2 UI art (2026-10-09): numerals, symbols, buttons, bars, panels, pips, card frames. Already cut out.
# Card numerals are black masks the code tints. Each is trimmed to its own width on a shared height so
# two-digit numbers sit together; the widths (as aspect ratios) are listed in DIGIT_W in ui.html.
for f in each('ui/numerals/num-*.png'):
    im = Image.open(f).convert('RGBA'); a = im.getchannel('A')
    l, _, r, _ = a.getbbox(); im = im.crop((l, 22, r, 234))
    save(im, f'ui/{strip(f, "")}.webp', (200, 64), 90)
for f in each('ui/symbols/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (96, 96), 85)
for f in each('ui/buttons/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', None, 85)
for f in each('ui/panels/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (320, 320), 85)
for f in each('cards/frames/*.png'):
    save(Image.open(f).convert('RGBA'), f'cards/{strip(f, "card-")}.webp', None, 85)

# Batch 3 art (2026-10-09): a table and frame for each place, atmosphere layers, crests, endings, medals,
# map medallions and shop pieces. Already cut out; new effects, portraits and backgrounds use the loops above.
for f in each('ui/tables/table-*.png'):
    save(Image.open(f).convert('RGB'), f'ui/{strip(f, "")}.webp', (512, 512), 72)
for f in each('ui/tables/frame-*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (360, 360), 85)
for f in each('ui/ambient/ambient-*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (1024, 576), 70)
for f in each('ui/crests/crest-*.png') + each('ui/map/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (160, 160), 85)
save(Image.open(os.path.join(src, 'ui/crests/ribbon.png')).convert('RGBA'), 'ui/ribbon.webp', (420, 110), 85)
for f in each('ui/end/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (240, 240), 85)
for f in each('ui/shop/*.png'):
    save(Image.open(f).convert('RGBA'), f'ui/{strip(f, "")}.webp', (420, 240), 85)
