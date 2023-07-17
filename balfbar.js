(function($) {
  $.fn.extend({
    BalfBar: function(options) {

      console.log('BalfBar v1.4');

      var defaults = {
        //When to add the fixed_menu class. 0 means always, -1 means never (or always, if you add the class manually) and a -2 means that it will be based on the position of the element
        desktopFixedMenuStart: 0,
        mobileFixedMenuStart: 0,
        //Whether or not hover events should trigger, i.e. should hovering open the menu item
        supportHover: true,
        //Hide the menu on scroll
        hideOnScroll: true,
        //Hide the menu when mouse clicks or hovers elsewhere
        hideOnMouseOut: true,
        //When to start using mobile events (less than and inclusive)
        mobileThreshold: 900,
        //How long the menu takes to open
        menuAnimationTime: 500,
        //A callback function when the menu is toggled
        menuToggleCallback: null,
        //A callback function when the menu is toggled to fixed
        fixedMenuCallback: null
      };

      var options = $.extend(defaults, options);

      //Options to variables

      var mobileThreshold = options.mobileThreshold;
      var desktopFixedMenuStart = options.desktopFixedMenuStart;
      var mobileFixedMenuStart = options.mobileFixedMenuStart;
      var animationTime = options.menuAnimationTime;
      var callBack = options.menuToggleCallback;


      //Initial settings

      //Current menu height
      var currentMenuHeight = 0;
      //Is mobile or not
      var isMobile = false;
      //The viewport to assess
      var viewport = window;

      return this.each(function() {

        var this_menu = $(this);
        var currentOffset = -1;
        var parentOffset = -1;
        if (!$(this_menu).hasClass("fixed_menu")) {
          currentOffset = $(this_menu).offset().top;
          parentOffset = $(this_menu).parent().offset().top;
        }

        $(this_menu).addClass("balfbar");
        $(this_menu).addClass("loaded");

        var mobileMenuType = "";
        if ($(this_menu).hasClass("mobile_pushmenu")) {
          mobileMenuType = "pushmenu";
        } else if ($(this_menu).hasClass("mobile_sidebar")) {
          mobileMenuType = "sidebar";
        } else if ($(this_menu).hasClass("mobile_dropdown")) {
          mobileMenuType = "dropdown";
        }

        var desktopMenuType = "";
        if ($(this_menu).hasClass("desktop_sidebar")) {
          desktopMenuType = "sidebar";
        }

        var desktop_topdown = false;

        if ($(this_menu).hasClass("top_down")) {
          desktop_topdown = true;
        }

        currentMenuHeight = $(this_menu).height();

        //For touch
        var touch_flag = false;

        var menu_button = $(this_menu).find('.menu_button');
        var items = $(this_menu).find('.items');
        var item_holder = $(this_menu).find('.item_holder');

        //Media tester
        var mediaTester = $(this_menu).find('.media_tester');

        //Old method to get the viewport
        function getViewPort() {
          var e = window,
            a = 'inner';
          if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
          }
          return {
            width: e[a + 'Width'],
            height: e[a + 'Height']
          };
        }

        $(window).on("resize scroll", function() {
          //Need to reset sizes
          $(this_menu).find('.scrollable').css({
            "max-height": "none"
          }).removeClass("scrollable");
        });

        //Checks if the device is greater than the mobileThreshold
        if (mobileThreshold > -1) {

          function checkSize() {

            //If the media tester exists then we can use it's display property to check whether we are mobile or not
            if (mediaTester.length > 0) {

              if (mediaTester.is(':visible')) {
                isMobile = false;
              } else {
                isMobile = true;
              }
            } else {
              if (mobileThreshold > -1) {
                if (getViewPort().width <= mobileThreshold) {
                  isMobile = true;
                }
              }
              currentMenuHeight = $(this_menu).height();
              var s = $(this_menu).find('.scrollable');
              $(s).css({
                "max-height": "none"
              }).removeClass("scrollable");
              if (getViewPort().width > mobileThreshold) {
                isMobile = false;
              } else {
                isMobile = true;
              }
              if (mobileMenuType == "dropdown") {
                $(item_holder).css({
                  top: currentMenuHeight
                });
              }
            }

            if (isMobile) {
              $(this_menu).addClass("is_mobile");
            } else {
              $(this_menu).removeClass("is_mobile");
            }
          }

          checkSize();
          $(window).on("ready resize", function() {
            if (!$(this_menu).hasClass("fixed_menu")) {
              currentOffset = $(this_menu).offset().top;
            }
            checkSize();
          });


        }

        //Determine whether to add a fixed menu or not
        function checkScrollPosition() {

          //We need to determine whether or not it has passed the scroll point
          var scroll = $(viewport).scrollTop();

          function checkPosition(fixedStart) {

            if (!$(this_menu).hasClass("fixed_menu")) {
              currentOffset = $(this_menu).offset().top;
              parentOffset = $(this_menu).parent().offset().top;
            }

            //Static means the user has specified when it will scroll. 0 means always
            if (fixedStart == 0) {
              return true;
            }
            if (scroll >= fixedStart && fixedStart > -1) {
              return true;
            }
            if (currentOffset > -1 && (scroll >= parentOffset && fixedStart == -2)) {
              return true;
            }

            return false;
          }


          return (!isMobile && checkPosition(desktopFixedMenuStart)) || (isMobile && checkPosition(mobileFixedMenuStart));
        }

        //Add fixed menu if one or the other is not -1
        if (desktopFixedMenuStart != -1 || mobileFixedMenuStart != -1) {

          function checkScroll() {


            //If checkScrollPosition == true then add fixed classes
            if (checkScrollPosition()) {
              if (!$(this_menu).hasClass('fixed_menu')) {
                $(this_menu).addClass("fixed_menu");
                if (options.fixedMenuCallback != null) {
                  options.fixedMenuCallback(true);
                }
              }
            } else {
              //Remove classes
              if ($(this_menu).hasClass('fixed_menu')) {
                $(this_menu).removeClass("fixed_menu");
                if (options.fixedMenuCallback != null) {
                  options.fixedMenuCallback(false);
                }
              }
            }
          }

          $(document).on("ready scroll resize", function() {
            checkScroll();
          });
          $(window).on("focus resize", function() {
            checkScroll();
          });

          checkScroll();

        }

        //Each of these represents an interaction state
        var mouseCanFire = true;
        var hoverCanFire = true;
        var enteredMenu = false;
        var lastHoveredItem = null;

        //Button
        function toggleMenu() {
          if (!touch_flag) {
            touch_flag = true;
            setTimeout(function() {
              touch_flag = false;
            }, 1000);
            if (!($(this_menu).hasClass("animating"))) {

              $(this_menu).addClass("animating");

              var top_distance = 0;
              if ($(this_menu).hasClass("fixed_menu")) {
                top_distance = currentMenuHeight;
              }
              if (!$(this_menu).hasClass("out")) {
                //var off = $(window).height() - $(item_holder).offset().top;
                $(this_menu).addClass("out");
                if (mobileMenuType == "dropdown") {
                  $(item_holder).show().css({
                    top: currentMenuHeight,
                    height: 0
                  }).animate({
                    height: $(item_holder).css("max-height")
                  }, animationTime, function() {
                    openMenuFinish();
                  });
                } else if (mobileMenuType == "sidebar") {
                  $(item_holder).css({
                    display: "block",
                    top: top_distance
                  }).animate({
                    opacity: 1,
                    left: 0
                  }, animationTime, function() {
                    openMenuFinish();
                  });
                } else if (mobileMenuType == "pushmenu") {
                  var w = $(item_holder).width();
                  $(item_holder).css({
                    display: "block",
                    top: top_distance
                  }).animate({
                    left: 0
                  }, animationTime, function() {
                    openMenuFinish();
                  });
                  $("html, body").addClass("balfbar_no_overflow");
                  $('.balfbar_pushmenu_container').animate({
                    left: w
                  }, animationTime);
                }
              } else {
                if (mobileMenuType == "dropdown") {
                  $(item_holder).animate({
                    height: 0
                  }, animationTime, function() {
                    closeMenuFinish();
                  });
                } else if (mobileMenuType == "sidebar") {
                  $(item_holder).animate({
                    opacity: 0,
                    left: "-20%"
                  }, animationTime, function() {
                    closeMenuFinish();
                  });
                } else if (mobileMenuType == "pushmenu") {
                  $(item_holder).animate({
                    left: "-100%"
                  }, animationTime);
                  $("html, body").removeClass("balfbar_no_overflow");
                  $('.balfbar_pushmenu_container').animate({
                    left: 0
                  }, animationTime, function() {
                    closeMenuFinish();
                  });
                }
              }
            }

          }
        }

        function doCallback(value) {
          if (typeof callBack === "function") {
            callBack(value);
          }
        }

        function openMenuFinish() {
          $("html").addClass("balfbar_out");
          $(this_menu).removeClass("animating");
          //Call after complete
          doCallback(true);
        }

        function closeMenuFinish() {
          $(this_menu).removeClass("out");
          $("html").removeClass("balfbar_out");
          $(this_menu).removeClass("animating");
          //Call after complete
          doCallback(false);
        }

        //Click elsewhere
        function propagateElsewhere(e) {
          e.stopPropagation();
          //If it's not the desktop sidebar
          if (!(desktopMenuType == "sidebar" && !isMobile)) {
            if ($(this_menu).hasClass("out")) {
              toggleMenu();
            }
            setTimeout(function() {
              if ($('.hover').length == 0) {
                $(items).find('.open').removeClass("open");
                $(this_menu).find('.scrollable').css({
                  "max-height": "none"
                }).removeClass("scrollable");
              }
            }, 200);
          }
        }

        function calculateTop(i) {
          return $(i).offset().top - $(document).scrollTop();
        }

        function openMenu(mouseEvent, listItem) {
          //Prevent it navigating to something
          mouseEvent.stopPropagation();

          var viewportWidth = getViewPort().width;
          var viewportHeight = getViewPort().height;

          //We have now entered the menu
          enteredMenu = true;

          console.log(desktopMenuType);

          //Opens and positions all items
          function openParents(item) {
            var parentNode = $(item).parent();
            var isTopLevel = parentNode != null && $(parentNode).hasClass("items");
            //Find the first dropdown
            $(item).addClass("open");
            if (!isTopLevel) {
              //We only open up to .items
              openParents(parentNode);
            }

            if (!isMobile) {
              if (desktopMenuType != "sidebar") {
                var dropdown = $(item).children('ul.dropdown, div.megamenu');
                //Set the left offset for this item's dropdown
                var leftPosition = $(item).offset().left;

                //If isTopLevel then it is a top level item
                if (!isTopLevel) {

                  //If it's out of the window at the right, we need to attempt to get it so that it's not
                  leftPosition += $(item).width();
                  if (leftPosition + $(dropdown).width() >= viewportWidth || $(parentNode).hasClass("left_menu")) {
                    $(dropdown).addClass("left_menu");
                  } else {
                    $(dropdown).removeClass("left_menu");
                  }

                  //z-index is set based on depth because a left floating menu will possibly cover others
                  $(dropdown).css({
                    "z-index": $(dropdown).parents("ul").length
                  });

                  //Check top positioning
                  if (!$(dropdown).hasClass("scrollable")) {
                    //Calculate top offset
                    var topDistance = calculateTop(item);
                    var itemHeight = $(dropdown).height();
                    if ((topDistance + itemHeight) > viewportHeight) {
                      //This exceeds the height we deal with it
                      var newTopPosition = 0;
                      var maxHeight = $(window).height() - ($(dropdown).offset().top - $(window).scrollTop());
                      newTopPosition = (0 - topDistance) + 40;

                      $(dropdown).css({
                        "max-height": maxHeight
                      }).attr("data-max-top", newTopPosition).attr("data-max-base", newTopPosition + (viewportHeight - itemHeight)).addClass("scrollable");
                    }
                  }
                } else {
                  //Top level dropdowns animate
                  if (!$(dropdown).hasClass("open") && ($(dropdown).hasClass("dropdown") || $(dropdown).hasClass("megamenu"))) {
                    if (!(desktopMenuType == "sidebar" && !isMobile)) {
                      $(dropdown).css({
                        "margin-top": 0 - currentMenuHeight
                      }).animate({
                        "margin-top": -1
                      }, 500);
                    } else {
                      $(dropdown).css({
                        "height": 0
                      }).animate({
                        "height": $(dropdown).height()
                      }, 500);
                    }
                  }
                }
              }
            }
          }

          function closeChildren(m) {
            $(m).find("open").removeClass("open");
            $(m).find('.scrollable').css({
              "max-height": "none"
            }).removeClass("scrollable");
          }

          if ($(listItem).hasClass("open")) {
            $(listItem).removeClass("open");
            $(listItem).find('.scrollable').css({
              "max-height": "none"
            }).removeClass("scrollable");
            closeChildren(listItem);
          } else {
            //var dds = $(listItem).children(".dropdown");
            //Make all others disappear
            $(items).find(".open").removeClass("open");
            $(items).find('.scrollable').css({
              "max-height": "none"
            }).removeClass("scrollable");
            //Open all parents of this item and position all
            openParents(listItem);
          }
        }

        //Button touch and click
        $(menu_button).on("click", function() {
          toggleMenu();
        });
        $(menu_button).on("touchstart", function() {
          toggleMenu();
        });

        //Hide the menu and all open items if the user clicks elsewhere
        if (options.hideOnMouseOut) {
          //Click away (instant)
          $(document).on("click", function(e) {
            enteredMenu = false;
            propagateElsewhere(e);
          });
          //Hover away (slow)
          $(document).on("mouseover", function(e) {
            enteredMenu = false;
            setTimeout(function() {
              if (enteredMenu == false && !isMobile) {
                propagateElsewhere(e);
              }
            }, 100);
          });
        }

        //Hide the menu when the document is resized or the user scrolls
        if (options.hideOnScroll) {
          //Hide mobile menu
          $(document).on("scroll resize", function(e) {
            if (!isMobile && !(desktopMenuType == "sidebar" && !isMobile)) {
              if ($(this_menu).hasClass("out")) {
                toggleMenu();
              }
              $(items).find('.open').removeClass("open");
            }
          });
        }

        //Desktop versions will ignore top-level links
        $(items).find('a').each(function(e) {
          var len = $(this).parent().find('ul').length;
          if (len > 0) {
            $(this).removeAttr("href");
            $(this).on("click", function(e) {
              e.preventDefault();
            })
          }
        });

        function clickOnItem(mouseEvent, listItem) {
          setTimeout(function() {
            if (mouseCanFire) {
              hoverCanFire = false;
              mouseCanFire = false;
              openMenu(mouseEvent, listItem);
              setTimeout(function() {
                hoverCanFire = true;
              }, 2000);
              setTimeout(function() {
                mouseCanFire = true;
              }, 500);
            }
          }, 200);
        }

        //Click works for most devices, but some also like hover.
        $(this_menu).find('.items > li, .dropdown > li, .megamenu li').on("click", function(e) {
          clickOnItem(e, this);
        });



        /*
         * Hover works on all devices above 901px, but stops being used below this.
         * Devices such as iPad, iPhone, Win10 tabs will all use the click event by default anyway,
         * and desktops with cursors will choose to use the click at this size as well.
         */

        $(this_menu).find('.items > li, .dropdown > li, .megamenu li').on("mouseenter", function(mouseEvent) {
          //Desktop sidebar has no hover
          $(this).addClass('hover');
          if (!(desktopMenuType == "sidebar" && !isMobile)) {
            //If SupportHover is true, then we support hover events to open the menus
            if (options.supportHover && !desktop_topdown) {
              if ((hoverCanFire || lastHoveredItem != this) && !isMobile) {
                mouseCanFire = false;
                hoverCanFire = false;
                lastHoveredItem = this;
                openMenu(mouseEvent, this);
                setTimeout(function() {
                  mouseCanFire = true;
                }, 2000);
                setTimeout(function() {
                  canFireHover = true;
                  lastHoveredItem = null;
                }, 400);
              }
            }
          }
        }).on("mouseleave", function() {
          //We handle hover events here to simplify the animation events for older browsers
          $(this_menu).find('.hover').removeClass('hover');
        });

        $(this_menu).find(".items > li, .dropdown > li, .megamenu li, .item_holder > *, .item_holder").on("click mouseover", function(e) {
          e.stopPropagation();
          enteredMenu = true;
        });
      });
    }
  });
})(jQuery);
