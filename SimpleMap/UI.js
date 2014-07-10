/*globals Map, Layer, Graticule, $, NaturalEarth, createMap*/

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

        unitsPerPixel = 1 / map.getScale();
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
});