/** Vāstu directions for a product: "All directions" (default) or any number of specific ones. */
export function DirectionPicker({ directions, selected }: {
  directions: { id: number; name: string }[];
  selected: number[];
}) {
  const all = selected.length === 0;
  return (
    <div className="adm-field dir-picker">
      <label>Vāstu direction</label>
      <div className="hint">Choose &ldquo;All directions&rdquo; for a piece that suits any corner, or tick every direction it is made for.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginTop: 6 }}>
        <input type="hidden" name="directionIds" value="" />
        <label className="dir-chip dir-all"><input type="checkbox" name="directionIds" value="all" defaultChecked={all} /> All directions</label>
        {directions.map((d) => (
          <label key={d.id} className="dir-chip"><input type="checkbox" name="directionIds" value={d.id} defaultChecked={selected.includes(d.id)} /> {d.name}</label>
        ))}
      </div>
      <style>{`
        .dir-chip { display: flex; align-items: center; gap: 8px; font-size: 13.5px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; cursor: pointer; }
        .dir-chip:has(input:checked) { border-color: var(--brass, #B47D0C); background: color-mix(in srgb, var(--brass, #B47D0C) 8%, #fff); }
        .dir-picker:has(.dir-all input:checked) .dir-chip:not(.dir-all) { opacity: .45; }
      `}</style>
    </div>
  );
}

/** Read the picker from a submitted form: [] means "All directions". */
export function pickedDirectionIds(formData: FormData): number[] {
  const raw = formData.getAll("directionIds").map(String);
  if (raw.includes("all")) return [];
  return [...new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}
