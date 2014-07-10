// http://www.html5rocks.com/en/tutorials/canvas/hidpi/
function backingScale(ctx) {"use strict";
    var devicePixelRatio, backingStoreRatio, ratio, context;
    devicePixelRatio = window.devicePixelRatio || 1;
    backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
    ratio = devicePixelRatio / backingStoreRatio;
    return ratio;
}

function applyStyle(style, ctx) {"use strict";
    var s, value;

    if ( typeof style !== "undefined") {
        for (s in style) {
            if (style.hasOwnProperty(s)) {
                value = style[s];
                if (s === 'lineWidth') {
                    value *= backingScale(ctx);
                }
                ctx[s] = value;
            }
        }
    }
}

function Map(layers, canvas) {"use strict";

    var projection, draw = true, lon0 = 0, scale = 1;

    projection = {
        // equirectangular projection
        forward : function(lon, lat, xy) {
            xy[0] = lon;
            xy[1] = lat;
        }
    };

    this.load = function() {
        var i;
        for ( i = 0; i < layers.length; i += 1) {
            layers[i].load(this);
        }
    };

    this.getCanvas = function() {
        return canvas;
    };

    this.getProjection = function() {
        return projection;
    };

    this.setProjection = function(p) {
        projection = p;
        this.render();
    };

    this.getCentralLongitude = function() {
        return lon0;
    };

    this.setCentralLongitude = function(centralLongitude) {
        if (isNaN(centralLongitude)) {
            return;
        }
        lon0 = centralLongitude;
        if (lon0 > Math.PI) {
            lon0 -= 2 * Math.PI;
        } else if (lon0 < -Math.PI) {
            lon0 += 2 * Math.PI;
        }
        this.render();
    };

    this.setDraw = function(d) {
        draw = d;
        this.render();
    };

    this.isDrawn = function() {
        return draw;
    };

    this.clear = function() {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    this.getScale = function() {
        return scale;
    };

    this.setScale = function(s) {
        scale = s;
        this.render();
    };

    this.getMaximumHorizontalScale = function() {
        var graticuleWidth, xy = [];
        if ( typeof projection.getGraticuleWidth === 'function') {
            graticuleWidth = projection.getGraticuleWidth();
        } else {
            // lon = 180, lat = 0
            projection.forward(Math.PI, 0, xy);
            graticuleWidth = xy[0] * 2;
            // lon = 180, lat = 90
            projection.forward(Math.PI, Math.PI / 2, xy);
            graticuleWidth = Math.max(graticuleWidth, xy[0]);
        }
        return canvas.width / graticuleWidth;
    };

    this.getMaximumVerticalScale = function() {
        var graticuleHeight, xy = [];
        if ( typeof projection.getGraticuleHeight === 'function') {
            graticuleHeight = projection.getGraticuleHeight();
        } else {
            // lon = 0, lat = 90
            projection.forward(0, Math.PI / 2, xy);
            graticuleHeight = xy[1] * 2;
            // lon = 180, lat = 90
            projection.forward(Math.PI, Math.PI / 2, xy);
            graticuleHeight = Math.max(graticuleHeight, xy[1]);

        }
        return canvas.height / graticuleHeight;
    };
	
	// FIXME this may return the length of the equator and not the actual graticule width 
	this.getGraticuleWidth = function() {
        var graticuleWidth, xy = [];
        if ( typeof projection.getGraticuleWidth === 'function') {
            graticuleWidth = projection.getGraticuleWidth();
        } else {
            // lon = 180, lat = 0
            projection.forward(Math.PI, 0, xy);
            graticuleWidth = xy[0] * 2;
            // lon = 180, lat = 90
            projection.forward(Math.PI, Math.PI / 2, xy);
            graticuleWidth = Math.max(graticuleWidth, xy[0]);
        }
        return graticuleWidth;
    };
	
	// FIXME this may return the length of the central meridian and not the actual graticule height
	this.getGraticuleHeight = function() {
        var graticuleHeight, xy = [];
        if ( typeof projection.getGraticuleHeight === 'function') {
            graticuleHeight = projection.getGraticuleHeight();
        } else {
            // lon = 0, lat = 90
            projection.forward(0, Math.PI / 2, xy);
            graticuleHeight = xy[1] * 2;
            // lon = 180, lat = 90
            projection.forward(Math.PI, Math.PI / 2, xy);
            graticuleHeight = Math.max(graticuleHeight, xy[1]);

        }
        return graticuleHeight;
    };

    this.scaleMapToCanvas = function() {
        var hScale, vScale;
        hScale = this.getMaximumHorizontalScale();
        vScale = this.getMaximumVerticalScale();
        this.setScale(Math.min(hScale, vScale));
    };

    this.render = function() {
        var i;
        this.clear();
        if (draw) {
            for ( i = 0; i < layers.length; i += 1) {
                layers[i].render(projection, lon0, scale, canvas);
            }
        }
    };

    this.resize = function(width, height) {
        // use size of DOM element for canvas backing store, and
        // increase size of canvas backing store on high-resolution displays, such as Apple's Retina
        var scale = backingScale(canvas.getContext('2d'));
        canvas.setAttribute('width', width * scale);
        canvas.setAttribute('height', height * scale);
        this.scaleMapToCanvas();
        this.render();
    };
}

function createMap(layers, projection, canvasElement, width, height) {"use strict";
    var map = new Map(layers, canvasElement);
    map.setProjection(projection);
    map.resize(width, height);
    map.load();
    return map;
}
