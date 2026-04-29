import { mountOnce, queryIslandRoots } from './runtime';

function mountMobileMenu(root: HTMLElement): void {
  const menuButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mobile-menu-button]'));
  const desktopCategoriesButton = root.querySelector<HTMLButtonElement>('.menu-trigger');
  const mobilePanel = root.querySelector<HTMLElement>('[data-mobile-menu-panel]');
  const closeButtons = root.querySelectorAll<HTMLElement>('[data-mobile-menu-close]');
  const mobileTabButtons = root.querySelectorAll<HTMLButtonElement>('[data-mobile-tab-button]');
  const mobileTabPanels = root.querySelectorAll<HTMLElement>('[data-mobile-tab-panel]');
  const mobileAccordionItems = root.querySelectorAll<HTMLElement>('[data-mobile-accordion-item]');
  const mobileAccordionTriggers = root.querySelectorAll<HTMLButtonElement>('[data-mobile-accordion-trigger]');
  const megaMenuPanel = root.querySelector<HTMLElement>('[data-mega-menu-panel]');
  const megaCategoryTriggers = root.querySelectorAll<HTMLElement>('[data-mega-category-trigger]');
  const megaCategoryPanels = root.querySelectorAll<HTMLElement>('[data-mega-category-panel]');
  const desktopQuery = window.matchMedia('(min-width: 961px)');

  if (menuButtons.length === 0 || !mobilePanel) {
    return;
  }

  // Move the mobile drawer out of header stacking contexts so it always layers above page content.
  if (mobilePanel.parentElement !== document.body) {
    document.body.appendChild(mobilePanel);
  }

  const isDesktop = () => desktopQuery.matches;

  const setMobileTab = (panelId: string) => {
    mobileTabButtons.forEach((button) => {
      const isActive = button.dataset.mobileTabTarget === panelId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    mobileTabPanels.forEach((panel) => {
      const isActive = panel.dataset.mobileTabPanelId === panelId;
      panel.classList.toggle('is-active', isActive);
    });
  };

  const setMobileAccordion = (slug: string | null) => {
    mobileAccordionItems.forEach((item) => {
      const isOpen = slug !== null && item.dataset.categorySlug === slug;
      item.classList.toggle('is-open', isOpen);
    });

    mobileAccordionTriggers.forEach((trigger) => {
      const isOpen = slug !== null && trigger.dataset.categorySlug === slug;
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  };

  const openMobile = () => {
    mobilePanel.hidden = false;
    mobilePanel.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      mobilePanel.classList.add('is-open');
    });
    menuButtons.forEach((button) => button.setAttribute('aria-expanded', 'true'));
    document.body.classList.add('menu-open');
    setMobileTab('categories');

    const firstAccordionSlug = mobileAccordionTriggers[0]?.dataset.categorySlug;
    if (firstAccordionSlug) {
      setMobileAccordion(firstAccordionSlug);
    }
  };

  const closeMobile = () => {
    mobilePanel.classList.remove('is-open');
    mobilePanel.setAttribute('aria-hidden', 'true');
    menuButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('menu-open');

    window.setTimeout(() => {
      if (!mobilePanel.classList.contains('is-open')) {
        mobilePanel.hidden = true;
      }
    }, 320);
  };

  const setActiveMegaCategory = (slug: string) => {
    megaCategoryTriggers.forEach((trigger) => {
      const isActive = trigger.dataset.categorySlug === slug;
      trigger.classList.toggle('is-active', isActive);
      trigger.setAttribute('aria-expanded', String(isActive));
    });

    megaCategoryPanels.forEach((panel) => {
      const isActive = panel.dataset.categorySlug === slug;
      panel.classList.toggle('is-active', isActive);
    });
  };

  const openMegaMenu = (setInitialCategory = false) => {
    if (!megaMenuPanel) {
      return;
    }

    megaMenuPanel.classList.add('is-open');
    megaMenuPanel.setAttribute('aria-hidden', 'false');
    if (desktopCategoriesButton) {
      desktopCategoriesButton.setAttribute('aria-expanded', 'true');
    }

    if (!setInitialCategory) {
      return;
    }

    const activeSlug = root.querySelector<HTMLElement>('[data-mega-category-trigger].is-active')?.dataset.categorySlug;
    if (activeSlug) {
      setActiveMegaCategory(activeSlug);
      return;
    }

    const firstSlug = megaCategoryTriggers[0]?.dataset.categorySlug;
    if (firstSlug) {
      setActiveMegaCategory(firstSlug);
    }
  };

  const closeMegaMenu = () => {
    if (!megaMenuPanel) {
      return;
    }

    megaMenuPanel.classList.remove('is-open');
    megaMenuPanel.setAttribute('aria-hidden', 'true');
    if (desktopCategoriesButton) {
      desktopCategoriesButton.setAttribute('aria-expanded', 'false');
    }
  };

  menuButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isDesktopCategoriesTrigger = button.classList.contains('menu-trigger');

      if (isDesktop() && isDesktopCategoriesTrigger) {
        if (!megaMenuPanel) {
          return;
        }

        if (megaMenuPanel.classList.contains('is-open')) {
          closeMegaMenu();
        } else {
          openMegaMenu(true);
        }
        return;
      }

      if (mobilePanel.hidden) {
        openMobile();
      } else {
        closeMobile();
      }
    });
  });

  closeButtons.forEach((node) => node.addEventListener('click', closeMobile));

  mobileTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const panelId = button.dataset.mobileTabTarget;
      if (!panelId) {
        return;
      }
      setMobileTab(panelId);
    });
  });

  mobileAccordionTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const slug = trigger.dataset.categorySlug ?? null;
      const isAlreadyOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (!slug) {
        return;
      }

      setMobileAccordion(isAlreadyOpen ? null : slug);
    });
  });

  megaCategoryTriggers.forEach((trigger) => {
    const activate = () => {
      const slug = trigger.dataset.categorySlug;
      if (!slug) {
        return;
      }

      if (isDesktop()) {
        openMegaMenu();
      }
      setActiveMegaCategory(slug);
    };

    trigger.addEventListener('mouseenter', activate);
    trigger.addEventListener('focus', activate);
    trigger.addEventListener('click', activate);
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target as Node;
    if (!root.contains(target) && !mobilePanel.contains(target)) {
      closeMobile();
      closeMegaMenu();
    }
  });

  desktopQuery.addEventListener('change', () => {
    closeMobile();
    closeMegaMenu();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobile();
      closeMegaMenu();
    }
  });
}

export function mount(): void {
  queryIslandRoots('mobile-menu').forEach((root) => mountOnce(root, mountMobileMenu));
}
