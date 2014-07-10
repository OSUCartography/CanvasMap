/*globals Map, Layer, Graticule, $, MillerTransformation, createMap*/

var map;

function getMapScale(map) {"use strict";
    var K = 0.90;
    return Math.min(map.getMaximumVerticalScale(), map.getMaximumHorizontalScale()) * K;
}

function mouseEventHandler(e) {"use strict";

    var mouseMove, mouseUp, prevMouse;

    prevMouse = {
        x : e.clientX,
        y : e.clientY
    };

    mouseMove = function(e) {
        var unitsPerPixel, lon0, dx = e.clientX - prevMouse.x;

        unitsPerPixel = 1 / getMapScale(map);
        lon0 = map.getCentralLongitude();
        lon0 -= dx * unitsPerPixel;
        map.setCentralLongitude(lon0);
		prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
        e.preventDefault();
    };

    mouseUp = function(e) {
        document.body.style.cursor = null;
        document.removeEventListener('mousemove', mouseMove, false);
        document.removeEventListener('mouseup', mouseUp, false);
    };

    document.body.style.cursor = 'move';
    document.addEventListener('mousemove', mouseMove, false);
    document.addEventListener('mouseup', mouseUp, false);
}

function initSliders() {"use strict";

	// M slider
    $(function() {

        function action(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#mSlider").slider('value', ui.value);
            $("#mText").text("m: " + ui.value);
            $("#aspectText").text("Width:Height 1:" + (map.getGraticuleHeight() / map.getGraticuleWidth()).toFixed(3));
            map.getProjection().setM(ui.value);
            map.render();
        }

        // create the meridian slider
        $("#mSlider").slider({
            orientation : "horizontal",
            range : "min",
            min : 0.5,
            max : 5,
            value : 1.5,
            step : 0.01,
            slide : action
        });
        $("#mText").text("m: " + 1.5);
    });
    
    // N slider
    $(function() {

        function action(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#nSlider").slider('value', ui.value);
            $("#nText").text("n: " + ui.value);
            $("#aspectText").text("Width:Height 1:" + (map.getGraticuleHeight() / map.getGraticuleWidth()).toFixed(3));
            map.getProjection().setN(ui.value);
            map.render();
        }

        // create the meridian slider
        $("#nSlider").slider({
            orientation : "horizontal",
            range : "min",
            min : 1,
            max : 5,
            value : 1.5,
            step : 0.01,
            slide : action
        });
        $("#nText").text("n: " + 1.5);
    });
}


$(window).load(function() {"use strict";

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

    map = createMap(layers, new MillerTransformation(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());
    $(window).resize(function() {
        map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
        map.setScale(getMapScale(map));
    });

    map.setScale(getMapScale(map));

    // init UI controls
    $("#map").bind("mousedown", mouseEventHandler);

    initSliders();

    // ie
    $("#mapCanvas")[0].onselectstart = function() {
        return false;
    };
    // mozilla
    $("#mapCanvas")[0].onmousedown = function() {
        return false;
    };
    
});

