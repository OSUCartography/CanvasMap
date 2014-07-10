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