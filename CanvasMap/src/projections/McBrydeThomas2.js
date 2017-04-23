function McBrydeThomas2() {
    "use strict";

    var MAX_ITER = 10,
            LOOP_TOL = 1e-7,
            C1 = 0.45503,
            C2 = 1.36509,
            C3 = 1.41546,
            C_x = 0.22248,
            C_y = 1.44492,
            C1_2 = 0.33333333333333333333333333;


    this.toString = function () {
        return 'McBryde-Thomas II';
    };

    this.forward = function (lon, lat, xy) {
        var V, t, i, k = C3 * Math.sin(lat);
        for (i = MAX_ITER; i; --i) {
            t = lat / C2;
            lat -= V = (C1 * Math.sin(t) + Math.sin(lat) - k) /
                    (C1_2 * Math.cos(t) + Math.cos(lat));
            if (Math.abs(V) < LOOP_TOL)
                break;
        }
        t = lat / C2;
        xy[0] = C_x * lon * (1. + 3. * Math.cos(lat) / Math.cos(t));
        xy[1] = C_y * Math.sin(t);
    };

    this.inverse = function (x, y, lonlat) {
        var t = Math.asin(y / C_y),
                phi = C2 * t;
        lonlat[0] = x / (C_x * (1 + 3 * Math.cos(phi) / Math.cos(t)));
        lonlat[1] = Math.asin((C1 * Math.sin(t) + Math.sin(phi)) / C3);
    };
}