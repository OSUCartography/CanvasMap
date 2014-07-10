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