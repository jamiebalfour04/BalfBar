//This version of BalfBar uses ES6
function BalfBar(selectorOrElements, userOptions = {}) {
  console.log('BalfBar v1.5-pure');

  const defaults = {
    // When to add the fixed_menu class.
    // 0 = always, -1 = never, -2 = based on element position
    desktopFixedMenuStart: 0,
    mobileFixedMenuStart: 0,

    // Whether hover should open menu items
    supportHover: true,

    // Hide the menu on scroll
    hideOnScroll: true,

    // Hide the menu when clicking/hovering elsewhere
    hideOnMouseOut: true,

    // Mobile breakpoint (inclusive)
    mobileThreshold: 900,

    // Animation time in ms
    menuAnimationTime: 500,

    // Callback when mobile menu is toggled
    menuToggleCallback: null,

    // Callback when fixed menu state changes
    fixedMenuCallback: null
  };

  const options = { ...defaults, ...userOptions };

  const menus = resolveElements(selectorOrElements);

  menus.forEach((menu) => {
    new BalfBarInstance(menu, options);
  });

  return menus;

  function resolveElements(input) {
    if (!input) return [];
    if (typeof input === 'string') return Array.from(document.querySelectorAll(input));
    if (input instanceof Element) return [input];
    if (input instanceof NodeList || Array.isArray(input)) return Array.from(input);
    return [];
  }
}

class BalfBarInstance {
  constructor(menu, options) {
    this.menu = menu;
    this.options = options;

    this.mobileThreshold = options.mobileThreshold;
    this.desktopFixedMenuStart = options.desktopFixedMenuStart;
    this.mobileFixedMenuStart = options.mobileFixedMenuStart;
    this.animationTime = options.menuAnimationTime;
    this.callBack = options.menuToggleCallback;

    this.currentMenuHeight = 0;
    this.isMobile = false;
    this.touchFlag = false;

    this.mouseCanFire = true;
    this.hoverCanFire = true;
    this.enteredMenu = false;
    this.lastHoveredItem = null;

    this.currentOffset = -1;
    this.parentOffset = -1;

    this.menuButton = this.menu.querySelector('.menu_button');
    this.items = this.menu.querySelector('.items');
    this.itemHolder = this.menu.querySelector('.item_holder');
    this.mediaTester = this.menu.querySelector('.media_tester');

    this.mobileMenuType = '';
    this.desktopMenuType = '';
    this.desktopTopdown = false;

    this.init();
  }

  init() {
    if (!this.menu.classList.contains('fixed_menu')) {
      this.currentOffset = this.offsetTop(this.menu);
      this.parentOffset = this.menu.parentElement ? this.offsetTop(this.menu.parentElement) : -1;
    }

    this.menu.classList.add('balfbar', 'loaded');

    if (this.menu.classList.contains('mobile_pushmenu')) {
      this.mobileMenuType = 'pushmenu';
    } else if (this.menu.classList.contains('mobile_sidebar')) {
      this.mobileMenuType = 'sidebar';
    } else if (this.menu.classList.contains('mobile_dropdown')) {
      this.mobileMenuType = 'dropdown';
    }

    if (this.menu.classList.contains('desktop_sidebar')) {
      this.desktopMenuType = 'sidebar';
    }

    if (this.menu.classList.contains('top_down')) {
      this.desktopTopdown = true;
    }

    this.currentMenuHeight = this.menu.offsetHeight;

    this.bindGlobalResetEvents();
    this.checkSize();

    window.addEventListener('resize', () => {
      if (!this.menu.classList.contains('fixed_menu')) {
        this.currentOffset = this.offsetTop(this.menu);
      }
      this.checkSize();
      this.checkScroll();
    });

    window.addEventListener('scroll', () => {
      this.checkScroll();
    });

    window.addEventListener('focus', () => {
      this.checkScroll();
    });

    document.addEventListener('DOMContentLoaded', () => {
      this.checkSize();
      this.checkScroll();
    });

    this.checkScroll();

    this.bindMenuButton();
    this.bindHideOutside();
    this.bindHideOnScroll();
    this.bindTopLevelLinks();
    this.bindItemEvents();
  }

  bindGlobalResetEvents() {
    const resetScrollable = () => {
      this.menu.querySelectorAll('.scrollable').forEach((el) => {
        el.style.maxHeight = 'none';
        el.classList.remove('scrollable');
      });
    };

    window.addEventListener('resize', resetScrollable);
    window.addEventListener('scroll', resetScrollable);
  }

  getViewPort() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
  }

  checkSize() {
    if (this.mediaTester) {
      const style = window.getComputedStyle(this.mediaTester);
      this.isMobile = style.display === 'none';
    } else {
      this.currentMenuHeight = this.menu.offsetHeight;

      this.menu.querySelectorAll('.scrollable').forEach((el) => {
        el.style.maxHeight = 'none';
        el.classList.remove('scrollable');
      });

      this.isMobile = this.getViewPort().width <= this.mobileThreshold;

      if (this.mobileMenuType === 'dropdown' && this.itemHolder) {
        this.itemHolder.style.top = `${this.currentMenuHeight}px`;
      }
    }

    if (this.isMobile) {
      this.menu.classList.add('is_mobile');
    } else {
      this.menu.classList.remove('is_mobile');
    }
  }

  checkScrollPosition() {
    const scroll = window.scrollY || document.documentElement.scrollTop || 0;

    const checkPosition = (fixedStart) => {
      if (!this.menu.classList.contains('fixed_menu')) {
        this.currentOffset = this.offsetTop(this.menu);
        this.parentOffset = this.menu.parentElement ? this.offsetTop(this.menu.parentElement) : -1;
      }

      if (fixedStart === 0) return true;
      if (scroll >= fixedStart && fixedStart > -1) return true;
      if (this.currentOffset > -1 && scroll >= this.parentOffset && fixedStart === -2) return true;

      return false;
    };

    return (
      (!this.isMobile && checkPosition(this.desktopFixedMenuStart)) ||
      (this.isMobile && checkPosition(this.mobileFixedMenuStart))
    );
  }

  checkScroll() {
    if (this.desktopFixedMenuStart === -1 && this.mobileFixedMenuStart === -1) {
      return;
    }

    if (this.checkScrollPosition()) {
      if (!this.menu.classList.contains('fixed_menu')) {
        this.menu.classList.add('fixed_menu');
        if (typeof this.options.fixedMenuCallback === 'function') {
          this.options.fixedMenuCallback(true);
        }
      }
    } else {
      if (this.menu.classList.contains('fixed_menu')) {
        this.menu.classList.remove('fixed_menu');
        if (typeof this.options.fixedMenuCallback === 'function') {
          this.options.fixedMenuCallback(false);
        }
      }
    }
  }

  bindMenuButton() {
    if (!this.menuButton) return;

    this.menuButton.addEventListener('click', () => this.toggleMenu());
    this.menuButton.addEventListener('touchstart', () => this.toggleMenu(), { passive: true });
  }

  async toggleMenu() {
    if (this.touchFlag) return;

    this.touchFlag = true;
    setTimeout(() => {
      this.touchFlag = false;
    }, 1000);

    if (this.menu.classList.contains('animating')) return;

    this.menu.classList.add('animating');

    const topDistance = this.menu.classList.contains('fixed_menu') ? this.currentMenuHeight : 0;

    if (!this.menu.classList.contains('out')) {
      this.menu.classList.add('out');

      if (this.mobileMenuType === 'dropdown') {
        if (!this.itemHolder) return this.openMenuFinish();
        this.itemHolder.style.display = 'block';
        this.itemHolder.style.top = `${this.currentMenuHeight}px`;
        this.itemHolder.style.overflow = 'hidden';
        this.itemHolder.style.height = '0px';

        const targetHeight = this.getMaxHeight(this.itemHolder);

        await this.animate(this.itemHolder, [
          { height: '0px' },
          { height: targetHeight }
        ]);

        this.itemHolder.style.height = targetHeight;
        this.itemHolder.style.overflow = '';
        this.openMenuFinish();
      } else if (this.mobileMenuType === 'sidebar') {
        if (!this.itemHolder) return this.openMenuFinish();

        this.itemHolder.style.display = 'block';
        this.itemHolder.style.top = `${topDistance}px`;
        this.itemHolder.style.opacity = '0';
        this.itemHolder.style.left = '-20%';

        await this.animate(this.itemHolder, [
          { opacity: '0', left: '-20%' },
          { opacity: '1', left: '0px' }
        ]);

        this.itemHolder.style.opacity = '1';
        this.itemHolder.style.left = '0px';
        this.openMenuFinish();
      } else if (this.mobileMenuType === 'pushmenu') {
        if (!this.itemHolder) return this.openMenuFinish();

        const w = this.itemHolder.offsetWidth;

        this.itemHolder.style.display = 'block';
        this.itemHolder.style.top = `${topDistance}px`;
        this.itemHolder.style.left = '-100%';

        document.documentElement.classList.add('balfbar_no_overflow');
        document.body.classList.add('balfbar_no_overflow');

        const pushContainers = document.querySelectorAll('.balfbar_pushmenu_container');

        await Promise.all([
          this.animate(this.itemHolder, [
            { left: '-100%' },
            { left: '0px' }
          ]),
          ...Array.from(pushContainers).map((el) =>
            this.animate(el, [
              { left: '0px' },
              { left: `${w}px` }
            ]).then(() => {
              el.style.left = `${w}px`;
            })
          )
        ]);

        this.itemHolder.style.left = '0px';
        this.openMenuFinish();
      } else {
        this.openMenuFinish();
      }
    } else {
      if (this.mobileMenuType === 'dropdown') {
        if (!this.itemHolder) return this.closeMenuFinish();

        const startHeight = `${this.itemHolder.offsetHeight}px`;
        this.itemHolder.style.overflow = 'hidden';

        await this.animate(this.itemHolder, [
          { height: startHeight },
          { height: '0px' }
        ]);

        this.itemHolder.style.height = '0px';
        this.itemHolder.style.overflow = '';
        this.closeMenuFinish();
      } else if (this.mobileMenuType === 'sidebar') {
        if (!this.itemHolder) return this.closeMenuFinish();

        await this.animate(this.itemHolder, [
          { opacity: '1', left: '0px' },
          { opacity: '0', left: '-20%' }
        ]);

        this.itemHolder.style.opacity = '0';
        this.itemHolder.style.left = '-20%';
        this.closeMenuFinish();
      } else if (this.mobileMenuType === 'pushmenu') {
        if (!this.itemHolder) return this.closeMenuFinish();

        document.documentElement.classList.remove('balfbar_no_overflow');
        document.body.classList.remove('balfbar_no_overflow');

        const pushContainers = document.querySelectorAll('.balfbar_pushmenu_container');

        await Promise.all([
          this.animate(this.itemHolder, [
            { left: '0px' },
            { left: '-100%' }
          ]),
          ...Array.from(pushContainers).map((el) =>
            this.animate(el, [
              { left: el.style.left || '0px' },
              { left: '0px' }
            ]).then(() => {
              el.style.left = '0px';
            })
          )
        ]);

        this.itemHolder.style.left = '-100%';
        this.closeMenuFinish();
      } else {
        this.closeMenuFinish();
      }
    }
  }

  doCallback(value) {
    if (typeof this.callBack === 'function') {
      this.callBack(value);
    }
  }

  openMenuFinish() {
    document.documentElement.classList.add('balfbar_out');
    this.menu.classList.remove('animating');
    this.doCallback(true);
  }

  closeMenuFinish() {
    this.menu.classList.remove('out');
    document.documentElement.classList.remove('balfbar_out');
    this.menu.classList.remove('animating');
    this.doCallback(false);
  }

  bindHideOutside() {
    if (!this.options.hideOnMouseOut) return;

    document.addEventListener('click', (e) => {
      this.enteredMenu = false;
      this.propagateElsewhere(e);
    });

    document.addEventListener('mouseover', (e) => {
      this.enteredMenu = false;
      setTimeout(() => {
        if (this.enteredMenu === false && !this.isMobile) {
          this.propagateElsewhere(e);
        }
      }, 100);
    });
  }

  bindHideOnScroll() {
    if (!this.options.hideOnScroll) return;

    const handler = () => {
      if (!this.isMobile && !(this.desktopMenuType === 'sidebar' && !this.isMobile)) {
        if (this.menu.classList.contains('out')) {
          this.toggleMenu();
        }
        this.items?.querySelectorAll('.open').forEach((el) => el.classList.remove('open'));
      }
    };

    window.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
  }

  bindTopLevelLinks() {
    if (!this.items) return;

    this.items.querySelectorAll('a').forEach((a) => {
      const parent = a.parentElement;
      if (!parent) return;

      const hasDropdown = parent.querySelector(':scope > ul, :scope > div.megamenu');
      if (hasDropdown) {
        a.removeAttribute('href');
        a.addEventListener('click', (e) => e.preventDefault());
      }
    });
  }

  bindItemEvents() {
    const targets = this.menu.querySelectorAll('.items > li, .dropdown > li, .megamenu li');

    targets.forEach((item) => {
      item.addEventListener('click', (e) => {
        this.clickOnItem(e, item);
      });

      item.addEventListener('mouseenter', (e) => {
        item.classList.add('hover');

        if (!(this.desktopMenuType === 'sidebar' && !this.isMobile)) {
          if (this.options.supportHover && !this.desktopTopdown) {
            if ((this.hoverCanFire || this.lastHoveredItem !== item) && !this.isMobile) {
              this.mouseCanFire = false;
              this.hoverCanFire = false;
              this.lastHoveredItem = item;

              this.openMenu(e, item);

              setTimeout(() => {
                this.mouseCanFire = true;
              }, 2000);

              setTimeout(() => {
                this.hoverCanFire = true;
                this.lastHoveredItem = null;
              }, 400);
            }
          }
        }
      });

      item.addEventListener('mouseleave', () => {
        this.menu.querySelectorAll('.hover').forEach((el) => el.classList.remove('hover'));
      });
    });

    this.menu
      .querySelectorAll('.items > li, .dropdown > li, .megamenu li, .item_holder > *, .item_holder')
      .forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.enteredMenu = true;
        });

        el.addEventListener('mouseover', (e) => {
          e.stopPropagation();
          this.enteredMenu = true;
        });
      });
  }

  clickOnItem(mouseEvent, listItem) {
    setTimeout(() => {
      if (this.mouseCanFire) {
        this.hoverCanFire = false;
        this.mouseCanFire = false;
        this.openMenu(mouseEvent, listItem);

        setTimeout(() => {
          this.hoverCanFire = true;
        }, 2000);

        setTimeout(() => {
          this.mouseCanFire = true;
        }, 500);
      }
    }, 200);
  }

  propagateElsewhere(e) {
    e.stopPropagation();

    if (!(this.desktopMenuType === 'sidebar' && !this.isMobile)) {
      if (this.menu.classList.contains('out')) {
        this.toggleMenu();
      }

      setTimeout(() => {
        if (document.querySelectorAll('.hover').length === 0) {
          this.items?.querySelectorAll('.open').forEach((el) => el.classList.remove('open'));
          this.menu.querySelectorAll('.scrollable').forEach((el) => {
            el.style.maxHeight = 'none';
            el.classList.remove('scrollable');
          });
        }
      }, 200);
    }
  }

  openMenu(mouseEvent, listItem) {
    mouseEvent.stopPropagation();

    const viewportWidth = this.getViewPort().width;
    const viewportHeight = this.getViewPort().height;

    this.enteredMenu = true;

    const openParents = (item) => {
      const parentNode = item.parentElement;
      const isTopLevel = parentNode && parentNode.classList.contains('items');

      item.classList.add('open');

      if (!isTopLevel && parentNode) {
        openParents(parentNode.closest('li') || parentNode);
      }

      if (!this.isMobile) {
        if (this.desktopMenuType !== 'sidebar') {
          const dropdown = item.querySelector(':scope > ul.dropdown, :scope > div.megamenu');
          if (!dropdown) return;

          let leftPosition = this.offsetLeft(item);

          if (!isTopLevel) {
            leftPosition += item.offsetWidth;

            if (
              leftPosition + dropdown.offsetWidth >= viewportWidth ||
              parentNode.classList.contains('left_menu')
            ) {
              dropdown.classList.add('left_menu');
            } else {
              dropdown.classList.remove('left_menu');
            }

            dropdown.style.zIndex = String(dropdown.closestAll ? dropdown.closestAll('ul').length : this.countParents(dropdown, 'ul'));

            if (!dropdown.classList.contains('scrollable')) {
              const topDistance = this.calculateTop(item);
              const itemHeight = dropdown.offsetHeight;

              if (topDistance + itemHeight > viewportHeight) {
                const maxHeight =
                  window.innerHeight - (this.offsetTop(dropdown) - window.scrollY);
                const newTopPosition = -topDistance + 40;

                dropdown.style.maxHeight = `${maxHeight}px`;
                dropdown.dataset.maxTop = String(newTopPosition);
                dropdown.dataset.maxBase = String(newTopPosition + (viewportHeight - itemHeight));
                dropdown.classList.add('scrollable');
              }
            }
          } else {
            if (
              !dropdown.classList.contains('open') &&
              (dropdown.classList.contains('dropdown') || dropdown.classList.contains('megamenu'))
            ) {
              if (!(this.desktopMenuType === 'sidebar' && !this.isMobile)) {
                dropdown.style.marginTop = `${-this.currentMenuHeight}px`;
                this.animate(dropdown, [
                  { marginTop: `${-this.currentMenuHeight}px` },
                  { marginTop: '-1px' }
                ], 500).then(() => {
                  dropdown.style.marginTop = '-1px';
                });
              } else {
                const targetHeight = `${dropdown.scrollHeight}px`;
                dropdown.style.height = '0px';
                this.animate(dropdown, [
                  { height: '0px' },
                  { height: targetHeight }
                ], 500).then(() => {
                  dropdown.style.height = targetHeight;
                });
              }
            }
          }
        }
      }
    };

    const closeChildren = (m) => {
      m.querySelectorAll('.open').forEach((el) => el.classList.remove('open'));
      m.querySelectorAll('.scrollable').forEach((el) => {
        el.style.maxHeight = 'none';
        el.classList.remove('scrollable');
      });
    };

    if (listItem.classList.contains('open')) {
      listItem.classList.remove('open');
      listItem.querySelectorAll('.scrollable').forEach((el) => {
        el.style.maxHeight = 'none';
        el.classList.remove('scrollable');
      });
      closeChildren(listItem);
    } else {
      this.items?.querySelectorAll('.open').forEach((el) => el.classList.remove('open'));
      this.items?.querySelectorAll('.scrollable').forEach((el) => {
        el.style.maxHeight = 'none';
        el.classList.remove('scrollable');
      });
      openParents(listItem);
    }
  }

  calculateTop(el) {
    return this.offsetTop(el) - (document.documentElement.scrollTop || document.body.scrollTop || 0);
  }

  offsetTop(el) {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  }

  offsetLeft(el) {
    const rect = el.getBoundingClientRect();
    return rect.left + window.scrollX;
  }

  getMaxHeight(el) {
    const computed = window.getComputedStyle(el).maxHeight;
    if (computed && computed !== 'none') return computed;
    return `${el.scrollHeight}px`;
  }

  countParents(el, selector) {
    let count = 0;
    let node = el.parentElement;
    while (node) {
      if (node.matches(selector)) count++;
      node = node.parentElement;
    }
    return count;
  }

  animate(el, keyframes, duration = this.animationTime) {
    return new Promise((resolve) => {
      if (!el) {
        resolve();
        return;
      }

      if (el.animate) {
        const animation = el.animate(keyframes, {
          duration,
          easing: 'ease',
          fill: 'forwards'
        });

        animation.addEventListener('finish', () => resolve());
        animation.addEventListener('cancel', () => resolve());
      } else {
        const finalFrame = keyframes[keyframes.length - 1];
        Object.keys(finalFrame).forEach((prop) => {
          el.style[prop] = finalFrame[prop];
        });
        setTimeout(resolve, duration);
      }
    });
  }
}
