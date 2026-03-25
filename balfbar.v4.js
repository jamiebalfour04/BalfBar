(function (global) {
  'use strict';

  var BalfBar = {
		version: '1.4.0',
    defaults: {
      desktopFixedMenuStart: 0,
      mobileFixedMenuStart: 0,
      supportHover: true,
      hideOnScroll: true,
      hideOnMouseOut: true,
      mobileThreshold: 900,
      menuAnimationTime: 500,
      menuToggleCallback: null,
      fixedMenuCallback: null
    },

    instances: [],

    init: function (selectorOrElements, options) {
			console.log('BalfBar v1.4-pure');
      var elements = this._resolveElements(selectorOrElements);
      var created = [];
      var i;

      for (i = 0; i < elements.length; i++) {
        if (!elements[i].__balfbarInstance) {
          elements[i].__balfbarInstance = new BalfBarInstance(elements[i], options || {});
          this.instances.push(elements[i].__balfbarInstance);
        }
        created.push(elements[i].__balfbarInstance);
      }

      return created.length === 1 ? created[0] : created;
    },

    getInstance: function (element) {
      return element && element.__balfbarInstance ? element.__balfbarInstance : null;
    },

    destroyAll: function () {
      var i;
      for (i = 0; i < this.instances.length; i++) {
        if (this.instances[i]) {
          this.instances[i].destroy();
        }
      }
      this.instances = [];
    },

    _resolveElements: function (input) {
      if (!input) {
        return [];
      }

      if (typeof input === 'string') {
        return document.querySelectorAll(input);
      }

      if (input.nodeType === 1) {
        return [input];
      }

      if (typeof input.length !== 'undefined') {
        return input;
      }

      return [];
    },

    _extend: function (base, extra) {
      var result = {};
      var key;

      for (key in base) {
        if (base.hasOwnProperty(key)) {
          result[key] = base[key];
        }
      }

      for (key in extra) {
        if (extra.hasOwnProperty(key)) {
          result[key] = extra[key];
        }
      }

      return result;
    },

    _addEvent: function (el, type, handler, store) {
      if (!el) {
        return;
      }

      if (el.addEventListener) {
        el.addEventListener(type, handler, false);
      } else if (el.attachEvent) {
        el.attachEvent('on' + type, handler);
      }

      store.push({
        el: el,
        type: type,
        handler: handler
      });
    },

    _removeEvent: function (el, type, handler) {
      if (!el) {
        return;
      }

      if (el.removeEventListener) {
        el.removeEventListener(type, handler, false);
      } else if (el.detachEvent) {
        el.detachEvent('on' + type, handler);
      }
    },

    _hasClass: function (el, cls) {
      if (!el) return false;
      if (el.classList) return el.classList.contains(cls);
      return new RegExp('(^|\\s)' + cls + '(\\s|$)').test(el.className);
    },

    _addClass: function (el, cls) {
      if (!el) return;
      if (el.classList) {
        el.classList.add(cls);
      } else if (!this._hasClass(el, cls)) {
        el.className += ' ' + cls;
      }
    },

    _removeClass: function (el, cls) {
      if (!el) return;
      if (el.classList) {
        el.classList.remove(cls);
      } else {
        el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g'), ' ');
      }
    },

    _matches: function (el, selector) {
      var fn;
      if (!el || el.nodeType !== 1) return false;

      fn =
        el.matches ||
        el.matchesSelector ||
        el.msMatchesSelector ||
        el.webkitMatchesSelector ||
        el.mozMatchesSelector;

      if (fn) {
        return fn.call(el, selector);
      }

      return false;
    },

    _closest: function (el, selector, stopAt) {
      while (el && el !== stopAt && el.nodeType === 1) {
        if (this._matches(el, selector)) {
          return el;
        }
        el = el.parentNode;
      }
      return null;
    },

    _findDirectChild: function (parent, selector) {
      var children;
      var i;

      if (!parent) return null;

      children = parent.children;
      for (i = 0; i < children.length; i++) {
        if (this._matches(children[i], selector)) {
          return children[i];
        }
      }

      return null;
    },

    _offsetTop: function (el) {
      var rect = el.getBoundingClientRect();
      return rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0);
    },

    _offsetLeft: function (el) {
      var rect = el.getBoundingClientRect();
      return rect.left + (window.pageXOffset || document.documentElement.scrollLeft || 0);
    }
  };

  function BalfBarInstance(menu, options) {
    this.menu = menu;
    this.options = BalfBar._extend(BalfBar.defaults, options || {});
    this.events = [];
    this.destroyed = false;

    this.mobileThreshold = this.options.mobileThreshold;
    this.desktopFixedMenuStart = this.options.desktopFixedMenuStart;
    this.mobileFixedMenuStart = this.options.mobileFixedMenuStart;
    this.animationTime = this.options.menuAnimationTime;
    this.callBack = this.options.menuToggleCallback;

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

  BalfBarInstance.prototype.init = function () {
    if (!BalfBar._hasClass(this.menu, 'fixed_menu')) {
      this.currentOffset = BalfBar._offsetTop(this.menu);
      this.parentOffset = this.menu.parentNode ? BalfBar._offsetTop(this.menu.parentNode) : -1;
    }

    BalfBar._addClass(this.menu, 'balfbar');
    BalfBar._addClass(this.menu, 'loaded');

    if (BalfBar._hasClass(this.menu, 'mobile_pushmenu')) {
      this.mobileMenuType = 'pushmenu';
    } else if (BalfBar._hasClass(this.menu, 'mobile_sidebar')) {
      this.mobileMenuType = 'sidebar';
    } else if (BalfBar._hasClass(this.menu, 'mobile_dropdown')) {
      this.mobileMenuType = 'dropdown';
    }

    if (BalfBar._hasClass(this.menu, 'desktop_sidebar')) {
      this.desktopMenuType = 'sidebar';
    }

    if (BalfBar._hasClass(this.menu, 'top_down')) {
      this.desktopTopdown = true;
    }

    this.currentMenuHeight = this.menu.offsetHeight;

    this.bindEvents();
    this.checkSize();
    this.checkScroll();

    return this;
  };

  BalfBarInstance.prototype.bindEvents = function () {
    var self = this;
    var itemTargets;
    var i;

    BalfBar._addEvent(window, 'resize', function () {
      if (self.destroyed) return;
      self.resetScrollable();
      if (!BalfBar._hasClass(self.menu, 'fixed_menu')) {
        self.currentOffset = BalfBar._offsetTop(self.menu);
      }
      self.checkSize();
      self.checkScroll();
    }, this.events);

    BalfBar._addEvent(window, 'scroll', function () {
      if (self.destroyed) return;
      self.resetScrollable();
      self.checkScroll();

      if (self.options.hideOnScroll) {
        if (!self.isMobile && !(self.desktopMenuType === 'sidebar' && !self.isMobile)) {
          self.close();
          self.closeAllDropdowns();
        }
      }
    }, this.events);

    BalfBar._addEvent(window, 'focus', function () {
      if (self.destroyed) return;
      self.checkScroll();
    }, this.events);

    if (this.menuButton) {
      BalfBar._addEvent(this.menuButton, 'click', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        self.toggleMenu();
      }, this.events);

      BalfBar._addEvent(this.menuButton, 'touchstart', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        self.toggleMenu();
      }, this.events);
    }

    if (this.options.hideOnMouseOut) {
      BalfBar._addEvent(document, 'click', function (e) {
        self.enteredMenu = false;
        self.propagateElsewhere(e);
      }, this.events);

      BalfBar._addEvent(document, 'mouseover', function (e) {
        self.enteredMenu = false;
        setTimeout(function () {
          if (!self.enteredMenu && !self.isMobile) {
            self.propagateElsewhere(e);
          }
        }, 100);
      }, this.events);
    }

    this.disableParentLinks();

    itemTargets = this.menu.querySelectorAll('.items > li, .dropdown > li, .megamenu li');

    for (i = 0; i < itemTargets.length; i++) {
      this.bindItem(itemTargets[i]);
    }

    itemTargets = this.menu.querySelectorAll('.items > li, .dropdown > li, .megamenu li, .item_holder > *, .item_holder');

    for (i = 0; i < itemTargets.length; i++) {
      this.bindInnerStopPropagation(itemTargets[i]);
    }
  };

  BalfBarInstance.prototype.bindItem = function (item) {
    var self = this;

    BalfBar._addEvent(item, 'click', function (e) {
      self.clickOnItem(e || window.event, item);
    }, this.events);

    BalfBar._addEvent(item, 'mouseenter', function (e) {
      BalfBar._addClass(item, 'hover');

      if (!(self.desktopMenuType === 'sidebar' && !self.isMobile)) {
        if (self.options.supportHover && !self.desktopTopdown) {
          if ((self.hoverCanFire || self.lastHoveredItem !== item) && !self.isMobile) {
            self.mouseCanFire = false;
            self.hoverCanFire = false;
            self.lastHoveredItem = item;

            self.openMenu(e || window.event, item);

            setTimeout(function () {
              self.mouseCanFire = true;
            }, 2000);

            setTimeout(function () {
              self.hoverCanFire = true;
              self.lastHoveredItem = null;
            }, 400);
          }
        }
      }
    }, this.events);

    BalfBar._addEvent(item, 'mouseleave', function () {
      var hovered = self.menu.querySelectorAll('.hover');
      var i;
      for (i = 0; i < hovered.length; i++) {
        BalfBar._removeClass(hovered[i], 'hover');
      }
    }, this.events);
  };

  BalfBarInstance.prototype.bindInnerStopPropagation = function (el) {
    var self = this;

    BalfBar._addEvent(el, 'click', function (e) {
      if (e && e.stopPropagation) e.stopPropagation();
      self.enteredMenu = true;
    }, this.events);

    BalfBar._addEvent(el, 'mouseover', function (e) {
      if (e && e.stopPropagation) e.stopPropagation();
      self.enteredMenu = true;
    }, this.events);
  };

  BalfBarInstance.prototype.disableParentLinks = function () {
    if (!this.items) return;

    var links = this.items.querySelectorAll('a');
    var i, parent, hasDropdown, hasMegamenu;

    for (i = 0; i < links.length; i++) {
      parent = links[i].parentNode;
      if (!parent) continue;

      hasDropdown = BalfBar._findDirectChild(parent, 'ul');
      hasMegamenu = BalfBar._findDirectChild(parent, 'div.megamenu');

      if (hasDropdown || hasMegamenu) {
        links[i].removeAttribute('href');
        BalfBar._addEvent(links[i], 'click', function (e) {
          if (e && e.preventDefault) e.preventDefault();
        }, this.events);
      }
    }
  };

  BalfBarInstance.prototype.getViewPort = function () {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
  };

  BalfBarInstance.prototype.checkSize = function () {
    var style;
    var scrollables;
    var i;

    if (this.mediaTester) {
      style = window.getComputedStyle ? window.getComputedStyle(this.mediaTester, null) : this.mediaTester.currentStyle;
      this.isMobile = style.display === 'none';
    } else {
      this.currentMenuHeight = this.menu.offsetHeight;

      scrollables = this.menu.querySelectorAll('.scrollable');
      for (i = 0; i < scrollables.length; i++) {
        scrollables[i].style.maxHeight = 'none';
        BalfBar._removeClass(scrollables[i], 'scrollable');
      }

      this.isMobile = this.getViewPort().width <= this.mobileThreshold;

      if (this.mobileMenuType === 'dropdown' && this.itemHolder) {
        this.itemHolder.style.top = this.currentMenuHeight + 'px';
      }
    }

    if (this.isMobile) {
      BalfBar._addClass(this.menu, 'is_mobile');
    } else {
      BalfBar._removeClass(this.menu, 'is_mobile');
    }

    return this.isMobile;
  };

  BalfBarInstance.prototype.checkScrollPosition = function () {
    var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    var self = this;

    function checkPosition(fixedStart) {
      if (!BalfBar._hasClass(self.menu, 'fixed_menu')) {
        self.currentOffset = BalfBar._offsetTop(self.menu);
        self.parentOffset = self.menu.parentNode ? BalfBar._offsetTop(self.menu.parentNode) : -1;
      }

      if (fixedStart === 0) return true;
      if (scroll >= fixedStart && fixedStart > -1) return true;
      if (self.currentOffset > -1 && scroll >= self.parentOffset && fixedStart === -2) return true;

      return false;
    }

    return (!this.isMobile && checkPosition(this.desktopFixedMenuStart)) ||
           (this.isMobile && checkPosition(this.mobileFixedMenuStart));
  };

  BalfBarInstance.prototype.checkScroll = function () {
    if (this.desktopFixedMenuStart === -1 && this.mobileFixedMenuStart === -1) {
      return false;
    }

    if (this.checkScrollPosition()) {
      if (!BalfBar._hasClass(this.menu, 'fixed_menu')) {
        BalfBar._addClass(this.menu, 'fixed_menu');
        if (typeof this.options.fixedMenuCallback === 'function') {
          this.options.fixedMenuCallback(true);
        }
      }
      return true;
    } else {
      if (BalfBar._hasClass(this.menu, 'fixed_menu')) {
        BalfBar._removeClass(this.menu, 'fixed_menu');
        if (typeof this.options.fixedMenuCallback === 'function') {
          this.options.fixedMenuCallback(false);
        }
      }
      return false;
    }
  };

  BalfBarInstance.prototype.resetScrollable = function () {
    var scrollables = this.menu.querySelectorAll('.scrollable');
    var i;

    for (i = 0; i < scrollables.length; i++) {
      scrollables[i].style.maxHeight = 'none';
      BalfBar._removeClass(scrollables[i], 'scrollable');
    }
  };

  BalfBarInstance.prototype.isOpen = function () {
    return BalfBar._hasClass(this.menu, 'out');
  };

  BalfBarInstance.prototype.open = function () {
    if (!this.isOpen()) {
      this.toggleMenu(true);
    }
  };

  BalfBarInstance.prototype.close = function () {
    if (this.isOpen()) {
      this.toggleMenu(false);
    }
  };

  BalfBarInstance.prototype.toggle = function () {
    this.toggleMenu();
  };

  BalfBarInstance.prototype.toggleMenu = function (forceState) {
    var self = this;
    var openState;

    if (this.touchFlag) return;
    this.touchFlag = true;

    setTimeout(function () {
      self.touchFlag = false;
    }, 1000);

    if (BalfBar._hasClass(this.menu, 'animating')) return;

    openState = typeof forceState === 'boolean' ? forceState : !BalfBar._hasClass(this.menu, 'out');

    BalfBar._addClass(this.menu, 'animating');

    if (openState) {
      BalfBar._addClass(this.menu, 'out');

      if (this.itemHolder) {
        this.itemHolder.style.display = 'block';
        if (this.mobileMenuType === 'dropdown') {
          this.itemHolder.style.top = this.currentMenuHeight + 'px';
        }
      }

      setTimeout(function () {
        self.openMenuFinish();
      }, this.animationTime);
    } else {
      setTimeout(function () {
        self.closeMenuFinish();
      }, this.animationTime);
    }
  };

  BalfBarInstance.prototype.openMenuFinish = function () {
    BalfBar._addClass(document.documentElement, 'balfbar_out');
    BalfBar._removeClass(this.menu, 'animating');

    if (typeof this.callBack === 'function') {
      this.callBack(true);
    }
  };

  BalfBarInstance.prototype.closeMenuFinish = function () {
    BalfBar._removeClass(this.menu, 'out');
    BalfBar._removeClass(document.documentElement, 'balfbar_out');
    BalfBar._removeClass(this.menu, 'animating');

    if (this.itemHolder && this.mobileMenuType) {
      this.itemHolder.style.display = '';
    }

    if (typeof this.callBack === 'function') {
      this.callBack(false);
    }
  };

  BalfBarInstance.prototype.closeAllDropdowns = function () {
    if (!this.items) return;

    var openItems = this.items.querySelectorAll('.open');
    var i;

    for (i = 0; i < openItems.length; i++) {
      BalfBar._removeClass(openItems[i], 'open');
    }

    this.resetScrollable();
  };

  BalfBarInstance.prototype.clickOnItem = function (mouseEvent, listItem) {
    var self = this;

    setTimeout(function () {
      if (self.mouseCanFire) {
        self.hoverCanFire = false;
        self.mouseCanFire = false;
        self.openMenu(mouseEvent, listItem);

        setTimeout(function () {
          self.hoverCanFire = true;
        }, 2000);

        setTimeout(function () {
          self.mouseCanFire = true;
        }, 500);
      }
    }, 200);
  };

  BalfBarInstance.prototype.calculateTop = function (el) {
    return BalfBar._offsetTop(el) - (window.pageYOffset || document.documentElement.scrollTop || 0);
  };

  BalfBarInstance.prototype.openMenu = function (mouseEvent, listItem) {
    var self = this;
    var viewportWidth;
    var viewportHeight;

    if (mouseEvent && mouseEvent.stopPropagation) {
      mouseEvent.stopPropagation();
    }

    viewportWidth = this.getViewPort().width;
    viewportHeight = this.getViewPort().height;
    this.enteredMenu = true;

    function closeChildren(root) {
      var openItems = root.querySelectorAll('.open');
      var scrollables = root.querySelectorAll('.scrollable');
      var i;

      for (i = 0; i < openItems.length; i++) {
        BalfBar._removeClass(openItems[i], 'open');
      }

      for (i = 0; i < scrollables.length; i++) {
        scrollables[i].style.maxHeight = 'none';
        BalfBar._removeClass(scrollables[i], 'scrollable');
      }
    }

    function openParents(item) {
      var parentNode = item.parentNode;
      var isTopLevel = parentNode && BalfBar._hasClass(parentNode, 'items');
      var dropdown;
      var leftPosition;
      var topDistance;
      var itemHeight;
      var maxHeight;
      var newTopPosition;
      var parentLi;

      BalfBar._addClass(item, 'open');

      if (!isTopLevel) {
        parentLi = BalfBar._closest(parentNode, 'li', self.menu);
        if (parentLi) {
          openParents(parentLi);
        }
      }

      if (!self.isMobile && self.desktopMenuType !== 'sidebar') {
        dropdown = BalfBar._findDirectChild(item, 'ul.dropdown') || BalfBar._findDirectChild(item, 'div.megamenu');

        if (!dropdown) return;

        leftPosition = BalfBar._offsetLeft(item);

        if (!isTopLevel) {
          leftPosition += item.offsetWidth;

          if (leftPosition + dropdown.offsetWidth >= viewportWidth || BalfBar._hasClass(parentNode, 'left_menu')) {
            BalfBar._addClass(dropdown, 'left_menu');
          } else {
            BalfBar._removeClass(dropdown, 'left_menu');
          }

          if (!BalfBar._hasClass(dropdown, 'scrollable')) {
            topDistance = self.calculateTop(item);
            itemHeight = dropdown.offsetHeight;

            if (topDistance + itemHeight > viewportHeight) {
              maxHeight = window.innerHeight - (BalfBar._offsetTop(dropdown) - (window.pageYOffset || 0));
              newTopPosition = (0 - topDistance) + 40;

              dropdown.style.maxHeight = maxHeight + 'px';
              dropdown.setAttribute('data-max-top', newTopPosition);
              dropdown.setAttribute('data-max-base', newTopPosition + (viewportHeight - itemHeight));
              BalfBar._addClass(dropdown, 'scrollable');
            }
          }
        }
      }
    }

    if (BalfBar._hasClass(listItem, 'open')) {
      BalfBar._removeClass(listItem, 'open');
      closeChildren(listItem);
    } else {
      this.closeAllDropdowns();
      openParents(listItem);
    }
  };

  BalfBarInstance.prototype.propagateElsewhere = function (e) {
    var self = this;

    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!(this.desktopMenuType === 'sidebar' && !this.isMobile)) {
      this.close();

      setTimeout(function () {
        if (self.menu.querySelectorAll('.hover').length === 0) {
          self.closeAllDropdowns();
        }
      }, 200);
    }
  };

  BalfBarInstance.prototype.refresh = function () {
    this.currentMenuHeight = this.menu.offsetHeight;
    this.checkSize();
    this.checkScroll();
    return this;
  };

  BalfBarInstance.prototype.destroy = function () {
    var i;

    if (this.destroyed) return;

    for (i = 0; i < this.events.length; i++) {
      BalfBar._removeEvent(
        this.events[i].el,
        this.events[i].type,
        this.events[i].handler
      );
    }

    this.events = [];
    this.closeAllDropdowns();
    this.close();

    BalfBar._removeClass(this.menu, 'balfbar');
    BalfBar._removeClass(this.menu, 'loaded');
    BalfBar._removeClass(this.menu, 'is_mobile');
    BalfBar._removeClass(this.menu, 'animating');
    BalfBar._removeClass(this.menu, 'out');

    delete this.menu.__balfbarInstance;
    this.destroyed = true;
  };

  global.BalfBar = BalfBar;
})(this);
