Selectron 2: <span class="subtitle">Lightweight `<select>` Enhancement</span>
=============================================================================

Features and Whatnot
--------------------

Selectron 2 is a `select` enhancement JQuery plugin. I call it "enhancement" instead of "replacement" because it's not really *replacing* so much as "looking sharp and taking all the credit, while the original `select` toils on, thanklessly, IN THE SHADOWS." Anyway, here's Selectron 2's whole deal:

-   **Small and Light**: 6KB or so minified (before gzip). Selectron is lazy: it leaves the heavy lifting to the original `select`, and basically acts as a proxy between the `select` and the user. The styles used in the demo compress down to &lt;2KB.
-   **Accessible**: All keyboard controls maintained, including/especially tabbing and tab order.
-   **CMS-friendly**: Just add a `data-selectron` attribute, and you're done (optionally passing in any settings) to any `select` with a name.
-   **Stylish**: Each Selectron dropdown contains enough elements to apply plenty of CSS. And if you need any to be a unique snowflake, one of the settings is "(css) classes". Also, each option item's text can be upgraded to full HTML via a `data-label` attribute.
-   **Accommodating**: Use JS to Selectron every select everywhere, or every `select` inside a given element. Or do it on a per-`select` basis with JS or HTML. You can pass in custom settings either way, and you can even overwrite the first settings with new ones.

Just to be up front about everything, there are a couple features that Selectron **does not support** right now:

-   Option Groups
-   Multi-select

### A Note on Tablets and Phones

It *should* work on mobile exactly as on the desktop (just... touchier). At first I tried to detect mobile and act as a fancy faceplate that triggered the native `select` interface, but I've abandoned that approach. I think it's fine the way it is now, but I also think you could get that behavior without too much work.

Style
-----

The selectron.css file includes both critical core styles that are only to be changed *at your peril*, and "theme" styles that are purely cosmetic. Additional styles can be applied, as mentioned earlier, by adding a class to one or more selectrons, like so:

    <select data-selectron='{"classes": "fancyClass anotherClass"}' name="a_name">

Behavior
--------

### `select` vs. Selectron

Most `select` behavior is reliable, but there are exceptions. Selectron (largely) normalizes existing `select` behavior. Here are some variations among native implementations that I've noticed in the Windows ecosystem:

-   **Firefox: Double-click option menu toggle**. In Firefox (at least as of Firefox 38), a single click will always show the option lits. A double-click is required to hide the options menu. All others toggle on a single click. In Developer Edition (40), this behavior is absent... but the option menu doesn't look right, so it may not be intentional or permanent.
-   **Chrome: Enter key toggles option menu**. IE & Firefox will never open the menu when enter is pressed, only close it.
-   **IE, Firefox, Chrome: Option mouse hover is handled differently**.
    -   In Firefox & Chrome, the hovered-over option appears to become the selected item. If you press Enter or Tab in either browser, that item becomes selected.
    -   In Firefox, pressing Tab also causes focus to leave for the next tab-able element on the page. In Chrome, pressing Tab doesn't cause focus to change unless the menu is closed.
    -   In IE, there's a separate "hover" state visible, and the only way to change options with the keyboard is the arrow keys: Enter, Tab, and Escape all close the dropdown without changing anything, and if Tab was pressed, focus goes to the next tab-able element.

For the first two above, Selectron follows the majority. In the third (weirdly disparate) case, it behaves identically to IE. Generally, it tries to do the expected thing. However...

### Deviations from the norm

There are a couple cases where it deviates from any known native `select` implementation:

-   **Menu never expands upwards, or (more obviously) outside the browser**. All browsers seem to have the same logic to show `select` menus: "Go downwards unless you hit the bottom of the usable screen (even if it goes outside the browser). Otherwise, go upwards".
-   **Menu doesn't hide upon scrolling**. Sometimes the Selectron menu causes downward scrolling. Due to chunkier-than-native styling, this happens even quicker than it would otherwise.

### Animation

In the first go-around, Selectron had highly configurable JQuery-powered animations built in. This made things very slidey, even down to IE6, but was extremely fat. Now that IE10+ is an acceptable baseline for full featureset, we can rely on CSS3 transitions for these animations if necessary. These demos here only animate the little indicator arrow, but you get the gist.

History
-------

### Selectron, The Elder

The first incarnation of Selectron was born from requirements: no compromise on style or accessibility. I couldn't find a `select` replacement that fit the bill, so I wrote my own with a few core principles:

-   **Let the Original `select` Do Its Thing**: All the existing `select` replacements I could find reinvented the entire `select` wheel in JavaScript... poorly. I realized full accessibility was only possible if the original element stayed in the mix, and as a bonus performance was great. It's the Selectron Secret Sauce.
-   **Provide many paths to Selectronification**: No `select` is touched without express intent, which can be done a few different ways:
    -   HTML: `data-selectron` attribute
    -   JS
        -   Target a `select` directly.
        -   Target an container element that has one or more `select`s anywhere inside it, no matter how deep.
        -   Update any existing Selectron(s) with new, custom settings
-   **Use HTML5 data-\* attributes for maximum robustitude**: Any `select` with the `data-selectron` attribute will be gussied-up when the plugin loads, no extra JS hooks required. You can also pass settings via the attribute:

        data-selectron='{"settingName": "value"}'

    Additionally, you can upgrade any option text to HTML by putting it in a `data-label` attribute.

-   **Do As Little Work As Possible**: It was a conscious goal to be low-impact. For instance, only a small handful of event handlers are created, no matter how many Selectrons are on a page. The original did pretty well, but JQuery animations, IE7+ support, and my own JS limitations at the time hobbled it to a degree.

### Second Round: Divergence from the Progenitor

Selectron 2 is a lean, trimmed-down successor to the first Selectron. So what has changed? Short version: it's faster and ditches some unused and bloated features.

-   **Ditched JQuery animations**: CSS transitions should suffice for a damn dropdown.
-   **Ditched support for crusty old browsers**: Specifically, IE8 and earlier. Still, Selectron detects if there's an unsupported JS feature (Object.create()) and bails without ruining anything.
-   **Complete code overhaul**: cleaner code, faster performance, and a few bonuses:
    -   **JQuery version requirement dropped to 1.7.0**... somehow in the process.
    -   Removed an unused, ill-advised, oddball setting that relied on a global variable
    -   Ditched settable HTML `style`. Classes are just fine.
    -   Much better code in general, thanks to leveling up at JS/programming.

### Selectron V2.0.0 Release Notes

Here's a more detailed list of what's changed since Selectron, The Elder:

-   **EXTERNAL-FACING changes**
    -   Removed all animation bits, including --showing and --hiding
    -   Removed ability for user to apply styles to selectron and list directly. use a class.
    -   JQuery requirement lowered to 1.7.0
    -   fixed: initial faceplate generation was bad, especially with misplaced indicator span and weird spaghetti logic
    -   fixed: added "overrideMetadata" argument to override HTML-based settings
        -   previously, 'data-selectron'-based settings trampled any conflicting JS-based settings, with no recourse
    -   Removed horrible hack using global variable to disable data-\* attribute-based activation
        -   this does mean that every select with a 'data-selectron' attribute will be activated no matter what
-   Other changes
    -   REMOVED $(selectElement).data("selectronConfig")
        -   replaced all references with 'this.settings' or 'selectronObject.settings'
    -   ADDED $(select).data("selectronObject") and $(div.selectron).data("selectronObject")
    -   Split off SelectronEvents as its own object (prototype === Selectron) for clarity
    -   annihilated most of original plugin boilerplate
    -   Changed Selectron = function(el, settings){...} to Selectron = {...}
    -   Nuked Selectron.prototype = {...} and wrapped original object over all properties
    -   Moved all "constructor" code from Selectron function to Selectron.init(el, settings)
    -   Switched from 'new Selectron' "instantiation" to return Object.create(Selectron).init(el, opts)
    -   Pulled duplicate create/update blocks into a separate function
    -   Named selectron property functions for easier debugging compared to anonymous
    -   Renamed some functions & parameter names to be more readable and/or explicit
    -   keepFocus renamed to focusSelect and now requires one argument: selectronObject
    -   Events now responsible for ensuring handler has context
    -   Event Hander "handle()" split into handleSelectronClick, handleGlobalClick, handleSelectInteraction, and reflectSelectStatus
    -   Removed reliance on .selectron\_\_selected where inappopriate
    -   Changed all references to "options" to "settings", because it's confusing where each select "item" is actually an "option" element
    -   Consolidated all input source detection around eventSource()
    -   Migrated option list items totally to selectronObject via optionItems
    -   Much cleanup and misc. minor fixes

The FUTURE
----------

### New Stuff

There are a few things I'd like to upgrade Selectron with, while maintaining its svelte figure:

-   Features
    -   Support Option Groups
    -   Support multi-select
-   Usability and Customizability
    -   Optional scrolling menu, with a settable number of options to show
    -   Different widths for faceplate and menu
-   Additional refactoring - There some pattern-like things that I'm not 100% sure about.
-   Grown-up tooling. Stuff like a build process, with testing, a CSS Pre-processor, and automatic minification. Also, just... any way of writing things like this readme/demo other than HTML by hand like it's 2005.

I'd also love to know any other functionality people would be interested in!

### Beyond JQuery

I currently use JQuery not just as an extension point, but for a non-trivial amount of functionality:

-   Events
-   Selectors
-   Utility functions like `extend()`, `each()`, and `map()`
-   Misc. DOM interactions (e.g. `$(element).insertAfter()`)

That said, JQuery is (thankfully!) increasingly unnecessary in the modern web. However, `select` dropdowns still f\*ing suck somehow, so I think Selectron would do well to be adapted to a few other places, for instance:

-   Web Components/Polymer.js
-   React
-   Angular

I don't have the time for any of this stuff right now, but Selectron has been kind of a zen garden/bonzai tree for me since I first made it in 2012, so I'm sure we'll see some of that come to pass... sometime :V