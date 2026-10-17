# Renders the music loops in assets/music: python3 src/synth_music.py assets/music (needs numpy and ffmpeg).
# Medieval meets EDM, kept low and soft: lute arpeggios, a recorder tune, a hurdy-gurdy drone and a frame drum in old
# church modes, over a dance track's frame of four-on-the-floor kick, offbeat bass and a pad that ducks on every kick.
# Each loop has a form: an intro, a build (drum roll, a rising hiss, the pad's filter opening, a breath of silence),
# the drop, and a breakdown that leads back round. The energy is in the rhythm and the bass; nothing on top is sharp.
# Every loop is 64 s, a whole number of bars, and seamless: notes and reverb past the end wrap onto the start. Each
# file carries the first XF seconds again at its end, so the player can overlap copies exactly one loop apart.
# Fixed seeds, so a re-run gives the same files.
import numpy as np, subprocess, sys, os
SR = 22050
L = 64.0  # loop length in seconds
N = int(SR * L)
XF = 3.0  # seconds repeated at the end of each file for the player's crossfade (XF in src/ui.html)
out = sys.argv[1]
rng = np.random.default_rng(11)
MODES = {'dorian': [0, 2, 3, 5, 7, 9, 10], 'aeolian': [0, 2, 3, 5, 7, 8, 10], 'phrygian': [0, 1, 3, 5, 7, 8, 10]}
def t(d): return np.arange(int(SR * d)) / SR
def spectral(x, shape):
    # filter by multiplying the spectrum; shape(freqs) -> gain
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * shape(f), len(x))
lowpass = lambda fc, slope=2: (lambda f: 1 / (1 + (f / fc) ** (2 * slope)))
band = lambda lo, hi: (lambda f: 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4))
def place(y, at, sig):
    i = int(round(SR * at)) % len(y); n = min(len(sig), len(y) - i); y[i:i + n] += sig[:n]
    if n < len(sig): place(y, 0, sig[n:])  # wraps round the loop
def sweep(y, cutoff):
    # a lowpass whose cutoff moves: cutoff(seconds) -> Hz. Short overlapping windows, wrapping round the loop.
    W, H = 1764, 441  # H divides N, so the frames tile the loop exactly
    win = np.hanning(W + 1)[:-1]; n = len(y); fr = n // H
    idx = (np.arange(fr)[:, None] * H + np.arange(W)) % n
    f = np.fft.rfftfreq(W, 1 / SR); fc = cutoff((np.arange(fr) * H + W / 2) / SR)[:, None]
    Y = np.fft.irfft(np.fft.rfft(y[idx] * win) / (1 + (f / fc) ** 3), W) * win
    o = np.zeros(n); np.add.at(o, idx, Y); return o / 1.5

def hall_ir(d=3.0):
    x = t(d); ir = rng.uniform(-1, 1, len(x)) * np.exp(-x / .6)
    ir = spectral(ir, lowpass(1800)); ir[0] += 1.5; return ir / np.sqrt(np.sum(ir ** 2))
IR = hall_ir()
def reverb(y, wet):
    # circular convolution: the tail past the loop's end lands on its start, so the loop stays seamless
    r = np.fft.irfft(np.fft.rfft(y) * np.fft.rfft(IR, len(y)), len(y))
    return y * (1 - wet) + r * wet * np.std(y) / (np.std(r) + 1e-9)

# ---- instruments ----
def lute(f, d=.9, bright=1.0):
    # a plucked string: harmonics shaped by where it's plucked, the high ones dying first, a hair sharp as they rise
    x = t(d); y = np.zeros_like(x)
    for k in range(1, 11):
        a = abs(np.sin(k * np.pi * .18)) / k ** 1.4
        y += a * np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * x) * np.exp(-x * (2.2 + 1.3 * k / bright))
    return y * np.minimum(1, x / .003)
def recorder(f, d):
    # a soft wooden flute: nearly a sine, a little breath, vibrato that comes in late
    x = t(d + .25); vib = 1 + .004 * np.sin(2 * np.pi * 5.2 * x) * np.minimum(1, np.maximum(0, x - .25) / .3)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + .12 * np.sin(2 * ph) + .04 * np.sin(3 * ph)
    y += spectral(rng.uniform(-1, 1, len(x)), band(f * .8, f * 2.5)) * .25
    return y * np.minimum(1, x / .06) * np.clip((d + .25 - x) / .25, 0, 1)
def warm(f, d, harmonics=5, roll=2.0, detune=.003):
    # pad and drone voices: a few harmonics falling away fast, two voices a hair apart
    x = t(d); y = np.zeros_like(x)
    for k in range(1, harmonics + 1):
        for dv in (-detune, detune):
            fk = f * k * (1 + dv)
            if d == L: fk = round(fk * L) / L  # a whole number of cycles per loop, so the seam doesn't click
            y += np.sin(2 * np.pi * fk * x + rng.uniform(0, 6)) / k ** roll
    return y
def gurdy(f):
    # hurdy-gurdy drone: a reedy saw, root and fifth, with the wheel's slow unevenness
    x = t(L); y = np.zeros(N)
    for semis, g in [(0, 1), (7, .55), (-12, .5)]:
        fr = f * 2 ** (semis / 12)
        for k in range(1, 9):
            fk = round(fr * k * L) / L
            y += g * np.sin(2 * np.pi * fk * x + rng.uniform(0, 6)) / k ** 1.1
    return spectral(y, lowpass(900, 1.5)) * (.8 + .2 * np.sin(2 * np.pi * x / 4) * np.sin(2 * np.pi * x / 16 + 1))
def kick(g=1.0):
    # round and low: a sine falling from 110 to 45 Hz, warmed so a phone speaker still hears the thump
    x = t(.45); fr = 45 + 65 * np.exp(-x / .045)
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x / .17)
    y = np.tanh(1.8 * y) / np.tanh(1.8)
    y += spectral(rng.uniform(-1, 1, len(x)), band(600, 2000)) * np.exp(-x / .004) * .12
    return y * np.minimum(1, x / .002) * g
def frame(hi=False, g=1.0):
    # frame drum: a dull 'dum' in the middle of the skin, a dry 'tek' at the rim
    x = t(.35)
    if hi:
        y = spectral(rng.uniform(-1, 1, len(x)), band(700, 2400)) * np.exp(-x / .028) * .5 + np.sin(2 * np.pi * 330 * x) * np.exp(-x / .03) * .3
    else:
        y = np.sin(2 * np.pi * np.cumsum(150 * (1 - .25 * np.minimum(1, x / .1))) / SR) * np.exp(-x / .12)
        y += spectral(rng.uniform(-1, 1, len(x)), band(120, 600)) * np.exp(-x / .05) * .4
    return y * np.minimum(1, x / .002) * g
def shaker(g=1.0):
    x = t(.08); return spectral(rng.uniform(-1, 1, len(x)), band(2500, 6000)) * np.exp(-x / .018) * np.minimum(1, x / .004) * g
def bass(f, d, g=1.0):
    # the offbeat dance bass, kept round: a fundamental and two soft harmonics, a quick fall
    x = t(d); y = np.sin(2 * np.pi * f * x) + .35 * np.sin(4 * np.pi * f * x) + .12 * np.sin(6 * np.pi * f * x)
    return y * np.minimum(1, x / .004) * np.exp(-x / (d * .55)) * np.clip((d - x) / .02, 0, 1) * g

# ---- a song ----
class Song:
    def __init__(s, bpm, root, mode, chords, form):
        s.beat = 60 / bpm; s.bar = 4 * s.beat; s.bars = len(form)
        assert abs(s.bars * s.bar - L) < 1e-6, (bpm, len(form))
        s.root, s.mode, s.chords, s.form = root, MODES[mode], chords, form
    def hz(s, deg, octave=0):  # a degree of the mode (0 is the home note) as a frequency
        return s.root * 2 ** ((s.mode[deg % 7] + 12 * (deg // 7 + octave)) / 12)
    def chord(s, bar): return s.chords[bar % len(s.chords)]
    def at(s, bar, step=0): return bar * s.bar + step * s.beat / 4  # 16 steps a bar
    def section(s, sec): return np.array([s.form[int(x / s.bar) % s.bars] for x in np.atleast_1d(sec)])
    def into(s, bar):  # how far through its run of same-section bars this bar is, 0 to 1
        a = bar
        while a > 0 and s.form[a - 1] == s.form[bar]: a -= 1
        b = bar
        while b + 1 < s.bars and s.form[b + 1] == s.form[bar]: b += 1
        return (bar - a) / max(1, b - a), bar - a, b - a + 1

ARP = [0, 2, 4, 7, 4, 2, 0, 2, 0, 2, 4, 7, 9, 7, 4, 2]  # chord tones up and back, in 16ths
def render(name, song, tune, ambience, cfg):
    s = song; c = dict(kick=.9, bass=.5, hat=.12, frame=.55, arp=.32, mel=.22, pad=.28, drone=.22, riser=.18, duck=.55, gap=True,
                        drum='D...t.D.D...t...', groove='..t...t...t..tt.', roll=True, rolling=False, cut={'i': 1100, 'd': 2600, 'r': 800})
    c.update(cfg)
    tonal = np.zeros(N); drums = np.zeros(N)
    for b in range(s.bars):
        sec, (p, k, n) = s.form[b], s.into(b); ch = s.chord(b)
        # drone and pad live outside this loop; here the notes
        for st in range(16):
            when = s.at(b, st)
            # lute arpeggio: 8ths in the intro, 16ths from the build on, sparse in the breakdown
            every = {'i': 2, 'b': 1, 'd': 1, 'r': 4}[sec]
            if st % every == 0 and c['arp']:
                g = c['arp'] * {'i': .6, 'b': .55 + .4 * p, 'd': 1, 'r': .7}[sec] * (1 if st % 4 == 0 else .7)
                place(tonal, when, lute(s.hz(ch + ARP[st], 1), .9 if every == 1 else 1.6) * g)
            # frame drum: the old dance rhythm in the intro, a lighter answer to the kick in the drop
            pat = c['drum'] if sec in 'ir' else c['groove'] if sec == 'd' else ''
            if pat and pat[st] != '.':
                place(drums, when, frame(pat[st] == 't', c['frame'] * (.6 if sec == 'r' else 1)))
            if sec == 'b' and c['roll']:  # the roll tightens through the build: quarters, eighths, sixteenths
                step = 4 if p < .34 else 2 if p < .67 else 1
                if st % step == 0 and not (k == n - 1 and st >= 14):
                    place(drums, when, frame(True, c['frame'] * (.3 + .6 * (p + st / 16 / n))))
            if sec == 'd':
                if st % 4 == 0: place(drums, when, kick(c['kick']))
                if st % 4 == 2 and c['hat']: place(drums, when, shaker(c['hat']))
                elif c['hat'] and c['rolling']: place(drums, when, shaker(c['hat'] * .45))
                bassline = (st % 4 != 0) if c['rolling'] else (st % 4 == 2)
                if bassline and c['bass']:
                    place(drums, when, bass(s.hz(ch, -1 if s.root > 70 else 0), s.beat / (4 if c['rolling'] else 2) * .95, c['bass']))
            if sec == 'b' and st % 4 == 0 and c['kick'] and not (k == n - 1 and st >= 12):
                place(drums, when, kick(c['kick'] * (.35 + .5 * p)))
        # the recorder tune: last half of the intro, the whole drop
        if c['mel'] and (sec == 'd' or (sec == 'i' and p >= .5)):
            for beat, deg, length in tune:
                if int(beat // 4) == b % 4:
                    place(tonal, s.at(b, (beat % 4) * 4), recorder(s.hz(deg, 2), length * s.beat * .92) * c['mel'] * (1 if sec == 'd' else .7))
        if sec == 'd' and b > 0 and s.form[b - 1] == 'b':  # the drop lands: a deep soft boom
            x = t(2.5); place(drums, s.at(b), np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-x / .2)) / SR) * np.exp(-x / .7) * c['kick'] * .7)
    # pad: one chord a bar, long swells so the changes blur; then a filter that opens through the build
    pad = np.zeros(N)
    for b in range(s.bars):
        ch = s.chord(b)
        for dg in (ch, ch + 2, ch + 4):
            d = s.bar + 1.2; x = t(d)
            place(pad, s.at(b) - .3, warm(s.hz(dg, 1), d) * np.minimum(1, x / .5) * np.clip((d - x) / .9, 0, 1) * c['pad'] / 3)
    def cutoff(sec):
        bars = (sec / s.bar).astype(int) % s.bars; out = np.empty(len(sec))
        for i, b in enumerate(bars):
            if s.form[b] == 'b':
                p = s.into(b)[0] + (sec[i] / s.bar % 1) / s.into(b)[2]
                out[i] = 500 * (c['cut']['d'] / 500) ** min(1, p)
            else: out[i] = c['cut'][s.form[b]]
        return out
    tonal += sweep(pad, cutoff) + gurdy(s.root) * c['drone'] * .4
    # riser: hiss climbing through each build
    if c['riser']:
        rise = np.zeros(N); ns = rng.uniform(-1, 1, N); x = np.arange(N) / SR
        for b in range(s.bars):
            if s.form[b] == 'b':
                p0, k, n = s.into(b); seg = slice(int(s.at(b) * SR), int(s.at(b + 1) * SR))
                p = (k + (x[seg] - s.at(b)) / s.bar) / n
                rise[seg] = ns[seg] * p ** 2
        tonal += sweep(rise, lambda sec: 300 + 2500 * np.clip([(s.into(int(v / s.bar) % s.bars)[1] + v / s.bar % 1) / s.into(int(v / s.bar) % s.bars)[2] for v in sec], 0, 1) ** 2) * c['riser']
    tonal = reverb(tonal, .4)
    # sidechain: every kick ducks the pad, drone and lute, the dance-floor breathing
    x = np.arange(N) / SR; ph = x % s.beat; secs = np.array(list(s.form))[(x / s.bar).astype(int) % s.bars]
    depth = np.where(secs == 'd', c['duck'], np.where(secs == 'b', c['duck'] * .3, 0))
    tonal *= 1 - depth * np.minimum(1, ph / .006) * np.exp(-ph / (s.beat * .35))
    y = tonal + reverb(drums, .15)
    if c['gap']:  # a breath of silence on the last half beat before the drop
        for b in range(s.bars):
            if s.form[b] == 'b' and s.form[(b + 1) % s.bars] == 'd':
                a, z = s.at(b + 1) - s.beat / 2, s.at(b + 1)
                m = np.clip(np.minimum((x - a) / .02, (z - x) / .01), 0, 1) * ((x >= a) & (x < z))
                y *= 1 - .9 * m
    y = spectral(y, lowpass(3200, 1.2))
    y += ambience()
    y = np.tanh(y / np.sqrt(np.mean(y ** 2)) * .09 / .45) * .45  # about -21 dB average, peaks rounded off
    y = np.concatenate([y, y[:int(SR * XF)]])
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '48k', os.path.join(out, name + '.mp3')], input=pcm, check=True)
    print(name)

# ---- the sound of each place, under the music ----
def noise(): return rng.uniform(-1, 1, N)
def wander(period, depth, base):  # a slow, seamless swell
    x = t(L); return base + depth * (.5 + .5 * np.sin(2 * np.pi * x / period + rng.uniform(0, 6))) * (.6 + .4 * np.sin(2 * np.pi * x / (period / 3) + 1))
def wind(): return spectral(noise(), band(180, 700)) * wander(L / 2, .5, .15) * .08
def reverb_short(x):
    ir = rng.uniform(-1, 1, int(SR * .8)) * np.exp(-t(.8) / .18); ir = spectral(ir, lowpass(2500)); ir[0] += 2
    return np.convolve(x, ir / np.sqrt(np.sum(ir ** 2)))
def water():
    flow = spectral(noise(), band(120, 500)) * wander(L / 4, .3, .4) * .05
    drips = np.zeros(N); at = rng.uniform(0, 2)
    while at < L:
        f0 = rng.uniform(900, 1700); d = .09; x = t(d)
        drop = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * x / d)) / SR) * np.exp(-x / .025)
        place(drips, at, reverb_short(drop) * rng.uniform(.03, .07)); at += rng.uniform(.8, 4.5)
    return flow + drips
def hum():
    h = warm(55, L, 3, 1.5, .001) * .04 * (.8 + .2 * np.sin(2 * np.pi * t(L) / 8))
    chains = np.zeros(N); at = rng.uniform(3, 8)
    while at < L - 1:
        for k in range(rng.integers(2, 4)):
            f = rng.uniform(700, 1100); x = t(.25)
            place(chains, at + k * rng.uniform(.08, .16), reverb_short(np.sin(2 * np.pi * f * x) * np.exp(-x / .04) + .5 * np.sin(2 * np.pi * f * 2.3 * x) * np.exp(-x / .025)) * .02)
        at += rng.uniform(9, 18)
    return h + chains
def candles():
    c = np.zeros(N); at = 0.0
    while at < L:
        x = t(.01); place(c, at, spectral(rng.uniform(-1, 1, len(x)), band(1500, 5000)) * np.exp(-x / .002) * rng.uniform(.01, .03)); at += rng.exponential(.35)
    return c + spectral(noise(), band(200, 800)) * .008

# tunes: (beat in a 4-bar phrase, mode degree, length in beats)
WALKING = [(0, 4, 1), (1, 5, .5), (1.5, 4, .5), (2, 2, 1), (3, 0, 1), (4, 1, 1), (5, 2, .5), (5.5, 3, .5), (6, 4, 2),
           (8, 5, 1.5), (9.5, 4, .5), (10, 3, 1), (11, 1, 1), (12, 2, 1), (13, 1, .5), (13.5, 0, .5), (14, 0, 2)]
LAMENT = [(0, 0, 1.5), (1.5, 1, .5), (2, 2, 2), (4, 4, 1), (5, 3, .5), (5.5, 2, .5), (6, 1, 2), (8, 2, 1), (9, 3, 1),
          (10, 4, 1.5), (11.5, 3, .5), (12, 2, 1), (13, 1, 1), (14, 0, 2)]
CALL = [(0, 7, .5), (.5, 6, .5), (1, 7, 1), (2, 4, 1), (3, 5, .5), (3.5, 4, .5), (4, 3, 2), (6, 1, 1), (7, 0, 1),
        (8, 7, .5), (8.5, 6, .5), (9, 7, 1), (10, 8, 1), (11, 7, 1), (12, 5, 1), (13, 4, .5), (13.5, 3, .5), (14, 1, 2)]
ROUND = [(0, 0, 1), (1, 2, 1), (2, 4, 1.5), (3.5, 5, .5), (4, 4, 1), (5, 2, 1), (6, 3, 2), (8, 2, 1), (9, 4, 1),
         (10, 6, 1), (11, 5, .5), (11.5, 4, .5), (12, 3, 1), (13, 1, 1), (14, 0, 2)]

F = lambda *parts: ''.join(sec * n for sec, n in parts)
# crypt: D dorian, Dm C G Dm, 120 a minute
render('crypt', Song(120, 73.42, 'dorian', [0, 6, 3, 0], F(('i', 8), ('b', 4), ('d', 16), ('r', 4))), WALKING, wind, {})
# sewers: C aeolian, Cm Ab Bb Gm, 112.5 a minute, a slinkier drum
render('sewers', Song(112.5, 65.41, 'aeolian', [0, 5, 6, 4], F(('i', 6), ('b', 4), ('d', 16), ('r', 4))), LAMENT, water,
       dict(drum='D..t..D...D.t...', groove='...t..t....t..t.', mel=.2))
# vault: E phrygian, Em D C F, 127.5 a minute, a longer drop
render('vault', Song(127.5, 82.41, 'phrygian', [0, 6, 5, 1], F(('i', 6), ('b', 4), ('d', 20), ('r', 4))), CALL, hum,
       dict(drum='D.tD..t.D.t...t.', groove='..t.t.t...t.t.t.'))
# boss: D phrygian, Dm Eb Dm C, 135 a minute, rolling bass and two drops
render('boss', Song(135, 73.42, 'phrygian', [0, 1, 0, 6], F(('i', 4), ('b', 4), ('d', 14), ('r', 2), ('b', 4), ('d', 8))), CALL, wind,
       dict(kick=1.0, bass=.42, rolling=True, drum='D..D..D.D..D.t.t', groove='t.t.t.t.t.t.tttt', frame=.5, duck=.65, mel=.18, drone=.3))
# hall (title, map, shop): G dorian, Gm C Gm F, 90 a minute, a gentle groove with no build
render('hall', Song(90, 98.0, 'dorian', [0, 3, 0, 6], F(('i', 4), ('d', 16), ('r', 4))), ROUND, candles,
       dict(kick=.5, bass=.32, hat=0, riser=0, duck=.3, gap=False, arp=.28, cut={'i': 1000, 'd': 1800, 'r': 900}))
