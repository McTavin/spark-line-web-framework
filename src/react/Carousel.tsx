import { useId, useState } from "react";

export interface CarouselItem {
  id: string;
  label: string;
  description?: string;
}

export interface CarouselProps {
  label: string;
  items: readonly CarouselItem[];
  previousLabel?: string;
  nextLabel?: string;
}

export function Carousel({
  label,
  items,
  previousLabel = "Previous",
  nextLabel = "Next"
}: CarouselProps) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const active = items[index];

  if (!active) return null;

  const move = (offset: number) => {
    setIndex((current) => (current + offset + items.length) % items.length);
  };

  return (
    <section
      data-slf-island="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div id={`${id}-slide`} aria-live="polite" aria-atomic="true">
        <p>
          <span className="slf-visually-hidden">
            Item {index + 1} of {items.length}:{" "}
          </span>
          {active.label}
        </p>
        {active.description ? <p>{active.description}</p> : null}
      </div>
      <div>
        <button type="button" onClick={() => move(-1)} aria-controls={`${id}-slide`}>
          {previousLabel}
        </button>
        <button type="button" onClick={() => move(1)} aria-controls={`${id}-slide`}>
          {nextLabel}
        </button>
      </div>
    </section>
  );
}
