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
            type: "single"
        },
        __template: "<div class='range-picker-wrapper'>" +
                      "<div class='range-picker'>" +
                        "<span class='not-select-process'></span>" +
                        "<span class='label range-label'><%= startValue %></span>" +
                        "<span class='label range-label end-label'><%= endValue %></span>" +
                      "</div>" +
                    "</div>",
        __init: function(container, options) {
            this.__options = $.extend({}, this.__defaultOptions, options);
            this.__$containerElement = container;
            this.__render();
            this.__$rangepickerElement = this.__$containerElement.find(".range-picker");
            this.__addWidget();
            this.__setContainerToWrapperWidget();
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
            var positionChangeCallback = $.proxy(this.__handleLabelPositionChange, this);

            this.__selectCursors = [];
            this.__selectCursors.push(new Cursor({
                positionChange: positionChangeCallback,
                totalWidth: this.__$rangepickerElement.width()
            }));
            // 如果类型是 double 则添加两个游标
            if (this.__options.type === "double") {
                this.__selectCursors.push(new Cursor({
                    positionChange: positionChangeCallback,
                    totalWidth: this.__$rangepickerElement.width()
                }));
            }
            this.__processBar = new ProcessBar();

            this.__$rangepickerElement.append(this.__processBar.getJQueryElement());
            for(var i = 0; i < this.__selectCursors.length; i++) {
                this.__$rangepickerElement.append(this.__selectCursors[i].getJQueryElement());
            }
            this.__setWidgetInitialValue();
        },

        __setWidgetInitialValue: function() {
            var totalWidth = this.__$rangepickerElement.width();

            // 游标位置需要偏移半个游标的宽度, 所以先设置游标的文本,才能计算游标的位置
            this.__selectCursors[0].render(
                this.__options.translateSelectLabel(totalWidth, totalWidth)
            );

            if (!isUndefined(this.__selectCursors[1])) {
                this.__selectCursors[1].render(
                    this.__options.translateSelectLabel(0, totalWidth)
                );
            }

            // 设置游标的位置
            this.__selectCursors[0].updatePosition({
                left: totalWidth - this.__selectCursors[0].getJQueryElement().outerWidth() / 2
            });
            if (!isUndefined(this.__selectCursors[1])) {
                this.__selectCursors[1].updatePosition({
                    left: -this.__selectCursors[1].getJQueryElement().outerWidth() / 2
                });
            }

            this.__updateProcessBarView();
        },

        __setContainerToWrapperWidget: function() {
            // 添加容器的 paddint-top 以包含游标
            var wrapperElement = this.__$containerElement.find(".range-picker-wrapper"),
                cursorHeight = -(this.__selectCursors[0].getJQueryElement().position().top);
            if (!isUndefined(this.__selectCursors[1]) &&
                -(this.__selectCursors[1].getJQueryElement().position().top) > cursorHeight) {
                cursorHeight = -(this.__selectCursors[1].getJQueryElement().position().top);
            }
            wrapperElement.css("paddingTop", cursorHeight + "px");
        },

        __handleLabelPositionChange: function(position) {
            this.__updateView(position.left);
        },

        __updateView: function() {
            this.__updateCursorView();
            this.__updateProcessBarView();
        },

        __updateCursorView: function() {
            var i = 0,
                labelText = "",
                position = null;

            for(; i < this.__selectCursors.length; i++) {
                position = this.__selectCursors[i].getArrowPosition();
                labelText = this.__options.translateSelectLabel(position.left,
                        this.__$rangepickerElement.width());
                this.__selectCursors[i].render(labelText);
            }

        },

        __updateProcessBarView: function() {
            var cursorPosition = this.__getCursorPosition(),
                processBarPosition = {
                    left: cursorPosition.start,
                    right: this.__$rangepickerElement.width() - cursorPosition.end
                };
            this.__processBar.updatePosition(processBarPosition);
        },

        __getCursorPosition: function() {
            var position = {
                start: 0,
                startLabel: ""
            },
            tmpPosition = this.__selectCursors[0].getArrowPosition();

            // 先将第一个游标设置为结束位置
            position.end = tmpPosition.left;
            position.endLabel = tmpPosition.positionLabel;

            if (!isUndefined(this.__selectCursors[1])) {
                tmpPosition = this.__selectCursors[1].getArrowPosition();
                // 当存在第二个光标时且第二个光标距离更远,将第二个光标设置为结束位置,否则第二个光标设置为起始位置
                if (tmpPosition.left > position.end) {
                        position.start = position.end;
                        position.startLabel = position.endLabel;
                        position.end = tmpPosition.left;
                        position.endLabel = tmpPosition.positionLabel;
                } else {
                    position.start = tmpPosition.left;
                    position.startLabel = tmpPosition.positionLabel;
                }
            }

            return position;
        },

        getSelectValue: function() {
            var position = this.__getCursorPosition();
            position.totalWidth = this.__$rangepickerElement.width();

            return position;
        }
    };

    function Cursor(options) {
        this.__init(options);
    }

    Cursor.prototype = {
        constructor: Cursor,
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
                // 增加 z-index 的值,避免两个游标时被另一个游标遮挡
                $(this).css("zIndex", 1000);
            }).on("mouseup", function() {
                this.__rangepicker = null;
                $(this).css("zIndex", 0);
            }).on("mousemove", function(event) {
                if (this.__rangepicker && this.__rangepicker.isMouseDown) {
                    self.__handleDragEvent(event.clientX, this.__rangepicker);
                }
            }).on("mouseout", function() {
                $(this).css("zIndex", 0);
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
                halfWidth = this.__$element.outerWidth() / 2,
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
                    left: elementPosition.left + this.__$element.outerWidth() / 2, // 需要加上半个游标的宽度
                    positionLabel: this.__$element.text()
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
