"""Synthesises the two royalty-free music beds used by the demo videos (no samples, no downloads).

    python3 music.py <outdir>

  bright.wav  112 BPM, I–V–vi–IV with FM e-piano, plucked arpeggios, soft drums  (trailer, short)
  calm.wav     88 BPM, maj7 chords with e-piano, plucks and a pad, no drums      (explainer)
  calm_long.wav  the same, ~10 minutes                                          (walkthrough)
"""
import sys, wave, pathlib
import numpy as np

SR = 44100
rng = np.random.default_rng(7)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a, d, s, r, total):
    """ADSR in samples over `total` samples (r inside total)."""
    e = np.full(total, s, dtype=np.float64)
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    a = max(a, 1)
    e[:a] = np.linspace(0, 1, a)
    if d: e[a:a + d] = np.linspace(1, s, min(d, max(0, total - a)))
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e

def epiano(f, dur, vel=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    idx = 1.8 * np.exp(-t * 3.2) + 0.25
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = 0.18 * np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t * 18)
    amp = np.exp(-t * (1.1 + f / 900)) * (1 - np.exp(-t * 400))
    rel = np.ones(n); r = min(n, int(0.08 * SR)); rel[-r:] = np.linspace(1, 0, r)
    return vel * (car + tine) * amp * rel

def pluck(f, dur, vel=0.4, bright=0.5):
    """Karplus–Strong, one delay-line period per numpy step."""
    n = int(dur * SR); N = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, N)
    buf = np.convolve(buf, [bright, 1 - bright], mode='same')
    out = np.zeros(n + N + 1)
    out[1:N + 1] = buf
    decay = 0.996
    for i in range(N + 1, n + N + 1, N):
        m = min(N, n + N + 1 - i)
        out[i:i + m] = decay * 0.5 * (out[i - N:i - N + m] + out[i - N - 1:i - N - 1 + m])
    y = out[N + 1:N + 1 + n]
    r = min(n, int(0.05 * SR)); y[-r:] *= np.linspace(1, 0, r)
    return vel * y

def pad(freqs, dur, vel=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for f in freqs:
        for det in (-0.06, 0.0, 0.07):
            ph = rng.uniform(0, 2 * np.pi)
            ff = f * 2 ** (det / 12)
            # soft saw: a few harmonics, falling off fast
            for h in range(1, 6):
                y += np.sin(2 * np.pi * ff * h * t + ph * h) / (h ** 1.6)
    y /= len(freqs) * 3 * 2.2
    return vel * y * env(n, 0.9, 0, 1.0, 1.2, n)

def kick(vel=0.8):
    n = int(0.32 * SR); t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return vel * np.sin(ph) * np.exp(-t * 11)

def hat(vel=0.08, open_=False):
    n = int((0.18 if open_ else 0.05) * SR); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = x - np.concatenate([[0], x[:-1]])      # crude high-pass
    return vel * x * np.exp(-t * (18 if open_ else 70))

def snare(vel=0.25):
    n = int(0.22 * SR); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n); x = x - 0.6 * np.concatenate([[0], x[:-1]])
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return vel * (0.7 * x * np.exp(-t * 20) + 0.5 * tone)

def lowpass(x, cutoff):
    """Smooth 24 dB/oct-ish low-pass, done in the frequency domain."""
    nfft = 1 << (len(x) - 1).bit_length()
    X = np.fft.rfft(x, nfft)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, nfft)[:len(x)]

def highpass(x, cutoff):
    nfft = 1 << (len(x) - 1).bit_length()
    X = np.fft.rfft(x, nfft)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    X *= (f / cutoff) ** 4 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, nfft)[:len(x)]

def reverb(x, secs=2.2, mix=0.22):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t * 3.0 / secs * 2.3)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    L = len(x) + n
    nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]
    return (1 - mix) * x + mix * wet * 0.9

def place(track, sig, at):
    i = int(at * SR)
    if i >= len(track): return
    m = min(len(sig), len(track) - i)
    track[i:i + m] += sig[:m]

def write(path, L, R):
    st = np.stack([L, R], axis=1)
    peak = np.abs(st).max()
    st = st / peak * 0.80
    pcm = (st * 32767).astype(np.int16)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def song(bpm, bars, chords, style):
    beat = 60 / bpm
    dur = bars * 4 * beat + 3
    n = int(dur * SR)
    keys, pl, bass, padt, drums = (np.zeros(n) for _ in range(5))
    for b in range(bars):
        t0 = b * 4 * beat
        root, tones = chords[b % len(chords)]
        # e-piano: chord stabs
        if style == 'bright':
            for k, (pos, ln) in enumerate([(0, 1.4), (1.5, 0.9), (2.5, 1.3)]):
                for nn in tones:
                    place(keys, epiano(midi(nn), ln * beat + 0.3, 0.16), t0 + pos * beat)
        else:
            for nn in tones:
                place(keys, epiano(midi(nn), 3.6 * beat, 0.15), t0 + rng.uniform(0, 0.02))
            for nn in tones[1:]:
                place(keys, epiano(midi(nn), 1.6 * beat, 0.08), t0 + 2.5 * beat + rng.uniform(0, 0.02))
        # plucked arpeggio, 8ths (bright) or 8ths with gaps (calm)
        arp = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[-1] + 12]
        pattern = [0, 1, 2, 3, 2, 1, 2, 3] if style == 'bright' else [0, 2, 1, 3, None, 2, 1, None]
        for k, pi in enumerate(pattern):
            if pi is None: continue
            if b < 2 and style == 'calm': continue          # let the calm one breathe in
            v = 0.22 if k % 2 == 0 else 0.15
            place(pl, pluck(midi(arp[pi]), 1.2 * beat, v, 0.45), t0 + k * 0.5 * beat)
        # bass
        if style == 'bright':
            for k in range(8):
                f = midi(root - 12 if k % 4 else root - 12)
                place(bass, 0.2 * np.sin(2 * np.pi * f * np.arange(int(0.45 * beat * SR)) / SR) * env(1, 0.005, 0.1, 0.7, 0.06, int(0.45 * beat * SR)), t0 + k * 0.5 * beat)
        else:
            ln = int(3.8 * beat * SR)
            place(bass, 0.17 * np.sin(2 * np.pi * midi(root - 12) * np.arange(ln) / SR) * env(1, 0.08, 0.4, 0.75, 0.5, ln), t0)
        # pad
        place(padt, pad([midi(x) for x in tones], 4 * beat + 1.0, 0.16 if style == 'calm' else 0.10), t0)
        # drums
        if style == 'bright' and b >= 1:
            for k in range(4):
                place(drums, kick(0.36), t0 + k * beat)
                if k in (1, 3): place(drums, snare(0.13), t0 + k * beat)
            for k in range(8):
                place(drums, hat(0.05 if k % 2 else 0.035, open_=(k == 7)), t0 + k * 0.5 * beat)
    # side-chain-ish pump on the bright one
    if style == 'bright':
        t = np.arange(n) / SR
        ph = (t % beat) / beat
        pump = 0.62 + 0.38 * np.minimum(1, ph * 4)
        keys *= pump; padt *= pump; pl *= 0.9 + 0.1 * pump
    keys = lowpass(keys, 5200)
    padt = lowpass(padt, 2400)
    pl = lowpass(pl, 6500)
    # stereo: plucks wander, keys slightly wide
    t = np.arange(n) / SR
    pan = 0.5 + 0.28 * np.sin(2 * np.pi * t / (8 * beat))
    L = 0.95 * keys + pl * (1 - pan) * 1.2 + bass + padt * 0.9 + drums
    R = 0.95 * keys + pl * pan * 1.2 + bass + padt * 1.1 + drums
    L, R = reverb(L, 2.4 if style == 'calm' else 1.6, 0.26), reverb(R, 2.5 if style == 'calm' else 1.7, 0.26)
    return highpass(L, 45), highpass(R, 45)

if __name__ == '__main__':
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    out.mkdir(parents=True, exist_ok=True)
    # D major: D–A–Bm–G
    bright = [(62, [62, 66, 69, 74]), (57, [57, 61, 64, 69]), (59, [59, 62, 66, 71]), (55, [55, 59, 62, 67])]
    L, R = song(112, 36, bright, 'bright')
    write(out / 'bright.wav', L, R)
    # F major 7ths: Fmaj7–Am7–Dm7–Bbmaj7 … Gm7–C
    calm = [(53, [53, 57, 60, 64]), (57, [57, 60, 64, 67]), (50, [50, 53, 57, 60]), (58, [58, 62, 65, 69]),
            (53, [53, 57, 60, 64]), (57, [57, 60, 64, 67]), (55, [55, 58, 62, 65]), (60, [60, 64, 67, 70])]
    L, R = song(88, 96, calm, 'calm')
    write(out / 'calm.wav', L, R)
    L, R = song(88, 216, calm, 'calm')          # long enough for the full walkthrough without a loop
    write(out / 'calm_long.wav', L, R)
    print('ok')
