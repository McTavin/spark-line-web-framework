/** Optional browser enhancement. Native dialog supplies modality, Escape, and focus containment. */
export function mountReader(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>('dialog');
  const openButton = root.querySelector<HTMLButtonElement>('[data-reader-open]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-reader-close]');
  const template = root.querySelector<HTMLTemplateElement>('[data-reader-content]');
  const body = root.querySelector<HTMLElement>('[data-reader-body]');
  if (!dialog || !openButton || !closeButton || !template || !body || typeof dialog.showModal !== 'function') return () => {};
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let restoreScroll: (() => void) | undefined;
  let previousFocus: HTMLElement | null = null;
  const restore = () => {
    restoreScroll?.(); restoreScroll = undefined;
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  };
  const close = () => { dialog.close(); restore(); };
  const resize = new ResizeObserver(() => {
    const toolbar = dialog.querySelector<HTMLElement>('.slf-reader-toolbar');
    if (toolbar) dialog.style.setProperty('--reader-toolbar-size', `${toolbar.offsetHeight + 24}px`);
  });
  const toolbar = dialog.querySelector<HTMLElement>('.slf-reader-toolbar');
  if (toolbar) resize.observe(toolbar);
  openButton.hidden = false;
  openButton.addEventListener('click', () => {
    if (dialog.open) return;
    // An external close() queues its close event; release that old session before reopening.
    restore();
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
    if (!body.childElementCount) {
      body.append(template.content.cloneNode(true));
      body.querySelectorAll('table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'slf-reader-table';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', root.dataset.tableLabel ?? 'Scrollable table');
        table.before(wrapper); wrapper.append(table);
      });
      body.querySelectorAll('pre').forEach(pre => {
        pre.tabIndex = 0;
        pre.setAttribute('role', 'region');
        pre.setAttribute('aria-label', root.dataset.codeLabel ?? 'Scrollable code');
      });
    }
    dialog.showModal();
    dialog.scrollTop = 0;
    const scrollRoot = document.documentElement;
    const overflow = scrollRoot.style.overflow;
    const x = window.scrollX, y = window.scrollY;
    scrollRoot.style.overflow = 'hidden';
    restoreScroll = () => { scrollRoot.style.overflow = overflow; window.scrollTo(x, y); };
    closeButton.focus({ preventScroll: true });
  }, options);
  closeButton.addEventListener('click', close, options);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, options);
  // A delayed close event from the preceding session must not unlock a reopened dialog.
  dialog.addEventListener('close', () => { if (!dialog.open) restore(); }, options);
  body.addEventListener('click', event => {
    const link = (event.target instanceof Element ? event.target : null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || event.defaultPrevented || (event instanceof MouseEvent && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))) return;
    let id: string;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
    const target = body.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, options);
  return () => {
    if (dialog.open) dialog.close();
    restore(); abort.abort(); resize.disconnect(); openButton.hidden = true;
  };
}

/** Custom-element lifecycle also restores scrolling when a client router removes the page. */
export function defineReader(): void {
  if (customElements.get('slf-reader')) return;
  customElements.define('slf-reader', class extends HTMLElement {
    private dispose?: () => void;
    connectedCallback() { this.dispose?.(); this.dispose = mountReader(this); }
    disconnectedCallback() { this.dispose?.(); this.dispose = undefined; }
  });
}

// The optional Astro component loads this standalone module only when rendered.
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') defineReader();
