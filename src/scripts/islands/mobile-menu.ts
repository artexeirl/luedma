import { mountOnce, queryIslandRoots } from './runtime';

function mountMobileMenu(root: HTMLElement): void {
  const menuButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mobile-menu-button]'));
  const desktopCategoriesButton = root.querySelector<HTMLButtonElement>('.menu-trigger');
  const desktopBottomWrap = root.querySelector<HTMLElement>('.site-header__bottom-wrap');
  const mobilePanel = root.querySelector<HTMLElement>('[data-mobile-menu-panel]');
  const megaMenuBackdrop = root.querySelector<HTMLElement>('[data-mega-menu-backdrop]');
  const closeButtons = root.querySelectorAll<HTMLElement>('[data-mobile-menu-close]');
  const mobileTabButtons = root.querySelectorAll<HTMLButtonElement>('[data-mobile-tab-button]');
  const mobileTabPanels = root.querySelectorAll<HTMLElement>('[data-mobile-tab-panel]');
  const mobileAccordionItems = root.querySelectorAll<HTMLElement>('[data-mobile-accordion-item]');
  const mobileAccordionTriggers = root.querySelectorAll<HTMLButtonElement>('[data-mobile-accordion-trigger]');
  const megaMenuPanel = root.querySelector<HTMLElement>('[data-mega-menu-panel]');
  const megaCategoryTriggers = root.querySelectorAll<HTMLElement>('[data-mega-category-trigger]');
  const megaCategoryPanels = root.querySelectorAll<HTMLElement>('[data-mega-category-panel]');
  const desktopQuery = window.matchMedia('(min-width: 961px)');
  const mobileHeaderQuery = window.matchMedia('(max-width: 760px)');

  if (menuButtons.length === 0 || !mobilePanel) {
    return;
  }

  // Move the mobile drawer out of header stacking contexts so it always layers above page content.
  if (mobilePanel.parentElement !== document.body) {
    document.body.appendChild(mobilePanel);
  }

  // Move the mega menu backdrop out of the header so it layers correctly over page content
  // without being affected by the header's stacking context.
  if (megaMenuBackdrop && megaMenuBackdrop.parentElement !== document.body) {
    document.body.appendChild(megaMenuBackdrop);
  }

  const isDesktop = () => desktopQuery.matches;
  let lastScrollY = window.scrollY;
  let mobileHeaderOffset = 0;
  let mobileHeaderHeight = root.getBoundingClientRect().height;
  let ticking = false;
  let closeMegaMenuTimer: number | null = null;

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

  const syncMobileHeader = () => {
    mobileHeaderHeight = root.getBoundingClientRect().height;
    mobileHeaderOffset = Math.min(Math.max(mobileHeaderOffset, 0), mobileHeaderHeight);
    root.style.top = `${mobileHeaderOffset * -1}px`;
  };

  const showMobileHeader = () => {
    mobileHeaderOffset = 0;
    root.style.top = '0px';
  };

  const updateMobileHeaderOnScroll = () => {
    ticking = false;

    if (!mobileHeaderQuery.matches) {
      showMobileHeader();
      root.style.top = '';
      lastScrollY = window.scrollY;
      return;
    }

    if (document.body.classList.contains('menu-open')) {
      showMobileHeader();
      lastScrollY = window.scrollY;
      return;
    }

    const currentScrollY = Math.max(window.scrollY, 0);
    const delta = currentScrollY - lastScrollY;
    mobileHeaderHeight = root.getBoundingClientRect().height;

    if (currentScrollY <= 0) {
      showMobileHeader();
      lastScrollY = currentScrollY;
      return;
    }

    mobileHeaderOffset = Math.min(Math.max(mobileHeaderOffset + delta, 0), mobileHeaderHeight);
    root.style.setProperty('--mobile-header-offset', `${mobileHeaderOffset}px`);
    syncMegaBackdropPosition();
    lastScrollY = currentScrollY;
  };

  const onScroll = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(updateMobileHeaderOnScroll);
  };

  const openMobile = () => {
    showMobileHeader();
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

    syncMegaMenuHeight();
  };

  const setMegaBackdropVisible = (visible: boolean) => {
    if (!megaMenuBackdrop) {
      return;
    }

    if (visible) {
      megaMenuBackdrop.hidden = false;
      requestAnimationFrame(() => megaMenuBackdrop.classList.add('is-visible'));
      return;
    }

    megaMenuBackdrop.classList.remove('is-visible');
    window.setTimeout(() => {
      if (!megaMenuBackdrop?.classList.contains('is-visible')) {
        megaMenuBackdrop.hidden = true;
      }
    }, 220);
  };

  const syncMegaBackdropPosition = () => {
    if (!megaMenuBackdrop) {
      return;
    }

    const headerBottom = Math.max(0, root.getBoundingClientRect().bottom);
    megaMenuBackdrop.style.setProperty('--mega-menu-backdrop-top', `${headerBottom}px`);
  };

  const syncMegaMenuHeight = () => {
    if (!megaMenuPanel) {
      return;
    }

    const content = megaMenuPanel.firstElementChild as HTMLElement | null;
    const nextHeight = content?.scrollHeight || megaMenuPanel.scrollHeight || 0;
    megaMenuPanel.style.setProperty('--mega-menu-height', `${nextHeight}px`);
  };

  const cancelMegaMenuClose = () => {
    if (closeMegaMenuTimer !== null) {
      window.clearTimeout(closeMegaMenuTimer);
      closeMegaMenuTimer = null;
    }
  };

  const scheduleMegaMenuClose = () => {
    cancelMegaMenuClose();
    closeMegaMenuTimer = window.setTimeout(() => {
      closeMegaMenu();
      closeMegaMenuTimer = null;
    }, 80);
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
    syncMegaBackdropPosition();
    setMegaBackdropVisible(true);

    if (setInitialCategory) {
      const activeSlug = root.querySelector<HTMLElement>('[data-mega-category-trigger].is-active')?.dataset.categorySlug;
      if (activeSlug) {
        setActiveMegaCategory(activeSlug);
      } else {
        const firstSlug = megaCategoryTriggers[0]?.dataset.categorySlug;
        if (firstSlug) {
          setActiveMegaCategory(firstSlug);
        }
      }
    }

    requestAnimationFrame(syncMegaMenuHeight);
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
    setMegaBackdropVisible(false);
  };

  menuButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isDesktopCategoriesTrigger = button.classList.contains('menu-trigger');

      if (isDesktop() && isDesktopCategoriesTrigger) {
        // El menu-trigger ahora es un <a href="/c/">, la navegación la maneja el link.
        // Solo cerramos el megamenú si estaba abierto (para mobile).
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
      cancelMegaMenuClose();
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
  });

  desktopCategoriesButton?.addEventListener('mouseenter', () => {
    if (!isDesktop()) {
      return;
    }
    cancelMegaMenuClose();
    openMegaMenu(true);
  });

  desktopBottomWrap?.addEventListener('mouseenter', () => {
    if (!isDesktop()) {
      return;
    }
    cancelMegaMenuClose();
  });

  desktopBottomWrap?.addEventListener('mouseleave', () => {
    if (!isDesktop()) {
      return;
    }
    scheduleMegaMenuClose();
  });

  megaMenuPanel?.addEventListener('mouseenter', cancelMegaMenuClose);
  megaMenuPanel?.addEventListener('mouseleave', () => {
    if (!isDesktop()) {
      return;
    }
    scheduleMegaMenuClose();
  });

  megaMenuBackdrop?.addEventListener('click', closeMegaMenu);

  document.addEventListener('pointerdown', (event) => {
    const target = event.target as Node;
    if (!root.contains(target) && !mobilePanel.contains(target)) {
      closeMobile();
      closeMegaMenu();
    }
  });

  desktopQuery.addEventListener('change', () => {
    cancelMegaMenuClose();
    closeMobile();
    closeMegaMenu();
  });

  mobileHeaderQuery.addEventListener('change', () => {
    showMobileHeader();
    lastScrollY = window.scrollY;
    syncMobileHeader();
    syncMegaBackdropPosition();
  });

  window.addEventListener('scroll', () => {
    onScroll();
    // Keep backdrop position in sync while mega menu is open (header height may change on scroll)
    if (megaMenuPanel?.classList.contains('is-open')) {
      syncMegaBackdropPosition();
    }
  }, { passive: true });
  window.addEventListener('resize', () => {
    syncMobileHeader();
    syncMegaBackdropPosition();
    syncMegaMenuHeight();
  }, { passive: true });
  syncMobileHeader();
  syncMegaBackdropPosition();
  syncMegaMenuHeight();

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
