;(function($) {
    "use strict";

    var STR_REPLACE_REG = /<%=\s*(\w+)\s*%>/g;

    function isUndefined(target) {
        return typeof target === "undefined";
    }

    function replace(str, value) {
        return str.replace(STR_REPLACE_REG, function(match, key) {
            return value[key];
        });
    }

    function RangePicker(container, options) {
        if (isUndefined(options.startValue) || isUndefined(options.endValue)) {
            throw new Error("startValue and endValue is need");
        }

        if(isUndefined(options.translateSelectLabel)) {
            throw new Error(" RangePicker: translateSelectLabel is need");
        }
        this.__init(container, options);
    }

    RangePicker.prototype = {
        constructor: RangePicker,
        __defaultOptions: {
            type: "single",
            getSelectValue: $.loop
        },
        __template: "<div class='range-picker-wrapper'>" +
                      "<div class='range-picker'>" +
                        "<span class='label range-label'><%= startValue %></span>" +
                        "<span class='label range-label end-label'><%= endValue %></span>" +
                      "</div>" +
                    "</div>",
        __init: function(container, options) {
            this.__options = $.extend({}, this.__defaultOptions, options);
            this.__$containerElement = container;
            this.__render();
            this.__$datepickerElement = this.__$containerElement.find(".range-picker");
            this.__addWidget();
        },

        __render: function() {
            var templateValue = {
                startValue: this.__options.startValue,
                endValue: this.__options.endValue
            },
            viewStr = replace(this.__template, templateValue);
            this.__$containerElement.html(viewStr);
        },

        __addWidget: function() {
            this.__rightSelectLabel = new Label({
                positionChange: $.proxy(this.__handleLabelPositionChange, this),
                totalWidth: this.__$datepickerElement.width()
            });
            this.__processBar = new ProcessBar();

            this.__$datepickerElement.append(this.__rightSelectLabel.getJQueryElement());
            this.__$datepickerElement.append(this.__processBar.getJQueryElement());
            this.__setWidgetInitialValue();
        },

        __setWidgetInitialValue: function() {
            var distance = this.__$datepickerElement.width() / 2;
            this.__updateView(distance);
            this.__rightSelectLabel.updatePosition({
                left: distance - this.__rightSelectLabel.getJQueryElement().width() /2
            });

        },

        __handleLabelPositionChange: function(position) {
            this.__updateView(position.left);
        },

        __updateView: function(distance) {
            this.__processBar.updatePosition({
                width: distance
            });

            var labelText = this.__options.translateSelectLabel(distance,
                                                               this.__$datepickerElement.width());
            this.__rightSelectLabel.render(labelText);
        },

        getSelectValue: function() {
            var rightLabelPosition = this.__rightSelectLabel.getArrowPosition();

            return {
                endValue: rightLabelPosition.left,
                totalWidth: this.__$datepickerElement.width()
            };
        }
    };

    function Label(options) {
        this.__init(options);
    }

    Label.prototype = {
        constructor: Label,
        __defaultOptions: {
            positionChange: $.loop,
            initValue: "",
            totalWidth: 0
        },
        __template: "<span class='label select-label'></span>",

        __init: function(options) {
            this.__options = $.extend({}, this.__defaultOptions, options);
            this.__$element = $(this.__template);
            this.render(this.__options.initValue);
            this.__bindDragEventHandler();
        },

        render: function(textValue) {
            this.__$element.text(textValue);
        },

        __bindDragEventHandler: function() {
            var self = this;

            this.__$element.on("mousedown", function(event) {
                this.__rangepicker = {
                    isMouseDown: true,
                    mouseStartX: event.clientX,
                    previousMoveDistance: 0
                };
            }).on("mouseup", function() {
                this.__rangepicker = null;
            }).on("mousemove", function(event) {
                if (this.__rangepicker && this.__rangepicker.isMouseDown) {
                    self.__handleDragEvent(event.clientX, this.__rangepicker);
                }
            }).on("mouseout", function() {
                this.__rangepicker = null;
            });
        },

        __handleDragEvent: function(clientX, elementData) {
            var distance = clientX - elementData.mouseStartX - elementData.previousMoveDistance;
            elementData.previousMoveDistance = clientX - elementData.mouseStartX;
            var leftPosition = this.__calculatePosition(distance);
            this.updatePosition({
                left: leftPosition
            });

            // 获取游标下面箭头的位置,并传递给回调函数
            this.__options.positionChange(this.getArrowPosition(), this.__$element);

        },

        __calculatePosition: function(offset) {
            var leftPosition = this.__$element.position().left,
                halfWidth = this.__$element.width() / 2,
                newLeftPosition = leftPosition + offset;

            if (newLeftPosition + halfWidth > this.__options.totalWidth) {
                newLeftPosition = this.__options.totalWidth - halfWidth;
            } else if (newLeftPosition + halfWidth < 0) {
                newLeftPosition = -halfWidth;
            }

            return newLeftPosition;
        },

        updatePosition: function(position) {
            for(var key in position) {
                if (position.hasOwnProperty(key)) {
                    this.__$element.css(key, position[key] + "px");
                }
            }
        },

        getJQueryElement: function() {
            return this.__$element;
        },

        getArrowPosition: function() {
            var elementPosition = this.__$element.position(),
                arrowPosition = {
                    left: elementPosition.left + this.__$element.width() / 2, // 需要加上半个游标的宽度
                    top: 0
                };

            return arrowPosition;
        }
    };

    function ProcessBar(options) {
        this.__init(options);
    }
    ProcessBar.prototype = {
        constructor: ProcessBar,
        __template: "<span class='process'></span>",
        __init: function() {
            this.__$element = $(this.__template);
        },

        updatePosition: function(position) {
            for(var key in position) {
                if (position.hasOwnProperty(key)) {
                    this.__$element.css(key, position[key] + "px");
                }
            }
        },

        getJQueryElement: function() {
            return this.__$element;
        }
    };

    $.fn.rangepicker = function(options) {
        return new RangePicker(this, options);
    };
}($));
