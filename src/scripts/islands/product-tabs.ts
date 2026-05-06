import { mountOnce, queryIslandRoots } from './runtime';

function mountTabs(root: HTMLElement): void {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tab-target]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tab-panel]'));
  const content = root.querySelector<HTMLElement>('.product-tabs__content');
  if (buttons.length === 0 || panels.length === 0 || !content) return;

  const syncHeight = (activePanel: HTMLElement) => {
    const styles = window.getComputedStyle(content);
    const topPadding = Number.parseFloat(styles.paddingTop) || 0;
    const bottomPadding = Number.parseFloat(styles.paddingBottom) || 0;
    content.style.height = `${activePanel.offsetHeight + topPadding + bottomPadding}px`;
  };

  const activate = (target: string) => {
    let activePanel: HTMLElement | undefined;

    buttons.forEach((button) => {
      const isActive = button.dataset.tabTarget === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === target;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (isActive) {
        activePanel = panel;
      }
    });

    if (activePanel) {
      requestAnimationFrame(() => syncHeight(activePanel!));
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => activate(button.dataset.tabTarget || ''));
  });

  const initial = buttons.find((button) => button.classList.contains('is-active'))?.dataset.tabTarget ?? buttons[0]?.dataset.tabTarget ?? '';
  if (initial) {
    activate(initial);
  }

  window.addEventListener('resize', () => {
    const current = panels.find((panel) => panel.classList.contains('is-active'));
    if (current) {
      requestAnimationFrame(() => syncHeight(current));
    }
  }, {passive: true});
}

export function mount(): void {
  queryIslandRoots('product-tabs').forEach((root) => {
    mountOnce(root, mountTabs);
  });
}
