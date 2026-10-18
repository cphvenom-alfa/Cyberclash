// File: src/app/_components/galaxy-background.tsx
import { CityBackdrop } from "./city-art";
import { CursorLight } from "./cursor-light";
import { Starfield } from "./starfield";

/** Everything that lives behind the page: nebula + stars (canvas), distant skyline, cursor light. Mounted once in the root layout. */
export function GalaxyBackground() {
  return (
    <>
      <CityBackdrop />
      <Starfield />
      <CursorLight />
    </>
  );
}
