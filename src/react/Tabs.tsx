import { useId, useRef, useState, type KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: string;
}

export interface TabsProps {
  label: string;
  items: readonly TabItem[];
  initialId?: string;
}

export function Tabs({ label, items, initialId }: TabsProps) {
  const generatedId = useId();
  const initialIndex = Math.max(
    0,
    initialId ? items.findIndex((item) => item.id === initialId) : 0
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const active = items[activeIndex];

  if (!active) return null;

  function select(index: number) {
    const next = (index + items.length) % items.length;
    setActiveIndex(next);
    buttons.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(items.length - 1);
    }
  }

  return (
    <div data-slf-island="tabs">
      <div role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const tabId = `${generatedId}-tab-${item.id}`;
          const panelId = `${generatedId}-panel-${item.id}`;
          const selected = activeIndex === index;
          return (
            <button
              key={item.id}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`${generatedId}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${generatedId}-tab-${item.id}`}
          hidden={activeIndex !== index}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
