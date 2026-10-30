#!/usr/bin/env python3
"""Original paper/envelope SFX for the daily letter opening ceremony."""

from __future__ import annotations

import math
import os
import random
import struct
import wave

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def write_wav(name: str, samples: list[float], peak: float = 0.52) -> None:
    fade = min(len(samples), int(SR * 0.01))
    for index in range(fade):
        samples[-1 - index] *= index / fade
        samples[index] *= index / max(fade, 1)

    loudest = max((abs(sample) for sample in samples), default=1e-9)
    gain = peak / loudest
    path = os.path.join(OUT_DIR, name)
    os.makedirs(OUT_DIR, exist_ok=True)
    with wave.open(path, "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        frames = b"".join(
            struct.pack("<h", int(clamp(sample * gain) * 32767)) for sample in samples
        )
        wav.writeframes(frames)


def lowpass(samples: list[float], cutoff_hz: float) -> list[float]:
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    alpha = (1.0 / SR) / (rc + 1.0 / SR)
    out: list[float] = []
    previous = 0.0
    for sample in samples:
        previous += alpha * (sample - previous)
        out.append(previous)
    return out


def highpass(samples: list[float], cutoff_hz: float) -> list[float]:
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    alpha = rc / (rc + 1.0 / SR)
    out: list[float] = []
    previous_x = 0.0
    previous_y = 0.0
    for sample in samples:
        y = alpha * (previous_y + sample - previous_x)
        out.append(y)
        previous_x = sample
        previous_y = y
    return out


def pink(n: int, rng: random.Random) -> list[float]:
    octaves = 6
    values = [0.0] * octaves
    out = [0.0] * n
    for index in range(n):
        total = 0.0
        for octave in range(octaves):
            if index % (1 << octave) == 0:
                values[octave] = rng.uniform(-1.0, 1.0)
            total += values[octave]
        out[index] = total / octaves
    return out


def hann(index: int, length: int) -> float:
    if length <= 1:
        return 1.0
    return 0.5 - 0.5 * math.cos(2 * math.pi * index / (length - 1))


def mix_at(dest: list[float], src: list[float], offset: int, gain: float = 1.0) -> None:
    for index, sample in enumerate(src):
        position = offset + index
        if 0 <= position < len(dest):
            dest[position] += sample * gain


def decaying_sine(freq: float, duration: float, decay: float, phase: float = 0.0) -> list[float]:
    n = int(duration * SR)
    out = [0.0] * n
    for index in range(n):
        t = index / SR
        out[index] = math.sin(2 * math.pi * freq * t + phase) * math.exp(-t * decay)
    return out


def crinkle(duration: float, rng: random.Random, density: float = 48) -> list[float]:
    n = int(duration * SR)
    mix = [0.0] * n
    grains = max(4, int(duration * density))
    for _ in range(grains):
        grain_len = int(SR * rng.uniform(0.006, 0.038))
        start = rng.randint(0, max(1, n - grain_len))
        brightness = rng.uniform(0.45, 1.0)
        for index in range(grain_len):
            window = hann(index, grain_len)
            mix[start + index] += rng.uniform(-1.0, 1.0) * window * brightness
    return highpass(lowpass(mix, 6200), 700)


def whoosh(duration: float, rng: random.Random) -> list[float]:
    n = int(duration * SR)
    noise = pink(n, rng)
    shaped = [0.0] * n
    for index, sample in enumerate(noise):
        t = index / max(n - 1, 1)
        hill = math.sin(math.pi * t) ** 1.35
        shaped[index] = sample * hill
    return lowpass(highpass(shaped, 180), 2400)


def make_pickup() -> list[float]:
    rng = random.Random(11)
    duration = 0.32
    n = int(duration * SR)
    out = [0.0] * n
    mix_at(out, crinkle(0.18, rng, 56), int(0.02 * SR), 0.9)
    mix_at(out, crinkle(0.16, rng, 40), int(0.12 * SR), 0.55)
    mix_at(out, whoosh(0.22, rng), int(0.04 * SR), 0.22)
    return out


def make_seal() -> list[float]:
    rng = random.Random(23)
    duration = 0.4
    n = int(duration * SR)
    out = [0.0] * n
    click_len = int(0.004 * SR)
    click = [rng.uniform(-1.0, 1.0) * hann(index, click_len) for index in range(click_len)]
    mix_at(out, click, int(0.018 * SR), 1.15)
    mix_at(out, decaying_sine(190, 0.16, 28), int(0.016 * SR), 0.55)
    mix_at(out, decaying_sine(430, 0.12, 36, 0.4), int(0.02 * SR), 0.28)
    mix_at(out, decaying_sine(980, 0.07, 48), int(0.022 * SR), 0.18)
    burst = highpass(pink(int(0.09 * SR), rng), 1200)
    burst = [sample * hann(index, len(burst)) for index, sample in enumerate(burst)]
    mix_at(out, burst, int(0.02 * SR), 0.7)
    mix_at(out, crinkle(0.2, rng, 70), int(0.03 * SR), 0.45)
    return out


def make_open() -> list[float]:
    rng = random.Random(47)
    duration = 0.98
    n = int(duration * SR)
    out = [0.0] * n
    mix_at(out, crinkle(0.22, rng, 62), int(0.02 * SR), 0.7)
    mix_at(out, whoosh(0.42, rng), int(0.08 * SR), 0.85)
    mix_at(out, crinkle(0.28, rng, 50), int(0.18 * SR), 0.8)
    mix_at(out, decaying_sine(140, 0.18, 18), int(0.16 * SR), 0.18)
    mix_at(out, crinkle(0.36, rng, 38), int(0.42 * SR), 0.55)
    slap = highpass(pink(int(0.05 * SR), rng), 900)
    slap = [sample * hann(index, len(slap)) for index, sample in enumerate(slap)]
    mix_at(out, slap, int(0.38 * SR), 0.4)
    mix_at(out, whoosh(0.3, rng), int(0.5 * SR), 0.28)
    return out


def make_paper() -> list[float]:
    rng = random.Random(79)
    duration = 0.66
    n = int(duration * SR)
    out = [0.0] * n
    rustle = crinkle(duration, rng, 64)
    for index, sample in enumerate(rustle):
        t = index / max(n - 1, 1)
        amp = (0.35 + 0.65 * math.sin(math.pi * t)) * (0.75 + 0.25 * math.sin(2 * math.pi * 11 * t))
        out[index] += sample * amp
    mix_at(out, whoosh(0.4, rng), int(0.08 * SR), 0.22)
    return out


def main() -> None:
    write_wav("letter-pickup.wav", make_pickup(), peak=0.38)
    write_wav("letter-seal.wav", make_seal(), peak=0.58)
    write_wav("letter-open.wav", make_open(), peak=0.5)
    write_wav("letter-paper.wav", make_paper(), peak=0.42)


if __name__ == "__main__":
    main()
