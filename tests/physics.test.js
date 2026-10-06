// Plays the scenes headlessly (update() only, no drawing) and checks the numbers the lessons rely on.
import { describe, it, expect } from 'vitest';
import { G } from '../src/config.js';
import { Level1 } from '../src/scenes/level1.js';
import { Projectile } from '../src/scenes/projectile.js';

// Step a scene the way the main loop does (60 fps, scaled by the scene's timeScale).
function runUntil(S, done, maxSeconds = 120){
  for (let t = 0; t < maxSeconds && !done(S); t += 1/60) S.update((1/60)*(S.timeScale || 1));
  return S;
}
const push = (p) => { const L = Level1(); L.start(p); return runUntil(L, L => ['stopped', 'idle'].includes(L.phase) || L.flags.gone); };

describe('Level 1 on ice (μ = 0)', () => {
  it('never stops once the push ends', () => {
    const L = push({ F:100, m:40, mu:0 });
    expect(L.flags.gone).toBe(1);
    expect(L.phase).toBe('coast');
  });

  it('releases the cart at v = √(2·(F/m)·0.8)', () => {
    const L = push({ F:100, m:40, mu:0 });
    expect(L.v1).toBeCloseTo(Math.sqrt(2*(100/40)*0.8), 10);
  });
});

describe('Level 1 with friction (μ = 0.10, m = 40 kg)', () => {
  it('f = μmg = 39.24 N', () => {
    const L = Level1(); L.mu = 0.1; L.m = 40;
    expect(L.f()).toBeCloseTo(39.24, 2);
  });

  it('parks in the green spot with F = 196 N', () => {
    expect(push({ F:196, m:40, mu:0.1 }).stop.ok).toBe(true);
  });

  it('accepts roughly 184–208 N, as NOTES.md says', () => {
    expect(push({ F:184, m:40, mu:0.1 }).stop.ok).toBe(true);
    expect(push({ F:208, m:40, mu:0.1 }).stop.ok).toBe(true);
    expect(push({ F:180, m:40, mu:0.1 }).stop.ok).toBe(false);
    expect(push({ F:212, m:40, mu:0.1 }).stop.ok).toBe(false);
  });

  it('does not move when F ≤ f (static friction holds it)', () => {
    expect(push({ F:39, m:40, mu:0.1 }).phase).toBe('idle');
  });
});

describe('Sandbox: the right push is 5 × f for any m and μ', () => {
  for (const m of [20, 40, 60, 80]){
    for (const mu of [0.05, 0.15, 0.25]){
      it(`m = ${m} kg, μ = ${mu}`, () => {
        const F = Math.round(5*mu*m*G);
        const L = push({ F, m, mu });
        expect(L.stop.ok).toBe(true);
        expect(Math.abs(L.stop.err)).toBeLessThan(0.05);
      });
    }
  }
});

describe('Bonus: projectile off the platform', () => {
  const launch = (v) => { const S = Projectile(); S.start(v); return runUntil(S, S => S.phase === 'landed'); };

  it('flight time is √(2h/g) ≈ 0.62 s whatever the speed', () => {
    expect(Projectile().tFlight()).toBeCloseTo(Math.sqrt(2*1.9/G), 10);
    expect(Projectile().tFlight()).toBeCloseTo(0.62, 2);
  });

  it('lands on the cushion at 4.8 m/s', () => {
    expect(launch(4.8).land.ok).toBe(true);
  });

  it('lands x = v·t from the edge', () => {
    const S = launch(4.0);
    expect(S.land.x - S.edge).toBeCloseTo(4.0*S.tFlight(), 10);
    expect(S.land.ok).toBe(false);
  });

  it('accepts 4.42–5.22 m/s (D ± 0.25 m over 0.62 s), i.e. 4.5–5.2 on the slider', () => {
    expect(launch(4.5).land.ok).toBe(true);
    expect(launch(5.2).land.ok).toBe(true);
    expect(launch(4.4).land.ok).toBe(false);
    expect(launch(5.3).land.ok).toBe(false);
  });
});
