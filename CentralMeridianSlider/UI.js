/*globals Map, Layer, Graticule, $, NaturalEarth, createMap*/

var map;

function getMapScale(map) {"use strict";
    var K = 0.90;
    return Math.min(map.getMaximumVerticalScale(), map.getMaximumHorizontalScale()) * K;
}

function writeSliderValue(nbr) {"use strict";
    $("#meridianText").text(Math.abs(Math.round(nbr)) + "\u00B0" + (nbr < 0 ? "W" : "E"));
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

        $("#meridianSlider").slider('value', lon0 / Math.PI * 180);
        writeSliderValue(lon0 / Math.PI * 180);
        
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

function initSlider() {"use strict";

    $(function() {

        function action(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#meridianSlider").slider('value', ui.value);
            writeSliderValue(ui.value);
            map.setCentralLongitude(ui.value / 180 * Math.PI);
        }

        // create the meridian slider
        $("#meridianSlider").slider({
            orientation : "horizontal",
            range : "min",
            min : -180,
            max : 180,
            value : 0,
            step : 1,
            slide : action
        });
        writeSliderValue(0);
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

    map = createMap(layers, new NaturalEarth(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());
    $(window).resize(function() {
        map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
        map.setScale(getMapScale(map));
    });

    map.setScale(getMapScale(map));

    // init UI controls
    $("#map").bind("mousedown", mouseEventHandler);

    initSlider();

    // ie
    $("#mapCanvas")[0].onselectstart = function() {
        return false;
    };
    // mozilla
    $("#mapCanvas")[0].onmousedown = function() {
        return false;
    };
    
});

