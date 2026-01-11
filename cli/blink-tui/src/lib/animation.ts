// ABOUTME: Animation calculations for TUI effects
// ABOUTME: Pure functions for cycling, wave, shimmer, and breathing effects

export function calculateCyclePosition(elapsed: number, cycleDuration: number): number {
  return (elapsed % cycleDuration) / cycleDuration;
}

export function calculateWavePosition(elapsed: number, waveDuration: number): number {
  return (elapsed % waveDuration) / waveDuration;
}

export function calculateBreathPhase(elapsed: number, breathDuration: number): number {
  const position = (elapsed % breathDuration) / breathDuration;
  // Sine wave oscillating between 0.7 and 1.0
  return 0.85 + 0.15 * Math.sin(position * Math.PI * 2);
}

export function shouldShimmer(charIndex: number, elapsed: number, probability: number = 0.02): boolean {
  // Deterministic "randomness" based on position and time
  const seed = (charIndex * 127 + Math.floor(elapsed / 250)) % 100;
  return seed < probability * 100;
}

export function interpolateColor(colors: string[], position: number): string {
  if (colors.length === 0) return '#ffffff';
  if (colors.length === 1) return colors[0];

  const scaledPos = position * (colors.length - 1);
  const index = Math.floor(scaledPos);
  const fraction = scaledPos - index;

  if (index >= colors.length - 1) return colors[colors.length - 1];

  const color1 = hexToRgb(colors[index]);
  const color2 = hexToRgb(colors[index + 1]);

  const r = Math.round(color1.r + (color2.r - color1.r) * fraction);
  const g = Math.round(color1.g + (color2.g - color1.g) * fraction);
  const b = Math.round(color1.b + (color2.b - color1.b) * fraction);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function brightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  return rgbToHex(newR, newG, newB);
}

export function adjustBrightness(hex: string, multiplier: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.round(r * multiplier),
    Math.round(g * multiplier),
    Math.round(b * multiplier)
  );
}

export interface AnimationState {
  cyclePosition: number;
  wavePosition: number;
  breathPhase: number;
  elapsed: number;
}

export function calculateAnimationState(
  elapsed: number,
  cycleDuration: number = 4000,
  waveDuration: number = 2000,
  breathDuration: number = 4000
): AnimationState {
  return {
    cyclePosition: calculateCyclePosition(elapsed, cycleDuration),
    wavePosition: calculateWavePosition(elapsed, waveDuration),
    breathPhase: calculateBreathPhase(elapsed, breathDuration),
    elapsed,
  };
}
