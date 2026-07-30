export interface EnergyPaths {
  line: string;
  area: string;
}

/**
 * Quadratic-Bezier midpoint smoothing between consecutive data points: start at the first
 * point, `Q` control-through each raw point to the midpoint of the next segment, close with
 * a final `L` to the last point. The area path is the same line closed down to the baseline.
 */
export function buildEnergyPaths(values: number[], opts?: { width?: number; height?: number; pad?: number; min?: number; max?: number }): EnergyPaths {
  const w = opts?.width ?? 280;
  const h = opts?.height ?? 90;
  const pad = opts?.pad ?? 6;
  const min = opts?.min ?? 0;
  const max = opts?.max ?? 100;

  if (values.length === 0) return { line: '', area: '' };
  if (values.length === 1) {
    const y = h - pad - ((values[0] - min) / (max - min)) * (h - pad * 2);
    return { line: `M${pad},${y} L${w - pad},${y}`, area: `M${pad},${y} L${w - pad},${y} L${w - pad},${h} L${pad},${h} Z` };
  }

  const pts = values.map((v, i) => ({
    x: pad + (i * (w - pad * 2)) / (values.length - 1),
    y: h - pad - ((v - min) / (max - min)) * (h - pad * 2),
  }));

  let line = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i - 1].x + pts[i].x) / 2;
    const midY = (pts[i - 1].y + pts[i].y) / 2;
    line += ` Q${pts[i - 1].x},${pts[i - 1].y} ${midX},${midY}`;
  }
  line += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;

  const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
  return { line, area };
}
