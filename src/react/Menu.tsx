import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent
} from "react";

export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
}

export function Menu({ label, items }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const links = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    if (open) links.current[0]?.focus();
  }, [open]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const current = links.current.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      links.current[(current + 1 + items.length) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      links.current[(current - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      links.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      links.current[items.length - 1]?.focus();
    }
  }

  return (
    <div data-slf-island="menu">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
      </button>
      <ul
        id={`${id}-menu`}
        role="menu"
        hidden={!open}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item, index) => (
          <li key={item.id} role="none">
            <a
              ref={(node) => {
                links.current[index] = node;
              }}
              role="menuitem"
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
