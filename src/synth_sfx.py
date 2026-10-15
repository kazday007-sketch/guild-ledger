# Renders the card, combat and coin sounds in assets/sfx: python3 src/synth_sfx.py assets/sfx (needs numpy and ffmpeg).
# Built from filtered noise and tones with a fixed seed, so a re-run gives the same files.
import numpy as np, subprocess, sys, os
SR = 44100
rng = np.random.default_rng(7)
out = sys.argv[1]
def t(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.uniform(-1, 1, int(SR * d))
def env(d, a=.005, decay=.1):
    x = t(d); e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-np.maximum(0, x - a) / decay); return e
def biquad(x, kind, f, q=.7):
    # f may be an array (sweep); recompute coefficients every 64 samples
    f = np.broadcast_to(np.asarray(f, float), x.shape)
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for s in range(0, len(x), 64):
        w = 2 * np.pi * min(f[s], SR * .45) / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
        if kind == 'lp': b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
        elif kind == 'hp': b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
        else: b0, b1, b2 = al, 0, -al
        a0, a1, a2 = 1 + al, -2 * c, 1 - al
        b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0
        for i in range(s, min(s + 64, len(x))):
            v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            x2, x1, y2, y1 = x1, x[i], y1, v; y[i] = v
    return y
def sweep(f0, f1, d, curve=2): x = t(d) / d; return f0 + (f1 - f0) * (1 - (1 - x) ** curve)
def tone(freqs, d):
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(np.asarray(freqs, float), t(d).shape)) / SR; return np.sin(ph)
def metal(partials, d, decays, amps):
    return sum(a * np.sin(2 * np.pi * f * t(d) + rng.uniform(0, 6)) * np.exp(-t(d) / dc) for f, dc, a in zip(partials, decays, amps))
def mix(d, *parts):
    y = np.zeros(int(SR * d))
    for at, sig in parts:
        i = int(SR * at); n = min(len(sig), len(y) - i); y[i:i + n] += sig[:n]
    return y
def save(name, y, gain_db=-3):
    y = y - np.mean(y); n = int(SR * .004); y[-n:] *= np.linspace(1, 0, n)
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (gain_db / 20)
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'lowpass=f=9000', '-c:a', 'libmp3lame', '-q:a', '4', os.path.join(out, name + '.mp3')], input=pcm, check=True)

# deal: a card slides off the pile (soft paper swish) and taps down
d = .16; swish = biquad(noise(d), 'bp', sweep(4500, 1800, d), 1.2) * env(d, .03, .05)
tap = biquad(noise(.03), 'bp', 1800, 2) * env(.03, .001, .006)
save('deal', mix(.2, (0, swish), (.13, tap * 1.5)))
# flip: a crisp card snap
save('flip', mix(.08, (0, biquad(noise(.05), 'bp', 2600, 1.5) * env(.05, .001, .01)), (.012, biquad(noise(.04), 'bp', 1400, 2) * env(.04, .001, .012) * .6)))
# slash: a blade whooshes through and bites
d = .18; whoosh = biquad(noise(d), 'bp', sweep(700, 5000, d, 1), 2.5) * env(d, .12, .04)
bite = mix(.35, (0, metal([1170, 2730, 4130, 5610], .35, [.09, .07, .05, .04], [.5, .6, .4, .3])), (0, biquad(noise(.04), 'hp', 2500) * env(.04, .001, .01) * 1.2))
save('slash', mix(.5, (0, whoosh * .9), (.15, bite)))
# punch: a dull body blow
d = .25; body = tone(sweep(150, 45, d, 3), d) * env(d, .002, .07)
smack = biquad(noise(.05), 'lp', 1400) * env(.05, .001, .012)
save('punch', np.tanh(2.2 * mix(.28, (0, body), (0, smack * 1.4))))
# hurt: a heavy low thump under the hit
d = .45; boom = tone(sweep(95, 32, d, 2), d) * env(d, .004, .13)
rumble = biquad(noise(d), 'lp', 260) * env(d, .004, .09) * 2.5
save('hurt', np.tanh(1.8 * (boom + rumble)))
# equip: a blade drawn from its sheath, ringing
d = .22; scrape = biquad(noise(d), 'bp', sweep(1500, 7000, d, 1), 4) * env(d, .16, .05)
ring = metal([2210, 3480, 5320, 7050], .7, [.25, .18, .12, .08], [.5, .45, .3, .2]) * (1 + .15 * np.sin(2 * np.pi * 6 * t(.7)))
save('equip', mix(.85, (0, scrape), (.17, ring * .8)))
# potion: a cork pop, then a few gulps
pop = tone(sweep(900, 350, .03), .03) * env(.03, .001, .008)
gulps = [(.12 + .13 * i + rng.uniform(-.01, .01), np.tanh(3 * tone(sweep(220 + 30 * i, 520 + 40 * i, .07, 1), .07) * env(.07, .01, .025)) * .8) for i in range(3)]
save('potion', mix(.55, (0, pop), *gulps))
# coins: a few coins clinking onto a pile
def coin(f): return mix(.25, (0, metal([f, f * 2.76, f * 5.4], .25, [.07, .05, .03], [.6, .5, .3])), (0, biquad(noise(.01), 'hp', 4000) * env(.01, .0005, .002) * .5))
save('coins', mix(.45, *[(.055 * i + rng.uniform(0, .02), coin(rng.uniform(2300, 3300)) * (1 - .12 * i)) for i in range(5)]))
# stamp: a wooden stamp pressed onto paper
thud = tone(sweep(170, 90, .12), .12) * env(.12, .001, .03)
paper = biquad(noise(.09), 'bp', 2200, .8) * env(.09, .001, .03) * .5
save('stamp', np.tanh(1.6 * mix(.2, (0, thud), (0, biquad(noise(.04), 'lp', 900) * env(.04, .001, .01)), (.01, paper))))
# flee: a fast rush of air
d = .4; save('flee', biquad(noise(d), 'bp', sweep(3500, 500, d, 1.5), 1.5) * env(d, .08, .12))
# break: a blade snaps and the pieces clatter
crack = biquad(noise(.03), 'hp', 1500) * env(.03, .0005, .006) * 1.5
shard = lambda f: metal([f, f * 1.73, f * 2.91], .2, [.05, .04, .03], [.5, .4, .3])
save('break', mix(.55, (0, crack), (0, metal([840, 1910, 3120], .3, [.04, .03, .02], [.6, .5, .4])), (.12, shard(2600)), (.2, shard(3400) * .7), (.31, shard(2950) * .5)))
# toll: the dungeon's bell for a strike or a death
d = 2.2; bell = metal([110, 146.8, 222, 297, 402], d, [1.2, .9, .6, .4, .25], [.7, .5, .45, .3, .2])
save('toll', np.tanh(1.3 * mix(d, (0, bell), (0, tone(sweep(70, 40, .5), .5) * env(.5, .003, .15) * .8))))
print('ok')
