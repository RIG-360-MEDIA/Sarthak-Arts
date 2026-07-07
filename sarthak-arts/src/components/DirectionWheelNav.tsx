"use client";
import { useRouter } from "next/navigation";
import { Mandala } from "./Mandala";

type Dir = { code: string; name: string };

export function DirectionWheelNav({ directions, activeCode }: { directions: Dir[]; activeCode?: string }) {
  const router = useRouter();
  return (
    <div
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest("[data-wedge]");
        const code = el?.getAttribute("data-wedge");
        if (code) router.push(`/direction?zone=${code}`);
      }}
      style={{ cursor: "pointer" }}
    >
      <Mandala size={260} directions={directions} litCode={activeCode} dark />
    </div>
  );
}
