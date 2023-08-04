<p align="center">
  <img src="https://www.jamiebalfour.scot/projects/wisp/balfbar/BalfBar.png" alt="BalfBar Logo" width="300">
</p>
BalfBar is used on several websites that I build and maintain. It's free to download from my website (https://www.jamiebalfour.scot/projects/wisp/balfbar/), but I have opted instead to host it in on GitHub.

I have created a JSON menu builder that builds the HTML from a JSON file, this makes it easier to keep the menu organised. There are examples on my website.

To use BalfBar, insert the HTML into the page, ensure you have the jQuery library, link the JavaScript (preferably in the `<head>` or at the very end of the page) and wait for the page to load before running `$(".balfbar").BalfBar();`. 

There are several options available:
- **desktopFixedMenuStart** : used to decide when to apply the `fixed_menu` class to the menu when in *desktop mode*.
- **mobileFixedMenuStart** : used to decide when to apply the `fixed_menu` class to the menu when in *mobile mode*.
- **supportHover** : if set to false, users will need to click on items in the menu to open them
- **hideOnScroll** : if the menu has any open dropdowns and the user scrolls, those dropdowns will be closed
- **hideOnMouseOut** : hides the menu when the user clicks or moves the mouse elsewhere on the page
- **mobileThreshold** : the threshold between the mobile and desktop interfaces
- **menuAnimationTime** : the time taken for the animation to complete for the menu to open
- **menuToggleCallback** : an optional callback function that fires when the menu is opened (e.g. on mobile)
- **fixedMenuCallback** : an optional callback function that fires when the `fixed_menu` class is applied to the menu
