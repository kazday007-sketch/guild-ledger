# Renders the music loops in assets/music: python3 src/synth_music.py assets/music (needs numpy and ffmpeg).
# Each loop is a slow, low piece for one place: a drone, a soft pad moving through four chords, a few far-off bell
# notes, and the sound of the place itself (wind, water, a hum). Loops are seamless: the reverb tail past the end is
# folded back onto the start. Fixed seeds, so a re-run gives the same files.
import numpy as np, subprocess, sys, os
SR = 22050
L = 64.0  # loop length in seconds
N = int(SR * L)
out = sys.argv[1]
rng = np.random.default_rng(11)
def t(d): return np.arange(int(SR * d)) / SR
def hz(semis, root): return root * 2 ** (semis / 12)
def spectral(x, shape):
    # filter by multiplying the spectrum; shape(freqs) -> gain
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * shape(f), len(x))
lowpass = lambda fc, slope=2: (lambda f: 1 / (1 + (f / fc) ** (2 * slope)))
band = lambda lo, hi: (lambda f: 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4))
def soft(freq, d, harmonics=6, roll=1.6, detune=.0):
    # a warm tone: a few harmonics falling away fast, two voices a hair apart
    x = t(d); y = np.zeros_like(x)
    for k in range(1, harmonics + 1):
        for dv in (-detune, detune):
            f = freq * k * (1 + dv)
            if d == L: f = round(f * L) / L  # a whole number of cycles per loop, so the seam doesn't click
            y += np.sin(2 * np.pi * f * x + rng.uniform(0, 6)) / k ** roll
    return y
def adsr(d, a, r):
    x = t(d); return np.minimum(1, x / a) * np.minimum(1, np.maximum(0, (d - x) / r))
def bell(freq, d=5.0):
    x = t(d); return sum(g * np.sin(2 * np.pi * freq * m * x) * np.exp(-x / dc) for m, g, dc in [(1, .6, 1.8), (2.01, .25, 1.0), (3.02, .1, .6), (4.2, .05, .3)]) * np.minimum(1, x / .01)
def place(y, at, sig):
    i = int(SR * at) % len(y); n = min(len(sig), len(y) - i); y[i:i + n] += sig[:n]
    if n < len(sig): place(y, 0, sig[n:])  # wraps round the loop
def hall_ir(d=3.2):
    x = t(d); ir = rng.uniform(-1, 1, len(x)) * np.exp(-x / .7)
    ir = spectral(ir, lowpass(1800)); ir[0] += 1.5; return ir / np.sqrt(np.sum(ir ** 2))
IR = hall_ir()
def reverb(y, wet):
    # circular convolution: the tail past the loop's end lands on its start, so the loop stays seamless
    r = np.fft.irfft(np.fft.rfft(y) * np.fft.rfft(IR, len(y)), len(y))
    return y * (1 - wet) + r * wet * np.std(y) / (np.std(r) + 1e-9)

def track(name, root, chords, scale, ambience, notes=10, drone_gain=.5, pad_gain=.35, bell_gain=.18, extra=None):
    y = np.zeros(N)
    # drone: root and fifth, breathing slowly
    for semis, g in [(0, 1), (7, .5), (12, .35)]:
        d = soft(hz(semis, root), L, 5, 2.2, .002) * g
        y += d * drone_gain * (.75 + .25 * np.sin(2 * np.pi * t(L) / 16 + semis))
    # pad: four chords, 8 s each, twice round; long swells so the changes blur
    seg = L / 8
    for i in range(8):
        for semis in chords[i % len(chords)]:
            place(y, i * seg - 1.5, soft(hz(semis, root * 2), seg + 3, 4, 2.0, .003) * adsr(seg + 3, 3.0, 3.0) * pad_gain / 3)
    # far bells: a few notes from the scale, never on a grid
    at = rng.uniform(2, 5)
    for _ in range(notes):
        place(y, at, bell(hz(rng.choice(scale), root * 4)) * bell_gain * rng.uniform(.6, 1))
        at += rng.uniform(3.5, 8.5)
    if extra: y += extra()
    y = spectral(y, lowpass(1400, 1.5))
    y = reverb(y, .45)
    y += ambience()
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (-9 / 20)
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '48k', os.path.join(out, name + '.mp3')], input=pcm, check=True)
    print(name)

def noise(): return rng.uniform(-1, 1, N)
def wander(period, depth, base):  # a slow, seamless swell
    x = t(L); return base + depth * (.5 + .5 * np.sin(2 * np.pi * x / period + rng.uniform(0, 6))) * (.6 + .4 * np.sin(2 * np.pi * x / (period / 3) + 1))
def wind(): return spectral(noise(), band(180, 700)) * wander(L / 2, .5, .15) * .12
def water():
    flow = spectral(noise(), band(120, 500)) * wander(L / 4, .3, .4) * .07
    drips = np.zeros(N)
    at = rng.uniform(0, 2)
    while at < L:
        f0 = rng.uniform(900, 1700); d = .09; x = t(d)
        drop = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * x / d)) / SR) * np.exp(-x / .025)
        place(drips, at, reverb_short(drop) * rng.uniform(.04, .1)); at += rng.uniform(.8, 4.5)
    return flow + drips
def reverb_short(x):
    ir = rng.uniform(-1, 1, int(SR * .8)) * np.exp(-t(.8) / .18); ir = spectral(ir, lowpass(2500)); ir[0] += 2
    return np.convolve(x, ir / np.sqrt(np.sum(ir ** 2)))
def hum():
    h = soft(55, L, 3, 1.5, .001) * .05 * (.8 + .2 * np.sin(2 * np.pi * t(L) / 8))
    chains = np.zeros(N); at = rng.uniform(3, 8)
    while at < L - 1:
        for k in range(rng.integers(2, 4)):
            f = rng.uniform(700, 1100); x = t(.25)
            place(chains, at + k * rng.uniform(.08, .16), reverb_short(np.sin(2 * np.pi * f * x) * np.exp(-x / .04) + .5 * np.sin(2 * np.pi * f * 2.3 * x) * np.exp(-x / .025)) * .025)
        at += rng.uniform(9, 18)
    return h + chains
def candles():
    c = np.zeros(N); at = 0.0
    while at < L:
        x = t(.01); place(c, at, spectral(rng.uniform(-1, 1, len(x)), band(1500, 5000)) * np.exp(-x / .002) * rng.uniform(.01, .04)); at += rng.exponential(.35)
    return c + spectral(noise(), band(200, 800)) * .01
def heartbeat():
    y = np.zeros(N); beat = 60 / 52
    for i in range(int(L / beat)):
        for off, g in [(0, 1), (.28, .6)]:
            x = t(.35); place(y, i * beat + off, np.sin(2 * np.pi * np.cumsum(70 * (1 - .4 * x / .35)) / SR) * np.exp(-x / .08) * g * .35)
    return y

minor = [0, 3, 5, 7, 10]
track('crypt', 73.42, [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]], minor, wind)            # D minor: Dm Bb Gm A
track('sewers', 65.41, [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -2, 2]], minor, water, notes=8)  # C minor: Cm Ab Fm Gm
track('vault', 82.41, [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-1, 3, 6]], minor, hum, notes=9)     # E minor: Em C Am B dim
track('boss', 73.42, [[0, 1, 7], [0, 3, 6], [-2, 1, 5], [0, 1, 7]], [0, 1, 3, 6, 7], wind, notes=5, pad_gain=.4, bell_gain=.12, extra=heartbeat)
track('hall', 87.31, [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], [0, 2, 4, 7, 9], candles, notes=12, drone_gain=.35, bell_gain=.15)  # F: F Dm Bb C
