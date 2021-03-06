function SineSeries(p, q) {
    "use strict";

    if (arguments.length < 2) {
        p = 1.33;
        q = 1.135;
    }

    var k = q / p;

    this.toString = function () {
        return 'Sine Series';
    };

    this.setP = function (newP) {
        p = parseFloat(newP);
        k = q / p;
    };

    this.setQ = function (newQ) {
        q = parseFloat(newQ);
        k = q / p;
    };

    this.forward = function (lon, lat, xy) {
        var x = k * lon * Math.cos(lat);
        lat /= q;
        xy[0] = x / Math.cos(lat);
        xy[1] = p * Math.sin(lat);
    };

    this.inverse = function (x, y, lonlat) {
        y /= p;
        var lat = Math.asin(y),
                c = Math.cos(lat);
        lonlat[1] = lat *= q;
        lonlat[0] = x / (k * Math.cos(lat)) * c;
    };
}