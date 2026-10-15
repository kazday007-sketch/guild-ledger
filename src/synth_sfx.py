# Renders every sound in assets/sfx: python3 src/synth_sfx.py assets/sfx (needs numpy and ffmpeg).
# Built from filtered noise and tones with a fixed seed, so a re-run gives the same files. The aim is a quiet stone
# dungeon: dull, low and soft-edged, everything heard through the same small stone-room echo.
import numpy as np, subprocess, sys, os
SR = 44100
rng = np.random.default_rng(7)
out = sys.argv[1]
def t(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.uniform(-1, 1, int(SR * d))
def env(d, a=.005, decay=.1):
    x = t(d); return np.minimum(1, x / max(a, 1e-4)) * np.exp(-np.maximum(0, x - a) / decay)
def biquad(x, kind, f, q=.7):
    # f may be an array (a sweep); coefficients are refreshed every 64 samples
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
    return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(np.asarray(freqs, float), t(d).shape)) / SR)
def bell(partials, d, decays, amps, attack=.004):
    a = np.minimum(1, t(d) / attack)
    return a * sum(g * np.sin(2 * np.pi * f * t(d) + rng.uniform(0, 6)) * np.exp(-t(d) / dc) for f, dc, g in zip(partials, decays, amps))
def mix(d, *parts):
    y = np.zeros(int(SR * d))
    for at, sig in parts:
        i = int(SR * at); n = min(len(sig), len(y) - i); y[i:i + n] += sig[:n]
    return y
# The room: a few early bounces off near walls, then a dark tail about a second long.
ir = biquad(noise(1.4), 'lp', 2200) * np.exp(-t(1.4) / .22)
for ms, g in [(9, .5), (17, .35), (29, .28), (43, .2)]: ir[int(SR * ms / 1000)] += g * 4
ir /= np.sqrt(np.sum(ir ** 2))
def room(y, wet=.3, tail=1.0):
    n = len(y) + int(SR * tail)
    r = np.fft.irfft(np.fft.rfft(y, 2 ** int(np.ceil(np.log2(n + len(ir))))) * np.fft.rfft(ir, 2 ** int(np.ceil(np.log2(n + len(ir))))))[:n]
    dry = np.concatenate([y, np.zeros(n - len(y))])
    return dry * (1 - wet) + r * wet * (np.max(np.abs(y)) / (np.max(np.abs(r)) + 1e-9))
def save(name, y, wet=.3, tail=.8, lp=4200, gain_db=-6):
    y = room(biquad(y, 'lp', lp, .6), wet, tail)
    y = y - np.mean(y); n = int(SR * .02); y[-n:] *= np.linspace(1, 0, n)
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (gain_db / 20)
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '4', os.path.join(out, name + '.mp3')], input=pcm, check=True)
thump = lambda f0, f1, d, dec: tone(sweep(f0, f1, d, 3), d) * env(d, .004, dec)
hush = lambda d, f, q, a, dec: biquad(noise(d), 'bp', f, q) * env(d, a, dec)

# click: a fingertip on stone
save('click', mix(.08, (0, thump(260, 180, .06, .012)), (0, biquad(noise(.03), 'lp', 900) * env(.03, .002, .006) * .5)), wet=.25, tail=.4, lp=2500)
# open / close: a heavy wooden lid lifted, then let down
save('open', mix(.4, (0, hush(.3, sweep(300, 800, .3), 1.2, .08, .08)), (0, thump(110, 85, .2, .05) * .6)), wet=.35, lp=2200)
save('close', mix(.35, (0, hush(.15, sweep(700, 300, .15), 1.2, .02, .04) * .6), (.08, thump(120, 60, .25, .06))), wet=.35, lp=2200)
# deal: old card slid across the table
save('deal', mix(.22, (0, hush(.18, sweep(1400, 700, .18), 1.0, .04, .05)), (.15, biquad(noise(.03), 'lp', 700) * env(.03, .002, .008) * .7)), wet=.22, tail=.4, lp=3000)
# flip: a card laid face up
save('flip', mix(.08, (0, hush(.06, 1100, 1.2, .004, .015))), wet=.2, tail=.3, lp=2800)
# slash: a blade swung through the air and biting home
whoosh = hush(.2, sweep(350, 1600, .2, 1), 1.6, .13, .04)
bite = mix(.3, (0, bell([430, 980, 1610], .3, [.06, .04, .03], [.6, .35, .2])), (0, biquad(noise(.05), 'lp', 1500) * env(.05, .002, .015)))
save('slash', mix(.55, (0, whoosh * .8), (.16, bite)), wet=.3)
# punch: a dull blow to the body
save('punch', np.tanh(1.4 * mix(.3, (0, thump(120, 45, .25, .07)), (0, biquad(noise(.05), 'lp', 600) * env(.05, .002, .014) * 1.2))), wet=.28, lp=2000)
# hurt: the hit you take, felt more than heard
save('hurt', np.tanh(1.3 * (thump(80, 30, .5, .14) + biquad(noise(.5), 'lp', 180) * env(.5, .006, .1) * 2 + hush(.5, 420, 1.2, .004, .05) * 1.2)), wet=.25, lp=1400) # the 420 Hz knock keeps it audible on phone speakers
# equip: a blade taken up from the floor, a short muted ring
scrape = hush(.2, sweep(700, 1800, .2, 1), 3, .12, .05) * .5
ring = bell([880, 1320, 1990], .6, [.18, .12, .08], [.5, .35, .2], .006)
save('equip', mix(.75, (0, scrape), (.15, ring), (.15, thump(160, 120, .08, .02) * .5)), wet=.35)
# potion: a cork drawn, then slow swallows
gulps = [(.14 + .16 * i, np.tanh(2 * tone(sweep(150 + 20 * i, 320 + 25 * i, .08, 1), .08) * env(.08, .012, .03)) * .7) for i in range(3)]
save('potion', mix(.65, (0, tone(sweep(520, 260, .04), .04) * env(.04, .002, .012) * .8), *gulps), wet=.25, lp=2400)
# coins: a few coins dropped into a purse
def coin(f): return mix(.2, (0, bell([f, f * 2.4], .2, [.05, .03], [.5, .25], .002)), (0, biquad(noise(.015), 'bp', 2500, 1) * env(.015, .001, .004) * .3))
save('coins', mix(.4, *[(.07 * i + rng.uniform(0, .02), coin(rng.uniform(1300, 1900)) * (1 - .15 * i)) for i in range(4)], (0, hush(.3, 1200, .8, .02, .08) * .25)), wet=.3, lp=3200)
# stamp: wax and a heavy seal pressed down
save('stamp', np.tanh(1.3 * mix(.2, (0, thump(140, 80, .14, .035)), (0, biquad(noise(.05), 'lp', 700) * env(.05, .002, .012)), (.01, hush(.08, 1500, .8, .002, .025) * .3))), wet=.3, lp=2200)
# flee: a rush of air down a corridor
save('flee', hush(.5, sweep(1400, 300, .5, 1.5), 1.2, .12, .15), wet=.4, tail=1.0, lp=2500)
# break: a blade snapping, the pieces falling on stone
shard = lambda f: bell([f, f * 1.7], .15, [.03, .02], [.4, .25], .002)
save('break', mix(.6, (0, biquad(noise(.04), 'lp', 1800) * env(.04, .001, .01)), (0, bell([520, 1180, 1900], .25, [.05, .035, .025], [.6, .4, .25])), (.13, shard(1500)), (.22, shard(1900) * .7), (.33, shard(1700) * .5)), wet=.35)
# toll: a far bell somewhere deep below, for a strike or a death
save('toll', np.tanh(1.2 * mix(2.6, (0, bell([98, 131, 196, 247, 330], 2.6, [1.4, 1.0, .7, .5, .3], [.7, .45, .4, .25, .15], .01)), (0, thump(60, 40, .6, .2) * .6))), wet=.5, tail=1.4, lp=1600)
# relic: something old waking up, a low hum and a soft chime
hum = tone(110, 1.4) * np.minimum(1, t(1.4) / .3) * np.exp(-t(1.4) / .5) * .5
save('relic', mix(1.6, (0, hum), (.1, bell([392, 588, 784], 1.3, [.6, .45, .3], [.5, .3, .15], .03))), wet=.5, tail=1.2, lp=2400)
# met: two low bells, the guild's quiet approval
save('met', mix(1.6, (0, bell([196, 392, 588], 1.2, [.6, .4, .25], [.6, .3, .15], .008)), (.28, bell([294, 588, 882], 1.3, [.6, .4, .25], [.6, .3, .15], .008))), wet=.45, tail=1.2, lp=2200)
# win: three bells climbing out of the dark over a low drone
drone = tone(73.4, 2.4) * np.minimum(1, t(2.4) / .4) * np.exp(-t(2.4) / 1.0) * .4
save('win', mix(2.6, (0, drone), *[(.35 * i, bell([f, f * 2, f * 3], 1.8, [.9, .5, .3], [.6, .3, .12], .01)) for i, f in enumerate([147, 196, 294])]), wet=.5, tail=1.5, lp=2600)
print('ok')
