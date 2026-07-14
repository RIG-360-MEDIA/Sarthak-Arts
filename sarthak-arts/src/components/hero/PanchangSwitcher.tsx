"use client";
import { useRef, useState, useTransition } from "react";
import { CITIES, type City, isSolarNativeRegion, nativeCalendarLabel } from "@/lib/panchang/cities";
import type { MasaSystem } from "@/lib/panchang/names";
import { savePanchangPreferences } from "@/lib/panchang/preferences";

type Props = {
  currentCityCode: string;
  currentMasaSystem: MasaSystem;
};

/**
 * Small dialog that lets the visitor pick their city + lunar-month reckoning.
 * Opens from the citation line under the panchang strip. Persists to cookies
 * via a server action that revalidates the home page.
 */
export function PanchangSwitcher({ currentCityCode, currentMasaSystem }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [city, setCity] = useState<string>(currentCityCode);
  const [masa, setMasa] = useState<MasaSystem>(currentMasaSystem);
  const [pending, startTransition] = useTransition();

  const cityObj: City | undefined = CITIES.find((c) => c.code === city);
  const suggestedMasa = cityObj?.defaultMasaSystem;

  const open = () => {
    setCity(currentCityCode);
    setMasa(currentMasaSystem);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("city", city);
    fd.set("masaSystem", masa);
    startTransition(async () => {
      await savePanchangPreferences(fd);
      close();
    });
  };

  return (
    <>
      <button type="button" className="sa-panchang-change" onClick={open}>
        Change
      </button>

      <dialog ref={dialogRef} className="sa-panchang-dialog" onClick={(e) => {
        // click on backdrop closes
        if (e.target === dialogRef.current) close();
      }}>
        <form className="sa-panchang-dialog-inner" onSubmit={submit}>
          <h3>Change your panchang</h3>

          <label className="sa-panchang-field">
            <span className="lbl">City</span>
            <select value={city} onChange={(e) => {
              const next = e.target.value;
              setCity(next);
              // Auto-align the reckoning to the region's default when the
              // city changes — visitor can still override before saving.
              const c = CITIES.find((x) => x.code === next);
              if (c) setMasa(c.defaultMasaSystem);
            }}>
              {CITIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} · {c.state}</option>
              ))}
            </select>
          </label>

          <fieldset className="sa-panchang-field sa-panchang-radios">
            <legend className="lbl">Lunar month type</legend>
            <label>
              <input type="radio" name="masaSystem" value="purnimanta"
                checked={masa === "purnimanta"} onChange={() => setMasa("purnimanta")} />
              Pūrṇimānta<small>North Indian</small>
            </label>
            <label>
              <input type="radio" name="masaSystem" value="amanta"
                checked={masa === "amanta"} onChange={() => setMasa("amanta")} />
              Amānta<small>Deccan / West / South</small>
            </label>
            {suggestedMasa && suggestedMasa !== masa && (
              <div className="sa-panchang-suggest">
                Suggested for {cityObj?.name}: {suggestedMasa === "purnimanta" ? "Pūrṇimānta" : "Amānta"}
              </div>
            )}
          </fieldset>

          {cityObj && isSolarNativeRegion(cityObj) && (
            <div className="sa-panchang-note">
              {cityObj.state}'s primary calendar is <b>{nativeCalendarLabel(cityObj.nativeCalendar)}</b>.
              A dedicated solar panchang is on our roadmap; for now we show the
              universally-valid lunar panchang.
            </div>
          )}

          <div className="sa-panchang-dialog-actions">
            <button type="button" className="ghost" onClick={close} disabled={pending}>Cancel</button>
            <button type="submit" className="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
