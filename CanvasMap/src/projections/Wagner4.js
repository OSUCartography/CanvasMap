function Wagner4() {"use strict";
	
	var MAX_ITER = 10,
		TOLERANCE = 1e-7,
		p2 = Math.PI / 3 * 2,
		sp = Math.sin(Math.PI / 3),
        r = Math.sqrt(Math.PI * 2.0 * sp / (p2 + Math.sin(p2))),
        cx = 2. * r / Math.PI,
        cy = r / sp,
        cp = p2 + Math.sin(p2);

	this.toString = function() {
		return 'Wagner IV';
	};

	this.forward = function(lon, lat, xy) {	
        var k = cp * Math.sin(lat), v, i;
        for (i = MAX_ITER; i != 0; i--) {
            lat -= v = (lat + Math.sin(lat) - k) / (1. + Math.cos(lat));
            if (Math.abs(v) < TOLERANCE) {
                break;
            }
        }
        if (i == 0) {
            lat = (lat < 0.) ? -Math.PI / 2 : Math.PI / 2;
        } else {
            lat *= 0.5;
        }
        xy[0] = cx * lon * Math.cos(lat);
        xy[1] = cy * Math.sin(lat);
	};
	
	this.inverse = function (x, y, lonlat) {
		var lat = Math.asin(y / cy); // FIXME: test for out of bounds
        lonlat[0] = x / (cx * Math.cos(lat));
        lat += lat;
        lonlat[1] = Math.asin((lat + Math.sin(lat)) / cp);// FIXME: test for out of bounds as in Proj4
    };
}