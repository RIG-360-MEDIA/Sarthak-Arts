type Dir = { code: string; name: string };

export function Mandala({ size, directions, litCode, dark = false }: {
  size: number; directions: Dir[]; litCode?: string; dark?: boolean;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.46;
  const n = Math.max(directions.length, 1);
  const step = 360 / n;
  const wedges = directions.map((d, i) => {
    const a0 = ((-90 + i * step) * Math.PI) / 180;
    const a1 = ((-90 + (i + 1) * step) * Math.PI) / 180;
    const lit = d.code === litCode;
    return (
      <path key={d.code} data-wedge={d.code}
        d={`M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0,1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`}
        fill={lit ? "#7A2E2E" : dark ? "#3A3632" : "#EBE0CE"}
        opacity={lit ? 0.75 : 0.6}
        stroke={dark ? "#4A443C" : "#D9CBAE"} strokeWidth={0.5}>
        <title>{d.name}</title>
      </path>
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Direction wheel">
      <circle cx={cx} cy={cy} r={r + size * 0.03} fill="none" stroke="#B8863E" strokeWidth={0.75} />
      {wedges}
      <circle cx={cx} cy={cy} r={size * 0.045} fill={dark ? "#F3EAD9" : "#2B211A"} />
    </svg>
  );
}
