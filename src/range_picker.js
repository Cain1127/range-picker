;(function($) {
    "use strict";

    function isUndefined(target) {
        return Object.prototype.toString.call(target) === "[object Undefined]";
    }

    function RangePicker(container, options) {
        if (isUndefined(options.startValue) || isUndefined(options.endValue)) {
            throw new Error("startValue and endValue is need");
        }

        if(isUndefined(options.translateSelectLabel)) {
            throw new Error(" RangePicker: translateSelectLabel is need");
        }

        this.__init(container, $.extend({}, this.__defaultOptions, options));
        return this;
    }

    RangePicker.prototype = {
        constructor: RangePicker,
        __defaultOptions: {
            type: "single",
            changeListener: $.loop,
            getSelectValueCallback: $.loop
        },

        __template:  "<div class='range-picker-wrapper'>" +
                        "<div class='range-picker'>" +
                          "<span class='label range-label'><%= startValue%></span>" +
                          "<span class='process'></span>" +
                          "<span class='label select-label' data-position='left'></span>" +
                          "<span class='label select-label' data-position='right'></span>" +
                          "<span class='label range-label end-label'><%= endValue %></span>" +
                        "</div>" +
                    "</div>",

        templateReplaceReg: /<%=\s*(\w+)\s*%>/g,

        compileTemFn: function(template, value) {
            return template.replace(this.templateReplaceReg, function(match, key) {
                return value[key];
            });
        },

        __init: function(containerElement, options) {
            this.__containerElement = containerElement;
            this.__options = options;
            this.__render();
            this.__cacheElementValue();
            this.__updateSelectLabelText(this.__rightSelectLabel, 0);
            this.__updateView();
            this.__bindEventHandler();
            //this.__updateCursorWidget();
        },

        __render: function() {
            var templateValue = {
                startValue: this.__options.startValue,
                endValue: this.__options.endValue
            },
            viewStr = this.compileTemFn(this.__template, templateValue);

            this.__containerElement.html(viewStr);
            // 移除起始的游标
            if (this.__options.type === "single") {
                this.__containerElement.find(".select-label[data-position='left']").remove();
            }
        },

        __cacheElementValue: function() {
            this.__totalWidth = this.__containerElement.find(".range-picker-wrapper").width();
            this.__rightSelectLabel = this.__containerElement.find(".select-label[data-position='right']");
            this.__activeProcessElement = this.__containerElement.find(".process");
        },

        __setWrapperPadding: function() {
            // 使 div 元素能够包含信绝对定位的 label
            var labelHeight = this.__containerElement.find(".label").position().top;
            this.__containerElement.find(".range-picker-wrapper").css({
                paddingTop: -labelHeight + "px",
            });
        },

        __updateView: function() {
            var rightPosition = this.__rightSelectLabel.position().left,
                rightOffset = this.__totalWidth - rightPosition - this.__rightSelectLabel.width() / 2;
            this.__updateActiveProcessPosition("right", rightOffset);
            this.__updateSelectLabelText(this.__rightSelectLabel, rightOffset);
        },

        __updateSelectLabelText: function(targetLabel, position) {
            var textStr = this.__options.translateSelectLabel(position, this.__totalWidth);
            targetLabel.text(textStr);
        },

        __updateActiveProcessPosition: function(position, value) {
            this.__activeProcessElement.css(position, value + "px");
        },

        __updateRightSelectLabelPosition: function(offset) {
            var leftPosition = this.__rightSelectLabel.position().left,
                halfWidth = this.__rightSelectLabel.width() / 2,
                newLeftPosition = leftPosition + offset;
            if (newLeftPosition + halfWidth > this.__totalWidth) {
                newLeftPosition = this.__totalWidth - halfWidth;
            } else if (newLeftPosition + halfWidth < 0) {
                newLeftPosition = -halfWidth;
            }

            this.__rightSelectLabel.css("left", newLeftPosition + "px");
        },

        __bindEventHandler: function() {
            var self = this;
            this.__rightSelectLabel.on("mousedown", function(event)  {
                this.__isMouseDown = true;
                this.__mouseStartX = event.clientX;
                this.__previousOffset = 0;
            }).on("mouseup", function() {
                this.__isMouseDown = false;
            }).on("mousemove", function(event) {
                if (this.__isMouseDown) {
                    var distance = event.clientX - this.__mouseStartX - this.__previousOffset;
                    this.__previousOffset = event.clientX - this.__mouseStartX;
                    self.__updateRightSelectLabelPosition(distance);
                    self.__updateView();
                }
            }).on("mouseout", function() {
                this.__isMouseDown = false;
                this.__mouseStartX = 0;
                this.__previousOffset = 0;
            });
        },

        getSelectValue: function() {
            var rightLabelLeftPosition = this.__rightSelectLabel.position().left,
                leftOffset = rightLabelLeftPosition + this.__rightSelectLabel.width() / 2;
            this.__options.getSelectValueCallback(leftOffset, this.__totalWidth);
        }
    };

    $.fn.rangepicker = function(options) {
        return new RangePicker(this, options);
    };
}($));
