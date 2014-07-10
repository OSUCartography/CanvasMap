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
