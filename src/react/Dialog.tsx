import { useEffect, useId, useRef, useState } from "react";

export interface DialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  closeLabel?: string;
}

export function Dialog({
  triggerLabel,
  title,
  description,
  closeLabel = "Close"
}: DialogProps) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;

    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <div data-slf-island="dialog">
      <button ref={trigger} type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onCancel={() => setOpen(false)}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <button type="button" onClick={() => setOpen(false)}>
          {closeLabel}
        </button>
      </dialog>
    </div>
  );
}
