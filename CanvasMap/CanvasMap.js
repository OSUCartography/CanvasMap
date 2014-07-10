

/* Build time: July 9, 2014 05:02:21 */

/*globals LineDrawer, applyStyle*/

function Graticule(style, resolutionDeg) {"use strict";

    function drawMeridian(projection, scale, canvas, lon) {
        var i, ctx, nPts, dLat, lat, lineDrawer, xy = [];
        nPts = 11;
        dLat = Math.PI / (nPts - 1);

        // draw southern and northern hemisphere separately
        // southern hemisphere
        ctx = canvas.getContext('2d');
        lineDrawer = new LineDrawer(0, scale, projection, ctx);
        for ( i = 0; i < nPts / 2; i += 1) {
            lat = -Math.PI / 2 + i * dLat;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();

        // northern hemisphere
        for ( i = 0; i < nPts / 2; i += 1) {
            lat = i * dLat;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();
    }

    function drawParallel(projection, scale, canvas, lat) {
        var i, ctx, nPts, dLon, lon, lineDrawer, xy = [];
        nPts = 20;
        dLon = 2 * Math.PI / (nPts - 1);
        ctx = canvas.getContext('2d');
        lineDrawer = new LineDrawer(0, scale, projection, ctx);
        for ( i = 0; i < nPts; i += 1) {
            lon = -Math.PI + i * dLon;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();
    }


    this.render = function(projection, lon0, scale, canvas) {
        var ctx, i, lon, lat;

        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        applyStyle(style, ctx);

        // meridians
        for ( i = 0; i < 360 / resolutionDeg; i += 1) {
            lon = -Math.PI + i * resolutionDeg / 180 * Math.PI - lon0;
            while (lon < -Math.PI) {
                lon += Math.PI * 2;
            }
            while (lon > Math.PI) {
                lon -= Math.PI * 2;
            }
            drawMeridian(projection, scale, canvas, lon);
        }

        // parallels
        for ( i = 1; i < 180 / resolutionDeg; i += 1) {
            lat = -Math.PI / 2 + i * resolutionDeg / 180 * Math.PI;
            drawParallel(projection, scale, canvas, lat);
        }

        // vertical graticule border
        if ( typeof (projection.isPoleInsideGraticule) !== 'function' || projection.isPoleInsideGraticule() === false) {
            drawMeridian(projection, scale, canvas, -Math.PI);
            drawMeridian(projection, scale, canvas, Math.PI);
        }

        // horizontal graticule border
        drawParallel(projection, scale, canvas, -Math.PI / 2);
        drawParallel(projection, scale, canvas, Math.PI / 2);

        ctx.restore();
    };

    this.load = function(projection, scale, map) {
        // dummy
    };
}

/*global LineDrawer, ShpType, ShpFile, DbfFile, BinaryAjax, applyStyle */

function Layer(url, style) {"use strict";

    var onShpFail, onShpComplete, onDbfFail, onDbfComplete, pointD = 4, layer = this;

    this.shpFile = null;
    this.dbfFile = null;

    function adjustLongitude(lon, lon0) {
        lon -= lon0;
        while (lon < -Math.PI) {
            lon += Math.PI * 2;
        }
        while (lon > Math.PI) {
            lon -= Math.PI * 2;
        }
        return lon;
    }

    function renderPoints(projection, lon0, scale, canvas) {

        var ctx, sc, recordID, shapeRecord, shape, projectionPoint, lon, lat, x, y, dx, dy, fill, stroke;

        projectionPoint = [];
        dx = canvas.width / 2;
        dy = -canvas.height / 2;
        ctx = canvas.getContext('2d');
        ctx.save();
        fill = typeof style !== "undefined" && style.hasOwnProperty("fillStyle");
        stroke = typeof style !== "undefined" && style.hasOwnProperty("strokeStyle");

        if (fill && ( typeof style.fillStyle !== "undefined")) {
            ctx.fillStyle = style.fillStyle;
        }
        if (stroke && ( typeof style.strokeStyle !== "undefined")) {
            ctx.strokeStyle = style.strokeStyle;
        }
        if ( typeof style !== "undefined" && style.hasOwnProperty("lineWidth") && typeof style.lineWidth !== "undefined") {
            ctx.lineWidth = style.lineWidth;
        }

        for ( recordID = 0; recordID < layer.shpFile.records.length; recordID += 1) {
            shapeRecord = layer.shpFile.records[recordID];
            shape = shapeRecord.shape;

            lon = adjustLongitude(shape.x, lon0);
            lat = shape.y;
            projection.forward(lon, lat, projectionPoint);
            x = projectionPoint[0] * scale + dx;
            y = canvas.height - projectionPoint[1] * scale + dy;

            if (fill && typeof style.fillStyle !== 'undefined') {
                ctx.fillRect(x - pointD / 2, y - pointD / 2, pointD, pointD);
            }
            if (stroke && typeof style.strokeStyle !== 'undefined') {
                ctx.strokeRect(x - pointD / 2, y - pointD / 2, pointD, pointD);
            }
        }
        ctx.restore();
    }

    function renderPolygons(projection, lon0, scale, canvas) {

        var ctx, sc, shapeRecord, recordID, shape, ringID, ring, ptID, lineDrawer;

        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        applyStyle(style, ctx);
        lineDrawer = new LineDrawer(lon0, scale, projection, ctx);

        for ( recordID = 0; recordID < layer.shpFile.records.length; recordID += 1) {
            shapeRecord = layer.shpFile.records[recordID];
            shape = shapeRecord.shape;
            for ( ringID = 0; ringID < shape.rings.length; ringID += 1) {
                ring = shape.rings[ringID];
                for ( ptID = 0; ptID < ring.length; ptID += 1) {
                    lineDrawer.intersectProjectDraw(ring[ptID].x, ring[ptID].y);
                }
                lineDrawer.stroke();
            }
        }
        ctx.restore();
    }


    this.render = function(projection, lon0, scale, canvas) {

        if (layer.shpFile === null) {
            return;
        }

        switch (layer.shpFile.header.shapeType) {
            case ShpType.SHAPE_POLYGON:
            case ShpType.SHAPE_POLYLINE:
                renderPolygons(projection, lon0, scale, canvas);
                break;
            case ShpType.SHAPE_POINT:
                renderPoints(projection, lon0, scale, canvas);
                break;
        }
    };

    function pointsDegreeToRadian(records) {
        var i, nRecords, c = Math.PI / 180, shp;
        for ( i = 0, nRecords = records.length; i < nRecords; i += 1) {
            shp = records[i].shape;
            shp.x *= c;
            shp.y *= c;
        }
    }

    function linesDegreeToRadian(records) {
        var c = Math.PI / 180, nRecords, nRings, nVertices, i, j, ring, k, lon, lat, xMin, xMax, yMin, yMax, shp;
        for ( i = 0, nRecords = records.length; i < nRecords; i += 1) {
            shp = records[i].shape;
            xMin = Number.MAX_VALUE;
            xMax = -Number.MAX_VALUE;
            yMin = Number.MAX_VALUE;
            yMax = -Number.MAX_VALUE;

            for ( j = 0, nRings = shp.rings.length; j < nRings; j += 1) {
                ring = shp.rings[j];
                for ( k = 0, nVertices = ring.length; k < nVertices; k += 1) {
                    lon = ring[k].x * c;

                    if (lon > xMax) {
                        xMax = lon;
                    }
                    if (lon < xMin) {
                        xMin = lon;
                    }

                    if (lon > Math.PI) {
                        lon = Math.PI;
                    } else if (lon < -Math.PI) {
                        lon = -Math.PI;
                    }

                    ring[k].x = lon;

                    lat = ring[k].y * c;

                    // clamp to +/-PI/2
                    if (lat > Math.PI / 2) {
                        lat = Math.PI / 2;
                    } else if (lat < -Math.PI / 2) {
                        lat = -Math.PI / 2;
                    }

                    if (lat > yMax) {
                        yMax = lat;
                    }
                    if (lat < yMin) {
                        yMin = lat;
                    }
                    ring[k].y = lat;
                }
            }
            shp.box.xMin = xMin;
            shp.box.xMax = xMax;
            shp.box.yMin = yMin;
            shp.box.yMax = yMax;
        }
    }


    this.load = function(map) {

        function onShpFail() {
            alert('Failed to load ' + url);
        }

        function onDbfFail() {
            alert('Failed to load ' + url);
        }

        function onShpComplete(oHTTP) {
            layer.shpFile = new ShpFile(oHTTP.binaryResponse);

            // convert geometry from degrees to radians
            switch (layer.shpFile.header.shapeType) {
                case ShpType.SHAPE_POLYGON:
                case ShpType.SHAPE_POLYLINE:
                    linesDegreeToRadian(layer.shpFile.records);
                    break;
                case ShpType.SHAPE_POINT:
                    pointsDegreeToRadian(layer.shpFile.records);
                    break;
            }

            if (layer.dbfFile !== null) {
                map.render();
            }
        }

        function onDbfComplete(oHTTP) {
            layer.dbfFile = new DbfFile(oHTTP.binaryResponse);
            if (layer.shpFile !== null) {
                map.render();
            }
        }

        var shpLoader, dbfLoader;
        try {
            shpLoader = new BinaryAjax(url + '.shp', onShpComplete, onShpFail);
            dbfLoader = new BinaryAjax(url + '.dbf', onDbfComplete, onDbfFail);
        } catch (e) {
            alert(e);
        }
    };
}

/**
 * Square distance between a point and a line defined by two other points.
 * See http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
 * @param x0 The point not on the line.
 * @param y0 The point not on the line.
 * @param x1 A point on the line.
 * @param y1 A point on the line.
 * @param x2 Another point on the line.
 * @param y2 Another point on the line.
 */
function pointLineDistanceSquare(x0, y0, x1, y1, x2, y2) {"use strict";
    var d, x2_x1 = x2 - x1, y2_y1 = y2 - y1;
    d = (x2_x1) * (y1 - y0) - (x1 - x0) * (y2_y1);
    return d * d / (x2_x1 * x2_x1 + y2_y1 * y2_y1);
}

function adjustLongitude(lon, lon0) {"use strict";
    lon -= lon0;
    while (lon < -Math.PI) {
        lon += Math.PI * 2;
    }
    while (lon > Math.PI) {
        lon -= Math.PI * 2;
    }
    return lon;
}

function SphericalRotation(poleLat) {"use strict";
    var sinLatPole, cosLatPole;

    sinLatPole = Math.sin(poleLat);
    cosLatPole = Math.cos(poleLat);

    this.getPoleLat = function() {
        return poleLat;
    };

    this.transform = function(lon, lat, res) {
        var sinLon, cosLon, sinLat, cosLat, cosLat_x_cosLon;
        sinLon = Math.sin(lon);
        cosLon = Math.cos(lon);
        sinLat = Math.sin(lat);
        cosLat = Math.cos(lat);
/*
        // FIXME transverse
        res[0] = Math.atan2(cosLat * sinLon, sinLat);
        res[1] = Math.asin(-cosLat * cosLon);
*/
         cosLat_x_cosLon = cosLat * cosLon;
         res[0] = Math.atan2(cosLat * sinLon, sinLatPole * cosLat_x_cosLon + cosLatPole * sinLat);
         sinLat = sinLatPole * sinLat - cosLatPole * cosLat_x_cosLon;
         res[1] = Math.asin(sinLat);
    };

    this.transformInv = function(lon, lat, res) {
        var sinLon = Math.sin(lon), cosLon = Math.cos(lon), sinLat = Math.sin(lat), cosLat = Math.cos(lat);
        var cosLat_x_cosLon = cosLat * cosLon;
        res[0] = Math.atan2(cosLat * sinLon, sinLatPole * cosLat_x_cosLon - cosLatPole * sinLat);
        res[1] = Math.asin(sinLatPole * sinLat + cosLatPole * cosLat_x_cosLon);
    };

}

function LineDrawer(lon0, scale, projection, ctx) {"use strict";

    var prevX, prevY, prevLon, prevLat, prevPointOutOfRange, moveTo = true, CURVE_TOL, CURVE_TOL_SQR;

    var sphericalRotation = new SphericalRotation(Math.PI / 4);

    // the tolerance by which a line may deviate from a perfectly smooth line
    CURVE_TOL = 0.25 / scale;
    CURVE_TOL_SQR = CURVE_TOL * CURVE_TOL;

    function drawCmd(lon, lat, lon0, stackDepth) {
        var lonMean, latMean, x, y, dsq, xy = [], xyMean = [];

        if ((stackDepth += 1) > 50) {
            return;
        }

        lon = adjustLongitude(lon, lon0);
        
        /*var rot = [];
        sphericalRotation.transform(lon, lat, rot);
        lon = rot[0];
        lat = rot[1];
     */
        projection.forward(lon, lat, xy);

        if (moveTo) {
            if (isFinite(xy[0]) && isFinite(xy[1])) {
                ctx.beginPath();
                ctx.moveTo(xy[0] * scale, -xy[1] * scale);
                moveTo = false;
            }
        } else {
            // compute the orthogonal distance in Cartesian coordinates of the mean point to the line
            // between the start and the end point
            lonMean = (prevLon + lon) * 0.5;
            latMean = (prevLat + lat) * 0.5;
            projection.forward(lonMean, latMean, xyMean);
            dsq = pointLineDistanceSquare(xyMean[0], xyMean[1], prevX, prevY, xy[0], xy[1]);

            if (isFinite(dsq)) {
                // if the distance is too large, add intermediate points
                if (dsq > CURVE_TOL_SQR) {
                    drawCmd(lonMean, latMean, 0, stackDepth);
                    drawCmd(lon, lat, 0, stackDepth);
                }

                ctx.lineTo(xy[0] * scale, -xy[1] * scale);
            } else {
                ctx.stroke();
                moveTo = true;
            }
        }
        prevX = xy[0];
        prevY = xy[1];
        prevLon = lon;
        prevLat = lat;
    }


    this.stroke = function() {
        ctx.stroke();
        moveTo = true;
    };

    /**
     * Computes two intersection points for a straight line segment that crosses
     * the anti-meridian. Projects and draws the two intersection points and
     * the end point.
     * @param lonEnd The longitude of the end point of the line segment.
     * @param latEnd The latitude of the end point of the line segment.
     * @param lonStart The longitude of the start point of the line segment.
     * @param latStart The latitude of the start point of the line segment.
     */
    this.projectIntersectingLineTo = function(lonEnd, latEnd, lonStart, latStart) {

        // lon1 the longitude of the intermediate end point
        // lon2 the longitude of the intermediate start point
        // lat the latitude of both intermediate points
        var dLon, dLat, lonMax, lonMin, lon1, lon2, lat;
        dLon = lonEnd - lonStart;
        dLat = latEnd - latStart;

        // compute intersection point in geographic coordinates
        lonMax = Math.PI + lon0;
        lonMin = -Math.PI + lon0;

        if (lonEnd > lonMax) {// leaving graticule towards east
            lon1 = Math.PI;
            lat = latStart + dLat * (lonMax - lonStart) / dLon;
            lon2 = -Math.PI;
        } else if (lonStart > lonMax) {// entering graticule from east
            lon1 = -Math.PI;
            lat = latStart + dLat * (lonMax - lonStart) / dLon;
            lon2 = Math.PI;
        } else if (lonEnd < lonMin) {// leaving graticule towards west
            lon1 = -Math.PI;
            lat = latStart + dLat * (lonMin - lonStart) / dLon;
            lon2 = Math.PI;
        } else if (lonStart < lonMin) {// entering graticule from west
            lon1 = Math.PI;
            lat = latStart + dLat * (lonMin - lonStart) / dLon;
            lon2 = -Math.PI;
        }
        drawCmd(lon1, lat, 0, 1);
        this.stroke();
        drawCmd(lon2, lat, 0, 1);
        drawCmd(lonEnd, latEnd, lon0, 1);
    };

    this.projectDraw = function(lon, lat) {
        drawCmd(lon, lat, 0, 1);
    };

    this.intersectProjectDraw = function(lon, lat) {
        var pointOutOfRange;

        if (moveTo) {
            prevPointOutOfRange = pointOutOfRange = lon - lon0 < -Math.PI || lon - lon0 > Math.PI;
        } else {
            pointOutOfRange = lon - lon0 < -Math.PI || lon - lon0 > Math.PI;
        }

        if (prevPointOutOfRange !== pointOutOfRange) {
            prevPointOutOfRange = pointOutOfRange;
            this.projectIntersectingLineTo(lon, lat, prevLon, prevLat);
        } else {
            drawCmd(lon, lat, lon0, 1);
        }
    };
}
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

//
// stateful helper for binaryajax.js's BinaryFile class
// 
// modelled on Flash's ByteArray, mostly, although some names
// (int/short/long) differ in definition
//

function BinaryFileWrapper(binFile) {
    
    this.position = 0;
    this.bigEndian = true;

    this.getByte = function() {
        var Byte = binFile.getByteAt(this.position);
        this.position++;
        return Byte;
    }

    this.getLength = function() {
        return binFile.getLength();
    }

    this.getSByte = function() {
        var sbyte = binFile.getSByteAt(this.position);
        this.position++;
        return sbyte;
    }

    this.getShort = function() {
        var Short = binFile.getShortAt(this.position, this.bigEndian);
        this.position += 2;
        return Short;
    }
    
    this.getSShort = function() {
        var sshort = binFile.getSShortAt(this.position, this.bigEndian);
        this.position += 2;
        return sshort;
    }
    
    this.getLong = function() {
        var l = binFile.getLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getSLong = function() {
        var l = binFile.getSLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getString = function(iLength) {
        var s = binFile.getStringAt(this.position, iLength);
        this.position += iLength;
        return s;
    }

	this.getDoubleAt = function(iOffset, bBigEndian) {
		// hugs stackoverflow
		// http://stackoverflow.com/questions/1597709/convert-a-string-with-a-hex-representation-of-an-ieee-754-double-into-javascript
		// TODO: check the endianness for something other than shapefiles
		// TODO: what about NaNs and Infinity?
		var a = binFile.getLongAt(iOffset + (bBigEndian ? 0 : 4), bBigEndian);
		var b = binFile.getLongAt(iOffset + (bBigEndian ? 4 : 0), bBigEndian);
		var s = a >> 31 ? -1 : 1;
		var e = (a >> 52 - 32 & 0x7ff) - 1023;
		return s * (a & 0xfffff | 0x100000) * 1.0 / Math.pow(2,52-32) * Math.pow(2, e) + b * 1.0 / Math.pow(2, 52) * Math.pow(2, e);
	}

    this.getDouble = function() {    
        var d = this.getDoubleAt(this.position, this.bigEndian);
        this.position += 8;
        return d;
    }

    this.getChar = function() {
        var c = binFile.getCharAt(this.position);
        this.position++;
        return c;
    }
}
// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

function DbfFile(binFile) {

    this.src = new BinaryFileWrapper(binFile);

    var t1 = new Date().getTime();    

    this.header = new DbfHeader(this.src);

    var t2 = new Date().getTime();
    //if (window.console && window.console.log) console.log('parsed dbf header in ' + (t2-t1) + ' ms');    

    t1 = new Date().getTime();    
    
    // TODO: could maybe be smarter about this and only parse these on demand
    this.records = [];
    for (var i = 0; i < this.header.recordCount; i++) {
        var record = this.getRecord(i);
        this.records.push(record);
    }    

    t2 = new Date().getTime();
    //if (window.console && window.console.log) console.log('parsed dbf records in ' + (t2-t1) + ' ms');    
    
}
DbfFile.prototype.getRecord = function(index) {

    if (index > this.header.recordCount) {
        throw(new DbfError("",DbfError.ERROR_OUTOFBOUNDS));
    }

    this.src.position = this.header.recordsOffset + index * this.header.recordSize;
    this.src.bigEndian = false;

    return new DbfRecord(this.src, this.header);
}


function DbfHeader(src) {
    
    // endian:
    src.bigEndian = false;

    this.version = src.getSByte();
    this.updateYear = 1900+src.getByte();
    this.updateMonth = src.getByte();
    this.updateDay = src.getByte();
    this.recordCount = src.getLong();
    this.headerSize = src.getShort();
    this.recordSize = src.getShort();

    //skip 2:
    src.position += 2;

    this.incompleteTransaction = src.getByte();
    this.encrypted = src.getByte();

    // skip 12:
    src.position += 12;

    this.mdx = src.getByte();
    this.language = src.getByte();

    // skip 2;
    src.position += 2;

    // iterate field descriptors:
    this.fields = [];
    while (src.getSByte() != 0x0D){
        src.position -= 1;
        this.fields.push(new DbfField(src));
    }

    this.recordsOffset = this.headerSize+1;                                                                    
    
}                

function DbfField(src) {

    this.name = this.readZeroTermANSIString(src);

    // fixed length: 10, so:
    src.position += (10-this.name.length);

    this.type = src.getByte();
    this.address = src.getLong();
    this.length = src.getByte();
    this.decimals = src.getByte();

    // skip 2:
    src.position += 2;

    this.id = src.getByte();

    // skip 2:
    src.position += 2;

    this.setFlag = src.getByte();

    // skip 7:
    src.position += 7;

    this.indexFlag = src.getByte();
}
DbfField.prototype.readZeroTermANSIString = function(src) {
    var r = [];
    var b;
    while (b = src.getByte()) {
        r[r.length] = String.fromCharCode(b);
    }
    return r.join('');
}

function DbfRecord(src, header) {
    this.offset = src.position;
    this.values = {}
    for (var i = 0; i < header.fields.length; i++) {
        var field = header.fields[i];
        this.values[field.name] = src.getString(field.length);
    }                             
}

/*
 * Binary Ajax 0.1.7
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */


var BinaryFile = function(strData, iDataOffset, iDataLength) {
	var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;

	this.getRawData = function() {
		return data;
	}

	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		}
	} else if (typeof strData == "unknown") {
		dataLength = iDataLength || IEBinary_getLength(data);

		this.getByteAt = function(iOffset) {
			return IEBinary_getByteAt(data, iOffset + dataOffset);
		}
	}

	this.getLength = function() {
		return dataLength;
	}

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	}

	this.getShortAt = function(iOffset, bBigEndian) {
		var iShort = bBigEndian ? 
			(this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
			: (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
		if (iShort < 0) iShort += 65536;
		return iShort;
	}
	this.getSShortAt = function(iOffset, bBigEndian) {
		var iUShort = this.getShortAt(iOffset, bBigEndian);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	}
	this.getLongAt = function(iOffset, bBigEndian) {
		var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2),
			iByte4 = this.getByteAt(iOffset + 3);

		var iLong = bBigEndian ? 
			(((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
			: (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
		if (iLong < 0) iLong += 4294967296;
		return iLong;
	}
	this.getSLongAt = function(iOffset, bBigEndian) {
		var iULong = this.getLongAt(iOffset, bBigEndian);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	}
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	}
	this.toBase64 = function() {
		return window.btoa(data);
	}
	this.fromBase64 = function(strBase64) {
		data = window.atob(strBase64);
	}
}


var BinaryAjax = (function() {

	function createRequest() {
		var oHTTP = null;
		if (window.XMLHttpRequest) {
			oHTTP = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return oHTTP;
	}

	function getHead(strURL, fncCallback, fncError, cl) {
		var oHTTP = createRequest();
		if (oHTTP) {
			if (fncCallback) {
				if (typeof(oHTTP.onload) != "undefined") {
					oHTTP.onload = function() {
						if (oHTTP.status == "200") {
							fncCallback(this,cl);
						} else {
							if (fncError) fncError();
						}
						oHTTP = null;
					};
				} else {
					oHTTP.onreadystatechange = function() {
						if (oHTTP.readyState == 4) {
							if (oHTTP.status == "200") {
								fncCallback(this,cl);
							} else {
								if (fncError) fncError();
							}
							oHTTP = null;
						}
					};
				}
			}
			oHTTP.open("HEAD", strURL, true);
			oHTTP.send(null);
		} else {
			if (fncError) fncError();
		}
	}

	function sendRequest(strURL, fncCallback, fncError, cl, aRange, bAcceptRanges, iFileSize) {
		
		var oHTTP = createRequest();
		if (oHTTP) {
		
			var iDataOffset = 0;
			if (aRange && !bAcceptRanges) {
				iDataOffset = aRange[0];
			}
			var iDataLen = 0;
			if (aRange) {
				iDataLen = aRange[1]-aRange[0]+1;
			}

			if (fncCallback) {
			
				if (typeof(oHTTP.onload) != "undefined") {
					// wird nach dem send(null) ausgef�hrt
					oHTTP.onload = function() {

						if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
							oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
							oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
							// f�hrt complete-Funktion in layer aus
							fncCallback(oHTTP,cl);
						} else {
							if (fncError) fncError();
						}
						oHTTP = null;
					};
				} else {
					oHTTP.onreadystatechange = function() {
						if (oHTTP.readyState == 4) {
							if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
								// IE6 craps if we try to extend the XHR object
								var oRes = {
									status : oHTTP.status,
									binaryResponse : new BinaryFile(oHTTP.responseBody, iDataOffset, iDataLen),
									fileSize : iFileSize || oHTTP.getResponseHeader("Content-Length")
								};
								fncCallback(oRes,cl);
							} else {
								if (fncError) fncError();
							}
							oHTTP = null;
						}
					};
				}
			}
			oHTTP.open("GET", strURL, true);

			if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');

			if (aRange && bAcceptRanges) {
				oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
			}

			oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

			oHTTP.send(null);
		} else {
			if (fncError) fncError();
		}
	}

	return function(strURL, fncCallback, fncError, cl, aRange) {

		if (aRange) {
			getHead(
				strURL, 
				function(oHTTP) {
					var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"),10);
					var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");

					var iStart, iEnd;
					iStart = aRange[0];
					if (aRange[0] < 0) 
						iStart += iLength;
					iEnd = iStart + aRange[1] - 1;

					sendRequest(strURL, fncCallback, fncError, cl, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength);
				}
			);

		} else {
			sendRequest(strURL, fncCallback, fncError, cl);
		}
	}

}());


document.write(
	"<script type='text/vbscript'>\r\n"
	+ "Function IEBinary_getByteAt(strBinary, iOffset)\r\n"
	+ "	IEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\n"
	+ "End Function\r\n"
	+ "Function IEBinary_getLength(strBinary)\r\n"
	+ "	IEBinary_getLength = LenB(strBinary)\r\n"
	+ "End Function\r\n"
	+ "</script>\r\n"
);

// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Known Issues:
//
// * Patterns are not implemented.
// * Radial gradient are not implemented. The VML version of these look very
//   different from the canvas one.
// * Clipping paths are not implemented.
// * Coordsize. The width and height attribute have higher priority than the
//   width and height style values which isn't correct.
// * Painting mode isn't implemented.
// * Canvas width/height should is using content-box by default. IE in
//   Quirks mode will draw the canvas using border-box. Either change your
//   doctype to HTML5
//   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
//   or use Box Sizing Behavior from WebFX
//   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
// * Optimize. There is always room for speed improvements.

// only add this code if we do not already have a canvas implementation
if (!window.CanvasRenderingContext2D) {

(function () {

  // alias some functions to make (compiled) code shorter
  var m = Math;
  var mr = m.round;
  var ms = m.sin;
  var mc = m.cos;

  // this is used for sub pixel precision
  var Z = 10;
  var Z2 = Z / 2;

  var G_vmlCanvasManager_ = {
    init: function (opt_doc) {
      var doc = opt_doc || document;
      if (/MSIE/.test(navigator.userAgent) && !window.opera) {
        var self = this;
        doc.attachEvent("onreadystatechange", function () {
          self.init_(doc);
        });
      }
    },

    init_: function (doc) {
      if (doc.readyState == "complete") {
        // create xmlns
        if (!doc.namespaces["g_vml_"]) {
          doc.namespaces.add("g_vml_", "urn:schemas-microsoft-com:vml");
        }

        // setup default css
        var ss = doc.createStyleSheet();
        ss.cssText = "canvas{display:inline-block;overflow:hidden;" +
            // default size is 300x150 in Gecko and Opera
            "text-align:left;width:300px;height:150px}" +
            "g_vml_\\:*{behavior:url(#default#VML)}";

        // find all canvas elements
        var els = doc.getElementsByTagName("canvas");
        for (var i = 0; i < els.length; i++) {
          if (!els[i].getContext) {
            this.initElement(els[i]);
          }
        }
      }
    },

    fixElement_: function (el) {
      // in IE before version 5.5 we would need to add HTML: to the tag name
      // but we do not care about IE before version 6
      var outerHTML = el.outerHTML;

      var newEl = el.ownerDocument.createElement(outerHTML);
      // if the tag is still open IE has created the children as siblings and
      // it has also created a tag with the name "/FOO"
      if (outerHTML.slice(-2) != "/>") {
        var tagName = "/" + el.tagName;
        var ns;
        // remove content
        while ((ns = el.nextSibling) && ns.tagName != tagName) {
          ns.removeNode();
        }
        // remove the incorrect closing tag
        if (ns) {
          ns.removeNode();
        }
      }
      el.parentNode.replaceChild(newEl, el);
      return newEl;
    },

    /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
    initElement: function (el) {
      el = this.fixElement_(el);
      el.getContext = function () {
        if (this.context_) {
          return this.context_;
        }
        return this.context_ = new CanvasRenderingContext2D_(this);
      };

      // do not use inline function because that will leak memory
      el.attachEvent('onpropertychange', onPropertyChange);
      el.attachEvent('onresize', onResize);

      var attrs = el.attributes;
      if (attrs.width && attrs.width.specified) {
        // TODO: use runtimeStyle and coordsize
        // el.getContext().setWidth_(attrs.width.nodeValue);
        el.style.width = attrs.width.nodeValue + "px";
      } else {
        el.width = el.clientWidth;
      }
      if (attrs.height && attrs.height.specified) {
        // TODO: use runtimeStyle and coordsize
        // el.getContext().setHeight_(attrs.height.nodeValue);
        el.style.height = attrs.height.nodeValue + "px";
      } else {
        el.height = el.clientHeight;
      }
      //el.getContext().setCoordsize_()
      return el;
    }
  };

  function onPropertyChange(e) {
    var el = e.srcElement;

    switch (e.propertyName) {
      case 'width':
        el.style.width = el.attributes.width.nodeValue + "px";
        el.getContext().clearRect();
        break;
      case 'height':
        el.style.height = el.attributes.height.nodeValue + "px";
        el.getContext().clearRect();
        break;
    }
  }

  function onResize(e) {
    var el = e.srcElement;
    if (el.firstChild) {
      el.firstChild.style.width =  el.clientWidth + 'px';
      el.firstChild.style.height = el.clientHeight + 'px';
    }
  }

  G_vmlCanvasManager_.init();

  // precompute "00" to "FF"
  var dec2hex = [];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < 16; j++) {
      dec2hex[i * 16 + j] = i.toString(16) + j.toString(16);
    }
  }

  function createMatrixIdentity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  function matrixMultiply(m1, m2) {
    var result = createMatrixIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++) {
          sum += m1[x][z] * m2[z][y];
        }

        result[x][y] = sum;
      }
    }
    return result;
  }

  function copyState(o1, o2) {
    o2.fillStyle     = o1.fillStyle;
    o2.lineCap       = o1.lineCap;
    o2.lineJoin      = o1.lineJoin;
    o2.lineWidth     = o1.lineWidth;
    o2.miterLimit    = o1.miterLimit;
    o2.shadowBlur    = o1.shadowBlur;
    o2.shadowColor   = o1.shadowColor;
    o2.shadowOffsetX = o1.shadowOffsetX;
    o2.shadowOffsetY = o1.shadowOffsetY;
    o2.strokeStyle   = o1.strokeStyle;
    o2.arcScaleX_    = o1.arcScaleX_;
    o2.arcScaleY_    = o1.arcScaleY_;
  }

  function processStyle(styleString) {
    var str, alpha = 1;

    styleString = String(styleString);
    if (styleString.substring(0, 3) == "rgb") {
      var start = styleString.indexOf("(", 3);
      var end = styleString.indexOf(")", start + 1);
      var guts = styleString.substring(start + 1, end).split(",");

      str = "#";
      for (var i = 0; i < 3; i++) {
        str += dec2hex[Number(guts[i])];
      }

      if ((guts.length == 4) && (styleString.substr(3, 1) == "a")) {
        alpha = guts[3];
      }
    } else {
      str = styleString;
    }

    return [str, alpha];
  }

  function processLineCap(lineCap) {
    switch (lineCap) {
      case "butt":
        return "flat";
      case "round":
        return "round";
      case "square":
      default:
        return "square";
    }
  }

  /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} surfaceElement The element that the 2D context should
   * be associated with
   */
   function CanvasRenderingContext2D_(surfaceElement) {
    this.m_ = createMatrixIdentity();

    this.mStack_ = [];
    this.aStack_ = [];
    this.currentPath_ = [];

    // Canvas context properties
    this.strokeStyle = "#000";
    this.fillStyle = "#000";

    this.lineWidth = 1;
    this.lineJoin = "miter";
    this.lineCap = "butt";
    this.miterLimit = Z * 1;
    this.globalAlpha = 1;
    this.canvas = surfaceElement;

    var el = surfaceElement.ownerDocument.createElement('div');
    el.style.width =  surfaceElement.clientWidth + 'px';
    el.style.height = surfaceElement.clientHeight + 'px';
    el.style.overflow = 'hidden';
    el.style.position = 'absolute';
    surfaceElement.appendChild(el);

    this.element_ = el;
    this.arcScaleX_ = 1;
    this.arcScaleY_ = 1;
  };

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    this.element_.innerHTML = "";
    this.currentPath_ = [];
  };

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.

    this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    this.currentPath_.push({type: "moveTo", x: aX, y: aY});
    this.currentX_ = aX;
    this.currentY_ = aY;
  };

  contextPrototype.lineTo = function(aX, aY) {
    this.currentPath_.push({type: "lineTo", x: aX, y: aY});
    this.currentX_ = aX;
    this.currentY_ = aY;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    this.currentPath_.push({type: "bezierCurveTo",
                           cp1x: aCP1x,
                           cp1y: aCP1y,
                           cp2x: aCP2x,
                           cp2y: aCP2y,
                           x: aX,
                           y: aY});
    this.currentX_ = aX;
    this.currentY_ = aY;
  };

  contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
    // the following is lifted almost directly from
    // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes
    var cp1x = this.currentX_ + 2.0 / 3.0 * (aCPx - this.currentX_);
    var cp1y = this.currentY_ + 2.0 / 3.0 * (aCPy - this.currentY_);
    var cp2x = cp1x + (aX - this.currentX_) / 3.0;
    var cp2y = cp1y + (aY - this.currentY_) / 3.0;
    this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, aX, aY);
  };

  contextPrototype.arc = function(aX, aY, aRadius,
                                  aStartAngle, aEndAngle, aClockwise) {
    aRadius *= Z;
    var arcType = aClockwise ? "at" : "wa";

    var xStart = aX + (mc(aStartAngle) * aRadius) - Z2;
    var yStart = aY + (ms(aStartAngle) * aRadius) - Z2;

    var xEnd = aX + (mc(aEndAngle) * aRadius) - Z2;
    var yEnd = aY + (ms(aEndAngle) * aRadius) - Z2;

    // IE won't render arches drawn counter clockwise if xStart == xEnd.
    if (xStart == xEnd && !aClockwise) {
      xStart += 0.125; // Offset xStart by 1/80 of a pixel. Use something
                       // that can be represented in binary
    }

    this.currentPath_.push({type: arcType,
                           x: aX,
                           y: aY,
                           radius: aRadius,
                           xStart: xStart,
                           yStart: yStart,
                           xEnd: xEnd,
                           yEnd: yEnd});

  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
  };

  contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
    // Will destroy any existing path (same as FF behaviour)
    this.beginPath();
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.stroke();
  };

  contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
    // Will destroy any existing path (same as FF behaviour)
    this.beginPath();
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.fill();
  };

  contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
    var gradient = new CanvasGradient_("gradient");
    return gradient;
  };

  contextPrototype.createRadialGradient = function(aX0, aY0,
                                                   aR0, aX1,
                                                   aY1, aR1) {
    var gradient = new CanvasGradient_("gradientradial");
    gradient.radius1_ = aR0;
    gradient.radius2_ = aR1;
    gradient.focus_.x = aX0;
    gradient.focus_.y = aY0;
    return gradient;
  };

  contextPrototype.drawImage = function (image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

    // to find the original width we overide the width and height
    var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

    // get the original size
    var w = image.width;
    var h = image.height;

    // and remove overides
    image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    if (arguments.length == 3) {
      dx = arguments[1];
      dy = arguments[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (arguments.length == 5) {
      dx = arguments[1];
      dy = arguments[2];
      dw = arguments[3];
      dh = arguments[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (arguments.length == 9) {
      sx = arguments[1];
      sy = arguments[2];
      sw = arguments[3];
      sh = arguments[4];
      dx = arguments[5];
      dy = arguments[6];
      dw = arguments[7];
      dh = arguments[8];
    } else {
      throw "Invalid number of arguments";
    }

    var d = this.getCoords_(dx, dy);

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

    // For some reason that I've now forgotten, using divs didn't work
    vmlStr.push(' <g_vml_:group',
                ' coordsize="', Z * W, ',', Z * H, '"',
                ' coordorigin="0,0"' ,
                ' style="width:', W, ';height:', H, ';position:absolute;');

    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.

    if (this.m_[0][0] != 1 || this.m_[0][1]) {
      var filter = [];

      // Note the 12/21 reversal
      filter.push("M11='", this.m_[0][0], "',",
                  "M12='", this.m_[1][0], "',",
                  "M21='", this.m_[0][1], "',",
                  "M22='", this.m_[1][1], "',",
                  "Dx='", mr(d.x / Z), "',",
                  "Dy='", mr(d.y / Z), "'");

      // Bounding box calculation (need to minimize displayed area so that
      // filters don't waste time on unused pixels.
      var max = d;
      var c2 = this.getCoords_(dx + dw, dy);
      var c3 = this.getCoords_(dx, dy + dh);
      var c4 = this.getCoords_(dx + dw, dy + dh);

      max.x = Math.max(max.x, c2.x, c3.x, c4.x);
      max.y = Math.max(max.y, c2.y, c3.y, c4.y);

      vmlStr.push("padding:0 ", mr(max.x / Z), "px ", mr(max.y / Z),
                  "px 0;filter:progid:DXImageTransform.Microsoft.Matrix(",
                  filter.join(""), ", sizingmethod='clip');")
    } else {
      vmlStr.push("top:", mr(d.y / Z), "px;left:", mr(d.x / Z), "px;")
    }

    vmlStr.push(' ">' ,
                '<g_vml_:image src="', image.src, '"',
                ' style="width:', Z * dw, ';',
                ' height:', Z * dh, ';"',
                ' cropleft="', sx / w, '"',
                ' croptop="', sy / h, '"',
                ' cropright="', (w - sx - sw) / w, '"',
                ' cropbottom="', (h - sy - sh) / h, '"',
                ' />',
                '</g_vml_:group>');

    this.element_.insertAdjacentHTML("BeforeEnd",
                                    vmlStr.join(""));
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;
    var a = processStyle(aFill ? this.fillStyle : this.strokeStyle);
    var color = a[0];
    var opacity = a[1] * this.globalAlpha;

    var W = 10;
    var H = 10;

    lineStr.push('<g_vml_:shape',
                 ' fillcolor="', color, '"',
                 ' filled="', Boolean(aFill), '"',
                 ' style="position:absolute;width:', W, ';height:', H, ';"',
                 ' coordorigin="0 0" coordsize="', Z * W, ' ', Z * H, '"',
                 ' stroked="', !aFill, '"',
                 ' strokeweight="', this.lineWidth, '"',
                 ' strokecolor="', color, '"',
                 ' path="');

    var newSeq = false;
    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];

      if (p.type == "moveTo") {
        lineStr.push(" m ");
        var c = this.getCoords_(p.x, p.y);
        lineStr.push(mr(c.x), ",", mr(c.y));
      } else if (p.type == "lineTo") {
        lineStr.push(" l ");
        var c = this.getCoords_(p.x, p.y);
        lineStr.push(mr(c.x), ",", mr(c.y));
      } else if (p.type == "close") {
        lineStr.push(" x ");
      } else if (p.type == "bezierCurveTo") {
        lineStr.push(" c ");
        var c = this.getCoords_(p.x, p.y);
        var c1 = this.getCoords_(p.cp1x, p.cp1y);
        var c2 = this.getCoords_(p.cp2x, p.cp2y);
        lineStr.push(mr(c1.x), ",", mr(c1.y), ",",
                     mr(c2.x), ",", mr(c2.y), ",",
                     mr(c.x), ",", mr(c.y));
      } else if (p.type == "at" || p.type == "wa") {
        lineStr.push(" ", p.type, " ");
        var c  = this.getCoords_(p.x, p.y);
        var cStart = this.getCoords_(p.xStart, p.yStart);
        var cEnd = this.getCoords_(p.xEnd, p.yEnd);

        lineStr.push(mr(c.x - this.arcScaleX_ * p.radius), ",",
                     mr(c.y - this.arcScaleY_ * p.radius), " ",
                     mr(c.x + this.arcScaleX_ * p.radius), ",",
                     mr(c.y + this.arcScaleY_ * p.radius), " ",
                     mr(cStart.x), ",", mr(cStart.y), " ",
                     mr(cEnd.x), ",", mr(cEnd.y));
      }


      // TODO: Following is broken for curves due to
      //       move to proper paths.

      // Figure out dimensions so we can do gradient fills
      // properly
      if(c) {
        if (min.x == null || c.x < min.x) {
          min.x = c.x;
        }
        if (max.x == null || c.x > max.x) {
          max.x = c.x;
        }
        if (min.y == null || c.y < min.y) {
          min.y = c.y;
        }
        if (max.y == null || c.y > max.y) {
          max.y = c.y;
        }
      }
    }
    lineStr.push(' ">');

    if (typeof this.fillStyle == "object") {
      var focus = {x: "50%", y: "50%"};
      var width = (max.x - min.x);
      var height = (max.y - min.y);
      var dimension = (width > height) ? width : height;

      focus.x = mr((this.fillStyle.focus_.x / width) * 100 + 50) + "%";
      focus.y = mr((this.fillStyle.focus_.y / height) * 100 + 50) + "%";

      var colors = [];

      // inside radius (%)
      if (this.fillStyle.type_ == "gradientradial") {
        var inside = (this.fillStyle.radius1_ / dimension * 100);

        // percentage that outside radius exceeds inside radius
        var expansion = (this.fillStyle.radius2_ / dimension * 100) - inside;
      } else {
        var inside = 0;
        var expansion = 100;
      }

      var insidecolor = {offset: null, color: null};
      var outsidecolor = {offset: null, color: null};

      // We need to sort 'colors' by percentage, from 0 > 100 otherwise ie
      // won't interpret it correctly
      this.fillStyle.colors_.sort(function (cs1, cs2) {
        return cs1.offset - cs2.offset;
      });

      for (var i = 0; i < this.fillStyle.colors_.length; i++) {
        var fs = this.fillStyle.colors_[i];

        colors.push( (fs.offset * expansion) + inside, "% ", fs.color, ",");

        if (fs.offset > insidecolor.offset || insidecolor.offset == null) {
          insidecolor.offset = fs.offset;
          insidecolor.color = fs.color;
        }

        if (fs.offset < outsidecolor.offset || outsidecolor.offset == null) {
          outsidecolor.offset = fs.offset;
          outsidecolor.color = fs.color;
        }
      }
      colors.pop();

      lineStr.push('<g_vml_:fill',
                   ' color="', outsidecolor.color, '"',
                   ' color2="', insidecolor.color, '"',
                   ' type="', this.fillStyle.type_, '"',
                   ' focusposition="', focus.x, ', ', focus.y, '"',
                   ' colors="', colors.join(""), '"',
                   ' opacity="', opacity, '" />');
    } else if (aFill) {
      lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity, '" />');
    } else {
      lineStr.push(
        '<g_vml_:stroke',
        ' opacity="', opacity,'"',
        ' joinstyle="', this.lineJoin, '"',
        ' miterlimit="', this.miterLimit, '"',
        ' endcap="', processLineCap(this.lineCap) ,'"',
        ' weight="', this.lineWidth, 'px"',
        ' color="', color,'" />'
      );
    }

    lineStr.push("</g_vml_:shape>");

    this.element_.insertAdjacentHTML("beforeEnd", lineStr.join(""));

    this.currentPath_ = [];
  };

  contextPrototype.fill = function() {
    this.stroke(true);
  }

  contextPrototype.closePath = function() {
    this.currentPath_.push({type: "close"});
  };

  /**
   * @private
   */
  contextPrototype.getCoords_ = function(aX, aY) {
    return {
      x: Z * (aX * this.m_[0][0] + aY * this.m_[1][0] + this.m_[2][0]) - Z2,
      y: Z * (aX * this.m_[0][1] + aY * this.m_[1][1] + this.m_[2][1]) - Z2
    }
  };

  contextPrototype.save = function() {
    var o = {};
    copyState(this, o);
    this.aStack_.push(o);
    this.mStack_.push(this.m_);
    this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
  };

  contextPrototype.restore = function() {
    copyState(this.aStack_.pop(), this);
    this.m_ = this.mStack_.pop();
  };

  contextPrototype.translate = function(aX, aY) {
    var m1 = [
      [1,  0,  0],
      [0,  1,  0],
      [aX, aY, 1]
    ];

    this.m_ = matrixMultiply(m1, this.m_);
  };

  contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
    var m1 = [
      [m11, m12, 0],
      [m21, m22, 0],
      [ dx,  dy, 1]
    ];

    this.m_ = matrixMultiply(m1, this.m_);
  }; 

  contextPrototype.rotate = function(aRot) {
    var c = mc(aRot);
    var s = ms(aRot);

    var m1 = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];

    this.m_ = matrixMultiply(m1, this.m_);
  };

  contextPrototype.scale = function(aX, aY) {
    this.arcScaleX_ *= aX;
    this.arcScaleY_ *= aY;
    var m1 = [
      [aX, 0,  0],
      [0,  aY, 0],
      [0,  0,  1]
    ];

    this.m_ = matrixMultiply(m1, this.m_);
  };

  /******** STUBS ********/
  contextPrototype.clip = function() {
    // TODO: Implement
  };

  contextPrototype.arcTo = function() {
    // TODO: Implement
  };

  contextPrototype.createPattern = function() {
    return new CanvasPattern_;
  };

  // Gradient / Pattern Stubs
  function CanvasGradient_(aType) {
    this.type_ = aType;
    this.radius1_ = 0;
    this.radius2_ = 0;
    this.colors_ = [];
    this.focus_ = {x: 0, y: 0};
  }

  CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
    aColor = processStyle(aColor);
    this.colors_.push({offset: 1-aOffset, color: aColor});
  };

  function CanvasPattern_() {}

  // set up externs
  G_vmlCanvasManager = G_vmlCanvasManager_;
  CanvasRenderingContext2D = CanvasRenderingContext2D_;
  CanvasGradient = CanvasGradient_;
  CanvasPattern = CanvasPattern_;

})();

} // if

function AlbersConic() {"use strict";

	var c, rho0, n, n2, EPS10 = 1.0e-10;

	this.toString = function() {
		return 'Albers Conic';
	};

	this.initialize = function(phi0, phi1, phi2) {
        var cosPhi1, sinPhi1, secant;
        
        if (Math.abs(phi1 + phi2) < EPS10) {
            n = NaN;
            throw new Error("Standard latitudes of Albers conic too close to equator");
        }

        cosPhi1 = Math.cos(phi1);
        sinPhi1 = Math.sin(phi1);
        secant = Math.abs(phi1 - phi2) >= EPS10;
        if (secant) {
            n = 0.5 * (sinPhi1 + Math.sin(phi2));
        } else {
            n = sinPhi1;
        }
        n2 = 2 * n;
        c = cosPhi1 * cosPhi1 + n2 * sinPhi1;
        rho0 = Math.sqrt(c - n2 * Math.sin(phi0)) / n;
    };
    
	this.forward = function(lon, lat, xy) {
		var rho, n_x_lon;
        rho = c - n2 * Math.sin(lat);
        if (rho < 0) {
            xy[0] = NaN;
            xy[1] = NaN;
        }
        rho = Math.sqrt(rho) / n;
        n_x_lon = n * lon;
        xy[0] = rho * Math.sin(n_x_lon);
        xy[1] = rho0 - rho * Math.cos(n_x_lon);
	};
	
	this.initialize(45/180*Math.PI, 45/180*Math.PI, 45/180*Math.PI);
}

function ArdenClose() {"use strict";

	var MAX_LAT = 88 / 180 * Math.PI;

	this.toString = function() {
		return 'Arden-Close';
	};

	this.forward = function(lon, lat, xy) {
		var y1, y2;

		if (lat > MAX_LAT) {
			lat = MAX_LAT;
		} else if (lat < -MAX_LAT) {
			lat = -MAX_LAT;
		}

		y1 = Math.log(Math.tan(Math.PI / 4 + 0.5 * lat));
		y2 = Math.sin(lat);

		xy[0] = lon;
		xy[1] = (y1 + y2) / 2;
	};
}

function Bonne() {"use strict";
    var phi1 = 85 / 180 * Math.PI, cotphi1 = 1 / Math.tan(phi1);
    
	this.toString = function() {
		return 'Bonne (Equal Area)';
	};

    this.getGraticuleHeight = function() {
        return 6;
    };

    this.getStandardParallel = function() {
        return phi1;
    };
    
    this.setStandardParallel = function(stdParallel) {
        phi1 = stdParallel;
        cotphi1 = 1 / Math.tan(phi1);
    };
    
	this.forward = function(lon, lat, xy) {
        var r = cotphi1 + phi1 - lat;
        var E = lon * Math.cos(lat) / r;
		xy[0] = r * Math.sin(E);
		xy[1] = cotphi1 - r * Math.cos(E);
	};
}

function Braun2() {"use strict";

	this.toString = function() {
		return 'Braun2';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = 7 / 5 * Math.sin(lat) / (2 / 5 + Math.cos(lat));
	};
}

/**
 * Canters, F. (2002) Small-scale Map projection Design. p. 218-219.
 * Modified Sinusoidal, equal-area.
 */
function Canters1() {"use strict";

	var C1 = 1.1966, C3 = -0.1290, C3x3 = 3 * C3, C5 = -0.0076, C5x5 = 5 * C5;

	this.toString = function() {
		return 'Canters Modified Sinusoidal I';
	};

	this.forward = function(lon, lat, xy) {
		var y2 = lat * lat,
			y4 = y2 * y2;
		xy[0] = lon * Math.cos(lat) / (C1 + C3x3 * y2 + C5x5 * y4);
		xy[1] = lat * (C1 + C3 * y2 + C5 * y4);
	};
}
/**
 * Canters, F. (2002) Small-scale Map projection Design. p. 218-220.
 * Modified Sinusoidal, equal-area.
 */
function Canters2() {"use strict";
	
	var C1 = 1.1481, C3 = -0.0753, C3x3 = 3 * C3, C5 = -0.0150, C5x5 = 5 * C5;

	this.toString = function() {
		return 'Canters Modified Sinusoidal II';
	};

	this.forward = function(lon, lat, xy) {
		var y2 = lat * lat,
			y4 = y2 * y2;
		xy[0] = lon * Math.cos(lat) / (C1 + C3x3 * y2 + C5x5 * y4);
		xy[1] = lat * (C1 + C3 * y2 + C5 * y4);
	};
}
function CentralCylindrical() {"use strict";
		
	var MAX_LAT = 80 / 180 * Math.PI;
	
	this.toString = function() {
		return 'Central Cylindrical';
	};
	
	this.forward = function(lon, lat, xy) {
		if (lat > MAX_LAT) {
            lat = MAX_LAT;
        } else if (lat < -MAX_LAT) {
            lat = -MAX_LAT;
        }
		xy[0] = lon;
		xy[1] = Math.tan(lat);
	};
}
function CylindricalStereographic() {"use strict";
	var cosPhi0 = Math.cos(30 / 180 * Math.PI);
		
	this.toString = function() {
		return 'Cylindrical Stereographic';
	};
	
	this.getStandardParallel = function() {
		return Math.acos(cosPhi0);
	};
	
	this.setStandardParallel = function(phi0) {
		cosPhi0 = Math.cos(phi0);
	};
	
	this.forward = function(lon, lat, xy) {
		xy[0] = lon * cosPhi0;
		xy[1] = (1 + cosPhi0) * Math.tan(lat / 2);
	};
}
function Eckert4() {"use strict";

	var C_x = 0.42223820031577120149,
		C_y = 1.32650042817700232218,
		C_p = 3.57079632679489661922,
		EPS = 1.0e-7,
		NITER = 6,
		ONE_TOL = 1.00000000000001,
		HALFPI = Math.PI / 2;

	this.toString = function() {
		return 'Eckert IV';
	};

	this.forward = function(lon, lat, xy) {

		var p, V, s, c, i;
		
		p = C_p * Math.sin(lat);
		V = lat * lat;
		lat *= 0.895168 + V * (0.0218849 + V * 0.00826809);
		for ( i = NITER; i > 0; --i) {
			c = Math.cos(lat);
			s = Math.sin(lat);
			lat -= V = (lat + s * (c + 2) - p) / (1 + c * (c + 2) - s * s);
			if (Math.abs(V) < EPS) {
				xy[0] = C_x * lon * (1 + Math.cos(lat));
				xy[1] = C_y * Math.sin(lat);
				return;
			}
		}
		xy[0] = C_x * lon;
		xy[1] = lat < 0 ? -C_y : C_y;
	};

	this.inverse = function (x, y, lonlat) {
		var sinTheta = y / 1.3265004;
		var theta = Math.asin(sinTheta);
        lonlat[0] = x / (0.4222382 * (1 + Math.cos(theta)));
        lonlat[1] = Math.asin((theta + sinTheta * Math.cos(theta) + 2 * sinTheta) / (2 + Math.PI / 2));
    };

}
function EqualAreaCylindrical() {"use strict";
	var cosPhi0 = Math.cos(30 / 180 * Math.PI);

	this.toString = function() {
		return 'Cylindrical Equal-Area';
	};
	
	this.getStandardParallel = function() {
		return Math.acos(cosPhi0);
	};
	
	this.setStandardParallel = function(phi0) {
		cosPhi0 = Math.cos(phi0);
	};
	
	this.forward = function(lon, lat, xy) {
		xy[0] = lon * cosPhi0;
		xy[1] = Math.sin(lat) / cosPhi0;
	};
}
function Equirectangular() {"use strict";
    var cosPhi0 = Math.cos(30 / 180 * Math.PI);
    
	this.toString = function() {
		return 'Equirectangular';
	};

    this.getStandardParallel = function() {
        return Math.acos(cosPhi0);
    };
    
    this.setStandardParallel = function(phi0) {
        cosPhi0 = Math.cos(phi0);
    };
    
	this.forward = function(lon, lat, xy) {
		xy[0] = lon * cosPhi0;
		xy[1] = lat;
	};

	this.inverse = function (x, y, lonlat) {
        lonlat[0] = x / cosPhi0;
        lonlat[1] = y;
    };
}

/**
* Custom shapes between a Lambert azimuthal (w = 1) and a Quartic Authalic (w = 0) can be defined with 
* the optional argument w. If not provided, the default 0.5 for the Hammer projection is used.
*/
function Hammer(w) {
    
    "use strict";

    var w, W_MAX = 0.999999, EPS10 = 1.e-10;

    this.toString = function() {
        switch (w) {
    	    case 0:
        		return 'Quartic Authalic';
	        case 0.5: 
    	    	return 'Hammer';
        	default:
	        	return 'Hammer Customized';
    	}
    };
    
    this.forward = function(lon, lat, xy) {
        var cosLat = Math.cos(lat), d;
        lon *= w;
        d = Math.sqrt(2 / (1 + cosLat * Math.cos(lon)));
        xy[0] = d * cosLat * Math.sin(lon) / w;
        xy[1] = d * Math.sin(lat);
    };
    
    this.inverse = function (x, y, lonlat) {
        var EPS = 1.0e-10;
        var wx = w * x;
        var z = Math.sqrt(1 - 0.25 * (wx * wx + y * y));
        var zz2_1 = 2 * z * z - 1;
        if(Math.abs(zz2_1) < EPS) {
            lonlat[0] = NaN;
            lonlat[1] = NaN;
        } else {
            lonlat[0] = Math.atan2(wx * z, zz2_1) / w;
            lonlat[1] = Math.asin(z * y);
        }
    };

    this.setW = function(weight) {
        w = weight;
        if(w >= W_MAX) {
            w = W_MAX;
        } else if(w < 0) {
             w = 0;
        }
        if (w === 0) {
        	this.forward = this.quarticAuthalicForward;
            this.inverse = this.quarticAuthalicInverse;
        } else {
			//it's already set
            //this.forward = hammerForward;
            //this.inverse = hammerInverse;
        }
    };
    this.setW(arguments.length === 0 ? 0.5 : w);
    
    this.getW = function() {
    	return w;
    };
    
 }
function Kavrayskiy1() {"use strict";

	var PI_HALF = Math.PI / 2, MERCATOR_MAX_LAT = 70 / 180 * Math.PI, DY, C;
    DY = Math.log(Math.tan(0.5 * (PI_HALF + MERCATOR_MAX_LAT)));
    C = 1 / Math.cos(MERCATOR_MAX_LAT);
    
	this.toString = function() {
		return 'Kavrayskiy I';
	};

	this.forward = function(lon, lat, xy) {
	    
		xy[0] = lon;
		if (lat > MERCATOR_MAX_LAT) {
			xy[1] = (lat  - MERCATOR_MAX_LAT) * C + DY;
		} else if (lat < -MERCATOR_MAX_LAT) {
            xy[1] = (lat  + MERCATOR_MAX_LAT) * C - DY;
        } else {
			xy[1] = Math.log(Math.tan(0.5 * (PI_HALF + lat)));
		}
	};
}

function KharchenkoShabanova() {"use strict";
    var K = Math.cos(10 / 180 * Math.PI);
    
	this.toString = function() {
		return 'Kharchenko-Shabanova';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon * K;
		xy[1] = lat * (0.99 + latSqr * (0.0026263 + latSqr * 0.10734));
	};
}

function LambertAzimuthalEqualAreaPolar() {"use strict";

    var FORTPI = Math.PI / 4, southPole = false;

    this.toString = function() {
        return 'Lambert Azimuthal Equal Area - Polar';
    };

    //forwardNorthPole
    this.forward = function(lon, lat, xy) {
        var y = 2 * Math.sin(FORTPI - lat * 0.5);
        xy[0] = y * Math.sin(lon);
        xy[1] = y * -Math.cos(lon);
    };

    function forwardSouthPole(lon, lat, xy) {
        var y = 2 * Math.cos(FORTPI - lat * 0.5);
        xy[0] = y * Math.sin(lon);
        xy[1] = y * Math.cos(lon);
    }


    this.getGraticuleWidth = function() {
        return 4;
    };

    this.getGraticuleHeight = function() {
        return 4;
    };

    this.isPoleInsideGraticule = function() {
        return true;
    };
}
function LambertAzimuthalOblique() {"use strict";

	var EPS10 = 1.e-10, lat0 = 0, cosLat0 = 1, sinLat0 = 0;

	this.toString = function() {
		return 'Lambert Azimuthal Oblique';
	};

	this.initialize = function(lat0) {
        cosLat0 = Math.cos(lat0);
        sinLat0 = Math.sin(lat0);
    };
    
	this.forward = function(lon, lat, xy) {
		var y, sinLat = Math.sin(lat), cosLat = Math.cos(lat), cosLon = Math.cos(lon), sinLon = Math.sin(lon);
        y = 1 + sinLat0 * sinLat + cosLat0 * cosLat * cosLon;
        // the projection is indeterminate for lon = PI and lat = -lat0
        // this point would have to be plotted as a circle
        // The following Math.sqrt will return NaN in this case.
        y = Math.sqrt(2 / y);
        xy[0] = y * cosLat * sinLon;
        xy[1] = y * (cosLat0 * sinLat - sinLat0 * cosLat * cosLon);
	};
	
	this.initialize(45*Math.PI/180);
}

function LambertEqualAreaCylindrical() {"use strict";

    this.toString = function() {
        return 'Lambert Cylindrical Equal-Area';
    };

    this.forward = function(lon, lat, xy) {
        xy[0] = lon;
        xy[1] = Math.sin(lat);
    };

    this.inverse = function (x, y, lonlat) {
        lonlat[0] = x;
        lonlat[1] = Math.asin(y);
    };
}

function Mercator() {"use strict";

	var PI_HALF = Math.PI / 2, WEB_MERCATOR_MAX_LAT = 1.4844222297453322;

	this.toString = function() {
		return 'Mercator';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		if (lat > WEB_MERCATOR_MAX_LAT) {
			xy[1] = Math.PI;
		} else if (lat < -WEB_MERCATOR_MAX_LAT) {
			xy[1] = -Math.PI;
		} else {
			xy[1] = Math.log(Math.tan(0.5 * (PI_HALF + lat)));
		}
	};
}

// by O. M. Miller
function Miller() {"use strict";

	this.toString = function() {
		return 'Miller';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = Math.log(Math.tan(Math.PI / 4 + lat * 0.4)) * 1.25;
	};
}

// by O. M. Miller
function Miller2() {"use strict";

	this.toString = function() {
		return 'Miller II';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = Math.log(Math.tan(Math.PI / 4 + lat / 3)) * 1.5;
	};
}

function MillerPerspective() {"use strict";

	this.toString = function() {
		return 'Miller Perspective';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = (Math.sin(lat / 2) + Math.tan(lat / 2));
	};
}

function MillerTransformation() {"use strict";

	var PI_HALF = Math.PI / 2, EPS = 1e-4, n = 1.5, m = 1.5;

	this.toString = function() {
		return 'Miller Transformation';
	};

	this.getM = function() {
		return m;
	};

	this.setM = function(M) {
		m = M;
	};

	this.getN = function() {
		return n;
	};

	this.setN = function(N) {
		n = N;
	};
	
	this.getAspectRatio = function() {
		return n * Math.log(Math.tan(0.5 * PI_HALF * (1 + 1 / n))) / Math.PI;
	};

	this.setAspectRatio = function(aspect) {
		if (aspect <= 0.5) {
			m = n = 1 / EPS;
		} else {
			var Cc = 1.05, tol = 1, F, Fder1, Fder2, angle;
			while (Math.abs(tol) > EPS) {
				angle = 0.5 * PI_HALF * (1 + 1 / Cc);
				F = Cc * Math.log(Math.tan(angle)) - aspect * Math.PI;
				Fder1 = Math.log(Math.tan(angle));
				Fder2 = Math.tan(angle) * Math.cos(angle) * Math.cos(angle) * Cc;
				Cc -= tol = F / (Fder1 - 0.5 * PI_HALF / Fder2);
			}
			m = n = Cc;
		}
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = m * Math.log(Math.tan(0.5 * (PI_HALF + lat / n)));
	};
}

function Mollweide() {"use strict";

    var MAX_ITER = 10,
		TOLERANCE = 1.0e-7,
        cx, cy, cp;

    this.toString = function() {
        return 'Mollweide';
    };

    // FIXME
    (function() {
        var p = Math.PI / 2, r, sp, p2 = p + p;
        sp = Math.sin(p);
        r = Math.sqrt(Math.PI * 2.0 * sp / (p2 + Math.sin(p2)));
        cx = 2 * r / Math.PI;
        cy = r / sp;
        cp = p2 + Math.sin(p2);
    })();

    this.forward = function(lon, lat, xy) {
        var k, v, i;
        k = cp * Math.sin(lat);
        for ( i = MAX_ITER; i !== 0; i--) {
            lat -= v = (lat + Math.sin(lat) - k) / (1 + Math.cos(lat));
            if (Math.abs(v) < TOLERANCE) {
                break;
            }
        }
        if (i === 0) {
            lat = (lat < 0) ? -Math.PI / 2 : Math.PI / 2;
        } else {
            lat *= 0.5;
        }
        xy[0] = cx * lon * Math.cos(lat);
        xy[1] = cy * Math.sin(lat);
    };

    this.inverse = function (x, y, lonlat) {
        var theta, sinTheta, cosTheta;
        // 1 / sqrt(2) = 0.70710678118655
        sinTheta = y * 0.70710678118655;
        theta = Math.asin(sinTheta);
        cosTheta = Math.cos(theta);
        // Math.PI / (2 * sqrt(2)) = 1.11072073453959
        lonlat[0] = x * 1.11072073453959 / cosTheta;
        lonlat[1] = Math.asin(2 * (theta + sinTheta * cosTheta) / Math.PI);
    };
}
function NaturalEarth() {"use strict";

    var MAX_Y = 0.8707 * 0.52 * Math.PI;

    this.toString = function() {
        return 'Natural Earth';
    };    

    this.forward = function(lon, lat, xy) {
        var lat2 = lat * lat, lat4 = lat2 * lat2;
		
        xy[0] = lon * (0.8707 - 0.131979 * lat2 + lat4 * (-0.013791 + lat4 * (0.003971 * lat2 - 0.001529 * lat4)));
        xy[1] = lat * (1.007226 + lat2 * (0.015085 + lat4 * (-0.044475 + 0.028874 * lat2 - 0.005916 * lat4)));
    };
}
function Pavlov() {"use strict";

	this.toString = function() {
		return 'Pavlov';
	};

	this.forward = function(lon, lat, xy) {
		var phi3, phi5;

		phi3 = lat * lat * lat;
		phi5 = phi3 * lat * lat;

		xy[0] = lon;
		xy[1] = (lat - 0.1531 / 3 * phi3 - 0.0267 / 5 * phi5);
	};
}

/**
	Approximation by Canters & Decleir
*/
function Robinson() {"use strict";
    this.toString = function() {
        return 'Robinson';
    };

    this.forward = function(lon, lat, xy) {
        var lat2 = lat * lat;
        xy[0] = lon * (0.8507 - lat2 * (0.1450 + lat2 * 0.0104));
        xy[1] = lat * (0.9642 - lat2 * (0.0013 + lat2 * 0.0129));
    };
}
function Sinusoidal() {"use strict";

	this.toString = function() {
		return 'Sinusoidal (Equal Area)';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon * Math.cos(lat);
		xy[1] = lat;
	};

	this.inverse = function (x, y, lonlat) {
        lonlat[0] = x / Math.cos(y);
        lonlat[1] = y;
    };
}
function Strebe1995() {"use strict";

	var kg = 1.35, forward1 = new Eckert4(), inv = new Mollweide(), forward2 = new Hammer();

	this.setScaleFactor = function(sf) {
		kg = sf;
	};

	this.setForward1 = function(f1) {
		forward1 = f1;
	};
	
	this.setForward2 = function(f2) {
		forward2 = f2;
	};

	this.setInverse = function(inverse) {
		inv = inverse;
	};
		
	this.toString = function() {
		return 'Strebe 1995 (Equal Area)';
	};

	this.forward = function(lon, lat, xy) {
		// Eckert IV
		forward1.forward(lon, lat, xy);
		// Mollweide
		inv.inverse(xy[0] * kg, xy[1] / kg, xy);
		// Hammer
		forward2.forward(xy[0], xy[1], xy);
		xy[0] /= kg;
		xy[1] *= kg;
	};
}
function Tobler1() {"use strict";

	this.toString = function() {
		return 'Tobler I';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = lat * (1 + lat * lat / 6);
	};
}

function Tobler2() {"use strict";

	this.toString = function() {
		return 'Tobler II';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon;
		xy[1] = lat * (1 + latSqr / 6 + latSqr * latSqr / 24);
	};

}

function TransformableLambert() {"use strict";

    var m, n, CA, CB, poleInsideGraticule, cosLat0;

    function forwardTransformableLambert(lon, lat, xy) {
        var sin_O, cos_O, y;

        // FIXME the resulting x coordinate is NaN if lon is Math.PI
        
        lon *= n;
        sin_O = m * Math.sin(lat);
        cos_O = Math.sqrt(1 - sin_O * sin_O);
        y = 1 + cos_O * Math.cos(lon);
        y = Math.sqrt(2 / y);
        xy[0] = CA * y * cos_O * Math.sin(lon);
        xy[1] = CB * y * sin_O;
    }

    function forwardCylindrical(lon, lat, xy) {
        xy[0] = lon * cosLat0;
        xy[1] = Math.sin(lat) / cosLat0;
    }


    this.initialize = function(lonLimit, latLimit, p) {
        var k, d, cylindrical;

        //lonLimit = Math.min(lonLimit, Math.PI);
        //latLimit = Math.min(latLimit, Math.PI / 2);

        cylindrical = (lonLimit < 1e-10) && (latLimit < 1e-10);
        if (cylindrical) {
            this.forward = forwardCylindrical;

            // standard parallel of equal-area cylindrical projection
            cosLat0 = Math.sqrt(p / Math.PI);
        } else {
            this.forward = forwardTransformableLambert;

            // FIXME
            lonLimit = Math.max(lonLimit, 1e-10);
            latLimit = Math.max(latLimit, 1e-10);

            m = Math.sin(latLimit);
            n = lonLimit / Math.PI;
            k = Math.sqrt(p * Math.sin(latLimit / 2) / Math.sin(lonLimit / 2));
            d = Math.sqrt(m * n);
            CA = k / d;
            CB = 1 / (k * d);
        }

        poleInsideGraticule = (lonLimit === Math.PI);
    };

    this.isPoleInsideGraticule = function() {
        return poleInsideGraticule;
    };

    // FIXME this should not be required, but is currently a fix for the fact that forward() returns
    // NaN for the x coordinate if lon is Math.PI
    this.getGraticuleWidth = function() {
        var xy = [];
        this.forward(Math.PI - 1e-6, 0, xy);
        return xy[0] * 2;
    };

    this.initialize(Math.PI / 2, Math.PI / 4, Math.sqrt(2));
}
function TransverseTransformableLambert() {"use strict";

    var m, n, CA, CB, azimuthal;

    this.initialize = function(lam1, phi1, p) {
        var k, d;

        lam1 = Math.max(lam1, 0.0000001);
        phi1 = Math.max(phi1, 0.0000001);

        m = Math.sin(phi1);
        n = lam1 / Math.PI;
        k = Math.sqrt(p * Math.sin(phi1 / 2) / Math.sin(lam1 / 2));
        d = Math.sqrt(m * n);
        CA = k / d;
        CB = 1 / (k * d);
        azimuthal = (p === 1.5);
    };

    this.forward = function(lon, lat, xy) {

        var sin_O, cos_O, y, cosLon, cosLat, sinLat;

        // transverse
        lon += Math.PI / 2;   
        cosLon = Math.cos(lon);
        cosLat = Math.cos(lat);
        lon = Math.atan2(cosLat * Math.sin(lon), Math.sin(lat));
        // FIXME adjust longitude
        sinLat = -cosLat * cosLon;
        
        //sinLat = Math.sin(lat);
        
        lon *= n;
        sin_O = m * sinLat;
        cos_O = Math.sqrt(1 - sin_O * sin_O);
        y = 1 + cos_O * Math.cos(lon);
        y = Math.sqrt(2 / y);
        xy[1] = -CA * y * cos_O * Math.sin(lon);
        xy[0] = CB * y * sin_O;
    };
    
    // FIXME
    this.getGraticuleWidth = function() {
        return 4;
    };

    // FIXME
    this.getGraticuleHeight = function() {
        return 4;
    };
    
    this.isPoleInsideGraticule = function() {
        return azimuthal;
    };

    this.initialize(Math.PI / 2, Math.PI / 4, 1.5);
}
function Urmayev2() {"use strict";

	this.toString = function() {
		return 'Urmayev II';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon;
		xy[1] = lat * (1 + 0.1275561329783 * latSqr + 0.0133641090422587 * latSqr * latSqr);
	};
}

function Urmayev3() {"use strict";

	this.toString = function() {
		return 'Urmayev III';
	};

	this.forward = function(lon, lat, xy) {
		var a0 = 0.92813433, a2 = 1.11426959;
        
		xy[0] = lon;
		xy[1] = lat * (a0 + a2 / 3 * lat * lat);
	};
}

// w = 1: standard Wagner VII
// w = 0: Lambert azimuthal (limiting case, not included here)
// w is optional, default is w = 1
function Wagner7(w) {"use strict";
	
	var m, n, CA, CB, EPS10 = 1.e-10;

	this.toString = function() {
		return 'Wagner VII' + (w !== 1 ? ' Customized' : '');
	};

	this.forward = function(lon, lat, xy) {
		var  sinO, cosO, d;
		
		sinO = m * Math.sin(lat);
		cosO = Math.sqrt(1 - sinO * sinO);
		d = Math.sqrt(2. / (1. + cosO * Math.cos(lon *= n)));
		xy[0] = CA * d * cosO * Math.sin(lon);
		xy[1] = CB * d * sinO;
	};

	this.setW = function(weight) {
		var k, k2;
		
		w = weight;
		if (w >= 1) {
			w = 1;
		} else {
			if (w < EPS10) {
				w = EPS10;
			}
		}
		// constant values
		m = Math.sin(65 / 180 * Math.PI) * w + 1 - w;
		n = 1 / 3 * w + 1 - w;
		k = Math.sqrt((1.0745992166936477 * w + 1 - w) / Math.sin(Math.PI / 2 * n));
		k2 = Math.sqrt(m * n);
		CA = k / k2;
		CB = 1 / (k * k2);
	};
	this.setW(arguments.length === 0 ? 1 : w);
}
function WagnerPseudocylindrical() {"use strict";

	var m, n, CA, CB, EPS10 = 1.e-10;

	this.toString = function() {
		return 'Wagner Pseudocylindrical';
	};

	this.forward = function(lon, lat, xy) {
		this.setW(61.9 / 180. * Math.PI, 2.03);

		var sinO, cosO, d;

		sinO = m * Math.sin(lat);
		cosO = Math.sqrt(1 - sinO * sinO);
		d = Math.sqrt(2. / (1. + cosO));
		xy[0] = CA * d * cosO * lon;
		xy[1] = CB * d * sinO;
	};

	this.inverse = function(x, y, lonlat) {
		this.setW(65. / 180. * Math.PI, 2.);

		sinO_2 = y / (2 * CB);
		cosO_2 = Math.sqrt(1 - sinO_2 * sinO_2);

		lonlat[0] = (x / CA) * cosO_2 / (2 * cosO_2 * cosO_2 - 1);
		lonlat[1] = Math.asin(2 * sinO_2 * cosO_2 / m);
	};

	this.setW = function(latB, ratio) {

		if (latB < EPS10) {
			latB = EPS10;
		}

		m = Math.sin(latB);
		var k = Math.sqrt(2 * ratio * Math.sin(latB / 2.) / Math.PI);
		var k2 = Math.sqrt(m);
		CA = k / k2;
		CB = 1 / (k * k2);
		
		console.log('CA', CA);
		console.log('CB', CB);
		console.log('m', m);
	};

}
// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

function ShpFile(binFile) {

	var src = new BinaryFileWrapper(binFile);

	var t1 = new Date().getTime();
	this.header = new ShpHeader(src);

	var t2 = new Date().getTime();
	//if (window.console && window.console.log) console.log('parsed header in ' + (t2-t1) + ' ms');

	//if (window.console && window.console.log) console.log('got header, parsing records');

	t1 = new Date().getTime();
	this.records = [];
	while (true) {
		try {
			this.records.push(new ShpRecord(src));
		} catch (e) {
			if (e.id !== ShpError.ERROR_NODATA) {
				alert(e);
			}
			break;
		}
	}

	t2 = new Date().getTime();
	//if (window.console && window.console.log) console.log('parsed records in ' + (t2-t1) + ' ms');

}

/**
 * The ShpType class is a place holder for the ESRI Shapefile defined
 * shape types.
 * @author Edwin van Rijkom
 *
 */
var ShpType = {

	/**
	 * Unknow Shape Type (for internal use)
	 */
	SHAPE_UNKNOWN : -1,
	/**
	 * ESRI Shapefile Null Shape shape type.
	 */
	SHAPE_NULL : 0,
	/**
	 * ESRI Shapefile Point Shape shape type.
	 */
	SHAPE_POINT : 1,
	/**
	 * ESRI Shapefile PolyLine Shape shape type.
	 */
	SHAPE_POLYLINE : 3,
	/**
	 * ESRI Shapefile Polygon Shape shape type.
	 */
	SHAPE_POLYGON : 5,
	/**
	 * ESRI Shapefile Multipoint Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_MULTIPOINT : 8,
	/**
	 * ESRI Shapefile PointZ Shape shape type.
	 */
	SHAPE_POINTZ : 11,
	/**
	 * ESRI Shapefile PolylineZ Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_POLYLINEZ : 13,
	/**
	 * ESRI Shapefile PolygonZ Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_POLYGONZ : 15,
	/**
	 * ESRI Shapefile MultipointZ Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_MULTIPOINTZ : 18,
	/**
	 * ESRI Shapefile PointM Shape shape type
	 */
	SHAPE_POINTM : 21,
	/**
	 * ESRI Shapefile PolyLineM Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_POLYLINEM : 23,
	/**
	 * ESRI Shapefile PolygonM Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_POLYGONM : 25,
	/**
	 * ESRI Shapefile MultiPointM Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_MULTIPOINTM : 28,
	/**
	 * ESRI Shapefile MultiPatch Shape shape type
	 * (currently unsupported).
	 */
	SHAPE_MULTIPATCH : 31

};

/**
 * Constructor.
 * @param src
 * @return
 * @throws ShpError Not a valid shape file header
 * @throws ShpError Not a valid signature
 *
 */
function ShpHeader(src) {
	if (src.getLength() < 100)
		alert("Not a valid shape file header (too small)");

	if (src.getSLong() != 9994)
		alert("Not a valid signature. Expected 9994");

	// skip 5 integers;
	src.position += 5 * 4;

	// read file-length:
	this.fileLength = src.getSLong();

	// switch endian:
	src.bigEndian = false;

	// read version:
	this.version = src.getSLong();

	// read shape-type:
	this.shapeType = src.getSLong();

	// read bounds:
	this.boundsXY = {
		x : src.getDouble(),
		y : src.getDouble(),
		width : src.getDouble(),
		height : src.getDouble()
	};

	this.boundsZ = {
		x : src.getDouble(),
		y : src.getDouble()
	};

	this.boundsM = {
		x : src.getDouble(),
		y : src.getDouble()
	};
}

function ShpRecord(src) {
	var availableBytes = src.getLength() - src.position;

	if (availableBytes == 0)
		throw (new ShpError("No Data", ShpError.ERROR_NODATA));

	if (availableBytes < 8)
		throw (new ShpError("Not a valid record header (too small)"));

	src.bigEndian = true;

	this.number = src.getSLong();
	this.contentLength = src.getSLong();
	this.contentLengthBytes = this.contentLength * 2 - 4;
	src.bigEndian = false;
	var shapeOffset = src.position;
	this.shapeType = src.getSLong();

	switch(this.shapeType) {
		case ShpType.SHAPE_POINT:
			this.shape = new ShpPoint(src, this.contentLengthBytes);
			break;
		case ShpType.SHAPE_POINTZ:
			this.shape = new ShpPointZ(src, this.contentLengthBytes);
			break;
		case ShpType.SHAPE_POLYGON:
			this.shape = new ShpPolygon(src, this.contentLengthBytes);
			break;
		case ShpType.SHAPE_POLYLINE:
			this.shape = new ShpPolyline(src, this.contentLengthBytes);
			break;
		case ShpType.SHAPE_MULTIPATCH:
		case ShpType.SHAPE_MULTIPOINT:
		case ShpType.SHAPE_MULTIPOINTM:
		case ShpType.SHAPE_MULTIPOINTZ:
		case ShpType.SHAPE_POINTM:
		case ShpType.SHAPE_POLYGONM:
		case ShpType.SHAPE_POLYGONZ:
		case ShpType.SHAPE_POLYLINEZ:
		case ShpType.SHAPE_POLYLINEM:
			throw (new ShpError(this.shapeType + " Shape type is currently unsupported by this library"));
			break;
		default:
			throw (new ShpError("Encountered unknown shape type (" + this.shapeType + ")"));
			break;
	}
}

function ShpPoint(src, size) {
	this.type = ShpType.SHAPE_POINT;
	if (src) {
		if (src.getLength() - src.position < size)
			throw (new ShpError("Not a Point record (too small)"));
		this.x = (size > 0) ? src.getDouble() : NaN;
		this.y = (size > 0) ? src.getDouble() : NaN;
	}
}

function ShpPointZ(src, size) {
	this.type = ShpType.SHAPE_POINTZ;
	if (src) {
		if (src.getLength() - src.position < size)
			throw (new ShpError("Not a Point record (too small)"));
		this.x = (size > 0) ? src.getDouble() : NaN;
		this.y = (size > 0) ? src.getDouble() : NaN;
		this.z = (size > 16) ? src.getDouble() : NaN;
		this.m = (size > 24) ? src.getDouble() : NaN;
	}
}

function ShpPolygon(src, size) {
	// for want of a super()
	ShpPolyline.apply(this, [src, size]);
	this.type = ShpType.SHAPE_POLYGON;
}

function ShpPolyline(src, size) {
	this.type = ShpType.SHAPE_POLYLINE;
	this.rings = [];
	if (src) {
		if (src.getLength() - src.position < size)
			throw (new ShpError("Not a Polygon record (too small)"));

		src.bigEndian = false;

		this.box = {
			x : src.getDouble(),
			y : src.getDouble(),
			width : src.getDouble(),
			height : src.getDouble()
		};

		var rc = src.getSLong();
		var pc = src.getSLong();

		var ringOffsets = [];
		while (rc--) {
			var ringOffset = src.getSLong();
			ringOffsets.push(ringOffset);
		}

		var points = [];
		while (pc--) {
			points.push(new ShpPoint(src, 16));
		}

		// convert points, and ringOffsets arrays to an array of rings:
		var removed = 0;
		var split;
		ringOffsets.shift();
		while (ringOffsets.length) {
			split = ringOffsets.shift();
			this.rings.push(points.splice(0, split - removed));
			removed = split;
		}
		this.rings.push(points);
	}
}

function ShpError(msg, id) {
	this.msg = msg;
	this.id = id;
	this.toString = function() {
		return this.msg;
	};
}

ShpError.ERROR_UNDEFINED = 0;
// a 'no data' error is thrown when the byte array runs out of data.
ShpError.ERROR_NODATA = 1;


