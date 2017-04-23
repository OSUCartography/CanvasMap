/*globals Map, Layer, Graticule, $, SineSeries, createMap*/

var map;

function getMapScale(map) {
    "use strict";
    //return 300;
    var K = 0.9, s = Math.min(map.getMaximumVerticalScale(), map.getMaximumHorizontalScale());
    if (isNaN(s) || s > map.getCanvas().width || s < 5) {
        s = 0.5 * map.getCanvas().width / (2 * Math.PI);
    }
    return s * K;
}

function writeSliderValues(p, q) {
    "use strict";
    $("#pSliderText").text(p);
    $("#qSliderText").text(q);
}

function mouseEventHandler(e) {
    "use strict";

    var mouseMove, mouseUp, prevMouse;

    prevMouse = {
        x: e.clientX,
        y: e.clientY
    };

    mouseMove = function (e) {
        var unitsPerPixel, lon0, dx = e.clientX - prevMouse.x;

        unitsPerPixel = 1 / getMapScale(map);
        lon0 = map.getCentralLongitude();
        lon0 -= dx * unitsPerPixel;

        map.setCentralLongitude(lon0);

        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
        e.preventDefault();
    };

    mouseUp = function (e) {
        document.body.style.cursor = null;
        document.removeEventListener('mousemove', mouseMove, false);
        document.removeEventListener('mouseup', mouseUp, false);
    };

    document.body.style.cursor = 'move';
    document.addEventListener('mousemove', mouseMove, false);
    document.addEventListener('mouseup', mouseUp, false);
}

function initSliders(p, q) {
    "use strict";

    $(function () {

        function sliderAction() {
            var sp = $("#pSlider").slider("option", "value"),
                    sq = $("#qSlider").slider("option", "value");
            writeSliderValues(sp, sq);
            map.getProjection().setP(sp);
            map.getProjection().setQ(sq);
            adjustMapSize();
            map.render();
        }

        function pAction(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#pSlider").slider('value', ui.value);
            sliderAction();
        }

        function qAction(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#qSlider").slider('value', ui.value);
            sliderAction();
        }

        // create the sliders
        $("#pSlider").slider({
            orientation: "horizontal",
            range: "min",
            min: 1,
            max: 3,
            value: p,
            step: 0.01,
            slide: pAction
        });

        $("#qSlider").slider({
            orientation: "horizontal",
            range: "min",
            min: 1,
            max: 3,
            value: q,
            step: 0.005,
            slide: qAction
        });

        writeSliderValues(p, q);
        map.getProjection().setP(p);
        map.getProjection().setQ(q);
    });
}

function adjustMapSize() {
    var mapHeight = $(window).outerHeight(true) - $("#guiControlsContainer").outerHeight(true) - $("#header").outerHeight(true);
    $("#map").height(mapHeight);
    map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
    map.setScale(getMapScale(map));
}

function setPQ(p, q) {
    map.getProjection().setP(p);
    map.getProjection().setQ(q);
    $("#pSlider").slider('value', p);
    $("#qSlider").slider('value', q);
    writeSliderValues(p, q);
    adjustMapSize();
    map.render();
}

$(window).load(function () {
    "use strict";

    var p = 1.33,
            q = 1.135;

    // currently styling works like this:
    // - if there's a fillStyle then it will be filled
    // - if there's a strokeStyle then it will be stroked
    // - points are always 3px rectangles
    // - polylines can't be filled

    var layers = [];

    function Style(strokeStyle, lineWidth, fillStyle) {
        if (strokeStyle !== undefined) {
            this.strokeStyle = strokeStyle;
            this.lineWidth = lineWidth;
        }
        if (fillStyle !== undefined) {
            this.fillStyle = fillStyle;
        }
    }

    //create the map
    layers.push(new Layer("../data/ne_110m_coastline", new Style("#888", "1")));
    layers.push(new Graticule(new Style("#77b", "1"), 15));

    map = createMap(layers, new SineSeries(p, q), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());
    $(window).resize(function () {
        adjustMapSize();
    });

    map.setScale(getMapScale(map));

    // init UI controls
    $("#map").bind("mousedown", mouseEventHandler);

    initSliders(p, q);

    // ie
    $("#mapCanvas")[0].onselectstart = function () {
        return false;
    };
    // mozilla
    $("#mapCanvas")[0].onmousedown = function () {
        return false;
    };

    adjustMapSize();
});

