;(function() {
    "use strict";

    function dateFormat(date, fmt) {
        var o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
        };
        if (/(y+)/.test(fmt)){
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)){
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }

    var startDate = new Date("2013/11/12"),
        endDate = new Date("2013/12/22"),
        offset = endDate - startDate;

    $("#date_range").rangepicker({
        startValue: dateFormat(startDate, "yyyy/MM/dd"),
        endValue: dateFormat(endDate, "yyyy/MM/dd"),
        translateSelectLabel: function(currentPosition, totalPosition) {
            var timeOffset = offset * ( currentPosition / totalPosition);
            var date = new Date(+startDate + parseInt(timeOffset));
            return dateFormat(date, "yyyy/MM/dd");
        }
    });

    $("#double_date_range").rangepicker({
        type: "double",
        startValue: dateFormat(startDate, "yyyy/MM/dd"),
        endValue: dateFormat(endDate, "yyyy/MM/dd"),
        translateSelectLabel: function(currentPosition, totalPosition) {
            var timeOffset = offset * ( currentPosition / totalPosition);
            var date = new Date(+startDate + parseInt(timeOffset));
            return dateFormat(date, "yyyy/MM/dd");
        }
    });

    $("#number_range").rangepicker({
        startValue: 0,
        endValue: 100,
        translateSelectLabel: function(currentPosition, totalPosition) {
            return parseInt(100 * (currentPosition / totalPosition));
        }
    });

    $("#double_number_range").rangepicker({
        type: "double",
        startValue: 0,
        endValue: 100,
        translateSelectLabel: function(currentPosition, totalPosition) {
            return parseInt(100 * (currentPosition / totalPosition));
        }
    });
}());
