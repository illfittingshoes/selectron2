/*!
 * Selectron 2: Accessible, lightweight <select> replacement
 * @requires jQuery v1.7.0 or above
 *
 * https://github.com/illfittingshoes/selectron2
 *
 * Copyright (c) 2012-2015 Joe Shirley
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Version: 2.0.0
 */

/*
    Changed from Selectron, The Elder:
EXTERNAL-FACING changes
    - Removed all animation bits, including --showing and --hiding
    - Removed ability for user to apply styles to selectron and list directly. use a class.
    - JQuery requirement lowered to 1.7.0
    - fixed: initial faceplate generation was bad, especially with misplaced indicator span and weird spaghetti logic
    - fixed: added "overrideMetadata" argument to override HTML-based settings
        - previously, 'data-selectron'-based settings trampled any conflicting JS-based settings, with no recourse
    - Removed horrible hack using global variable to disable data-* attribute-based activation
        - this does mean that every select with a 'data-selectron' attribute will be activated no matter what

INTERNAL-ONLY changes
- * REMOVED $(selectElement).data("selectronConfig")
    - replaced all references with 'this.settings' or 'selectronObject.settings'
- * ADDED $(select).data("selectronObject") and $(div.selectron).data("selectronObject")
- * Split off SelectronEvents as its own object (prototype === Selectron) for clarity
- * annihilated most of original plugin boilerplate
- Changed Selectron = function(el, settings){...} to Selectron = {...}
- Nuked Selectron.prototype = {...} and wrapped original object over all properties
- Moved all "constructor" code from Selectron function to Selectron.init(el, settings)
- Switched from 'new Selectron' "instantiation" to return Object.create(Selectron).init(el, opts)
- Pulled duplicate create/update blocks into a separate function
- Named selectron property functions for easier debugging compared to anonymous
- Renamed some functions & parameter names to be more readable and/or explicit
- keepFocus renamed to focusSelect and now requires one argument: selectronObject
- Events now responsible for ensuring handler has context
- Event Hander "handle()" split into handleSelectronClick, handleGlobalClick, handleSelectInteraction, and reflectSelectStatus
- Removed reliance on .selectron__selected where inappopriate
- Changed all references to "options" to "settings", because it's confusing where each select "item" is actually an "option" element
- Consolidated all input source detection around eventSource()
- Migrated option list items totally to selectronObject via optionItems
- Much cleanup and misc. minor fixes

    TODO:
        - Improvements
            - Rename individual selectron elements for improved clarity. Perhaps 'selectronites'?
            - Further advantage of "this"
                - handleSelectInteraction change/keydown update could check state to save work when no change has happened
        - Known Bugs
            - Auto width can be insufficient
                - if selectron__selected__indicator takes up any space, and the widest option isn't selected at the time of selectron creation
                - workaround: add some padding to the right side of .selectron__selected
 */
;(function($, window, undefined) {
    "use strict";

    // quick & dirty object detection to fail out of IE8 silently
    var hasObjectCreate = (typeof Object.create === "function" ? true : false);
    Object.create = (typeof Object.create === "function" ? Object.create : function(object){return object;});

    /*
     * Selectron Object Properties
     * - selectElement
     * - selectOriginalSettings
     * - $selectronElement
     * - settings
     * - metadata
     * - labels
     * 
     * "this" selectron object accessible as data property of both original select
     * and selectron div
     */
    var Selectron =  {
        defaults: {
            "autoWidth": true,
            "inheritWidth": false,
            "inheritPosition": false,
            "classes": ""
        },

        // initialize new Selectron-linked object
        // depends on: nothing
        init: function init(selectElement, settings, overrideMetadata) {
            var $selectElement = $(selectElement);
            this.selectElement = selectElement;
            
            // "metadata" are any settings from data-selectron attribute
            // "overrideMetadata" flag ignores these to allow overriding
            this.metadata = $selectElement.data("selectron");
            this.settings = this.setSettings(settings, overrideMetadata);
            
            // make it happen!
            this.storeOptionItems();
            this.$selectronElement = this.generateSelectron();
            this.replaceSelectWithSelectron();

            // need to get at this new object from the outside for events
            $selectElement.data("selectronObject", this);
            this.$selectronElement.data("selectronObject", this);

            return this;
        },

        // depends on: TODO
        update: function update(settings, overrideMetadata) {
            this.settings = this.setSettings(settings, overrideMetadata);
            this.applyStyleSettings(this.$selectronElement);

            return this;
        },

        // depends on: TODO
        setSettings: function setSettings(settings, overrideMetadata) {
            return (!overrideMetadata ? 
                $.extend({}, this.defaults, settings, this.metadata) :
                $.extend({}, this.defaults, settings));
        },

        /*
         ********
         * Setup
         ********
         */
        
        // this.optionItems = [
        //  {
        //      element: [original option html element],
        //      label: [data-label html if avaialble, otherwise original option text]
        //  },...
        // ]
        // depends on: this.selectElement
        storeOptionItems: function storeOptionItems() {
            var self = this,
                $select = $(this.selectElement);

            self.optionItems = [];

            $select.children("option").each(function storeEachOption(index){
                var $option = $(this);

                self.optionItems[index] = {
                    element: this,
                    label: $option.attr("data-label") || $option.text()
                };
            });
        },
        
        // depends on: this.selectElement, this.optionItems
        generateSelectron: function generateSelectron() {
            var $select = $(this.selectElement),
                selectronHtml = "",
                listHtml = "",
                selectedIndex = $select[0].selectedIndex,
                selectedOptionLabel = this.optionItems[selectedIndex].label;

            // generate list html
            $.each(this.optionItems, function populateEachSelectronListItem(index) {
                var selected = index === selectedIndex,
                    classHtml = (selected) ?
                                    "selectron__li selectron__li--selected" :
                                    "selectron__li";

                // Option List Item HTML
                listHtml += "<li class=\"" + classHtml + "\" data-index=\"" + index + "\">" +
                        "<span class=\"selectron__li__inner\">" + this.label + "</span>" +
                    "</li>";
            });

            selectronHtml =
                "<div class=\"selectron\">" +
                    // faceplate
                    "<div class=\"selectron__selected\">" + 
                        "<div class=\"selectron__selected__inner\">" + 
                            selectedOptionLabel +
                            "<span class=\"selectron__selected__indicator\"></span>" +
                        "</div>" +
                    "</div>" +

                    // options list
                    "<div class=\"selectron__listWrapper\">" +
                        "<ul class=\"selectron__list\">" +
                            listHtml +
                        "</ul>" +
                    "</div>" +
                "</div>";

            return $(selectronHtml);
        },

        // depends on: this.selectElement, this.$selectronElement, this.applyStyleSettings()
        replaceSelectWithSelectron: function replaceSelectWithSelectron() {
            var $select = $(this.selectElement);

            this.applyStyleSettings(this.$selectronElement);

            // add Selectron to page
            this.$selectronElement.insertAfter($select);
            
            // hide original select
            $select.css({
                "position": "absolute",
                "left": "-9999em"
            });
        },

        // $selectron is passed because for new selectrons, applyStyleSettings is called before this.$selectronElement is set
        // depends on: this.selectElement, this.settings
        applyStyleSettings: function applyStyleSettings($selectron) {
            var $select = $(this.selectElement),
                selSettings = this.settings;

            function setAutoWidth() {
                var labelWidth = 0,
                    listWidth = 0,
                    borderLeft = 0,
                    borderRight = 0,
                    listBorderLeft = 0,
                    listBorderRight = 0,
                    $selClone = $selectron.clone().css("visibility", "hidden"),
                    $selCloneList = $selClone.find(".selectron__listWrapper");

                function letSelCloneGetSettled() {
                    listBorderLeft = parseInt($selCloneList.css("border-left-width"), 10);
                    listBorderRight = parseInt($selCloneList.css("border-right-width"), 10);
                    listWidth = $selCloneList.outerWidth();
                    
                    labelWidth = $selClone.find(".selectron__selected").outerWidth();
                    $selClone.remove();
                    $selectron.width((labelWidth > listWidth) ? labelWidth : listWidth);
                }

                $selClone.css("width", "auto");
                $selCloneList.css({"display": "block", "position": "static"});
                $selCloneList.find(".selectron__list").css({"display": "block", "position": "static"});
                $selClone.find("*").css("width", "auto");
                $selClone.insertAfter($select);

                //firefox requires setTimeout to build the clone and take its measurements
                return setTimeout(letSelCloneGetSettled, 0);
            }

            if (selSettings.classes.length > 0) {
                $selectron.addClass(selSettings.classes);
            }

            // inherit trumps inherited if both width settings are true
            // no need to manually set auto to false
            if (selSettings.inheritWidth) {
                $selectron.width($select.width());
            } else if (selSettings.autoWidth) {
                setAutoWidth();
            }
        }

    };

    var SelectronEvents = Object.create(Selectron);

    SelectronEvents.activate = function activate() {
        var self = this;

        // when selectron is clicked,
        // show/hide selectron list or change selected option
        $("html").on("mousedown.selectron mouseup.selectron click.selectron", ".selectron", function selectronClickEventCaptured(e) {
            // send event, .selectron element at hand
            self.handleSelectronClick(e, this);
        });

        // Reflect Selected Option Change
        $("html").on("focusout.selectron focusin.selectron change.selectron keydown.selectron", "select", function selectEventCaptured(e) {
            var selectronObject = $(e.target).data("selectronObject");
            // ignore any non-selectron selects
            if(selectronObject){
                if(e.type === "keydown") {
                    self.handleSelectInteraction(e, selectronObject);
                }

                self.reflectSelectStatus(e, selectronObject);
            }
        });

        // Whole Document - Escape & Tab Keys, clicks (non-selectrons will be filtered out)
        $("html").on("mousedown.selectron", function globalClickEventCaptured(e) {
            self.handleGlobalClick(e);
        });
    };

    /**************
     * Show & Hide
     **************/
    // show one selectron dropdown list
    // the list passed must not be shown or being shown
    SelectronEvents.showList = function showList($curSelectron) {
        $curSelectron.addClass("selectron--shown");
    };

    // hide one or all selectron dropdown lists
    // @curSelectron = .selectron element (optional)
    SelectronEvents.hideLists = function hideLists(curSelectron) {
        var curSelectrons = curSelectron || ".selectron--shown";
        
        $(curSelectrons).removeClass("selectron--shown");
    };

        // Maintain focus on original select for accessibility/keyboard controls/state
    SelectronEvents.focusSelect = function focusSelect(selectronObject) {
            var $origSelect = $(selectronObject.selectElement);

            // only force focus if focus was lost
            if (!$(document.activeElement).is($origSelect)) {
                $origSelect[0].focus();
            }
    };

    SelectronEvents.getEventSource = function getEventSource(e) {
        var eventSource = "",
            whichKey = e.which;

        switch(whichKey) {
            case 1:
                eventSource = "leftMouse";
                break;
            case 9:
                eventSource = "tabKey";
                break;
            case 13:
                eventSource = "enterKey";
                break;
            case 27:
                eventSource = "escapeKey";
                break;
        }

        return eventSource;
    };

    /*
     * Event handlers
     */
    SelectronEvents.handleSelectronClick = function handleSelectronClick(e, owningSelectron) {
        var self = this,
            eventType = e.type,
            eventSource = self.getEventSource(e),
            $clickedEl = $(e.target),
            $owningSelectron = $(owningSelectron),
            targetIsListItem = ($clickedEl.is(".selectron__li") || $clickedEl.parents(".selectron__li").length > 0 ? true : false),
            selectronObject = $owningSelectron.data("selectronObject"),
            $listItem,
            $origSelect;

        if (eventSource === "leftMouse") {
            e.stopPropagation();
            e.preventDefault();

            // Show or hide list when mousedown'd on a non-list-item selectron element
            if (eventType === "mousedown") {
                // Refocus on original <select> when clicking on selectron, if necessary
                self.focusSelect(selectronObject);

                if(!targetIsListItem) {
                    // hide all other selectrons
                    self.hideLists($(".selectron").not(owningSelectron));

                    // toggle targeted list
                    if ($owningSelectron.is(".selectron--shown")) {
                        self.hideLists($owningSelectron[0]);
                    } else {
                        self.showList($owningSelectron);
                    }
                }
            
            // Change Selected Option when list item is mouseup'd
            } else if (eventType === "mouseup") {
                if (targetIsListItem) {
                    $origSelect = $(selectronObject.selectElement);
                    $listItem = ($clickedEl.is(".selectron__li") ? $clickedEl : $clickedEl.parents(".selectron__li"));

                    // change actual selected option
                    $origSelect.prop("selectedIndex", $listItem.attr("data-index"));
                    $origSelect.trigger("change");

                    // close Selectron list
                    self.hideLists($owningSelectron[0]);
                }
            } // 'click' event goes mostly unhandled, we just wanted to preventDefault() and stopPropagation()
        }
    };

    // Close any open Selectrons if left-clicked elsewhere
    SelectronEvents.handleGlobalClick = function handleGlobalClick(e) {
        var eventSource = this.getEventSource(e),
            $el = $(e.target);

        if(eventSource === "leftMouse") {
            // If no Selectron was clicked, close all selectrons
            if (!$el.is(".selectron") && $el.parents(".selectron").length < 1) {                
                this.hideLists();
            }
        }
    };

    SelectronEvents.handleSelectInteraction = function handleSelectInteraction(e, selectronObject) {
        var eventSource = this.getEventSource(e);

        if (eventSource === "tabKey" ||
                eventSource === "escapeKey" ||
                eventSource === "enterKey") {
            this.hideLists(selectronObject.$selectronElement[0]);
        }
    };

    // Update the Selectron display to reflect underlying <select> status
    SelectronEvents.reflectSelectStatus = function reflectSelectStatus(e, selectronObject) {
        var el = selectronObject.selectElement,
            $curSelectron = selectronObject.$selectronElement,
            eventSource = this.getEventSource(e),
            self = this,
            selectedHtml = "",
            selectedIndex;
        
        // Natural event - Focus In
        if (e.type === "focusin") {
            $curSelectron.addClass("selectron--focused");
        
        // Natural event - Focus Out
        } else if (e.type === "focusout") {
            $curSelectron.removeClass("selectron--focused");

        // Change event can be natural or triggered
        // Also update on keystrokes because change event doesn't fire often enough
        } else if (e.type === "change" || e.type === "keydown") {
            selectedIndex = $(el).prop("selectedIndex");
            
            // setTimeout 0 to wait till end of current browser loop queue - for firefox
            setTimeout(function() {
                var $el = $(el);
                selectedIndex = $el.prop("selectedIndex");
                selectedHtml = selectronObject.optionItems[selectedIndex].label;
                $curSelectron.find(".selectron__selected").html(selectedHtml + "<span class=\"selectron__selected__indicator\"></span>");
                $curSelectron.find("li").removeClass("selectron__li--selected").parent()
                    .find("[data-index=" + selectedIndex + "]")
                    .addClass("selectron__li--selected");
            }, 0);
        }
    };

    if(hasObjectCreate) {
        $.fn.selectron = function selectron(settings, overrideMetadata) {
            var matchedElementSet = this;

            function createOrUpdateSelectron(selectElement, settings, overrideMetadata) {
                var $el = $(selectElement),
                    selectronObject = $(selectElement).data("selectronObject");

                if (!selectronObject) {
                    return Object.create(Selectron).init(selectElement, settings);
                } else {
                    return selectronObject.update(settings, overrideMetadata);
                }
            }

            return matchedElementSet.each(function processEachMatchedElement() {
                var matchedElement = this,
                    $el = $(matchedElement);

                // element is select
                if ($el.is("select")) {
                    createOrUpdateSelectron(this, settings);
                
                // element not select, but contains one or more selects
                } else if ($el.find("select").length > 0) {
                    $el.find("select").each(function ActOnEachMatchedSelect() {
                        createOrUpdateSelectron(this, settings);
                    });
                }
            });
        };

        $(function() {
            SelectronEvents.activate();
            $("select[data-selectron]").selectron();
        });
    } else {
        // IE8 or otherwise unsupported browser
        $.fn.selectron = function selectron() {};
    }
})(jQuery, window);