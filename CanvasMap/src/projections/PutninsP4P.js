function PutninsP4P() {"use strict";
	
	var C_x = 0.874038744,
        C_y = 3.883251825;

	this.toString = function() {
		return 'Putnins P4\'';
	};

	this.forward = function(lon, lat, xy) {	
        lat = Math.asin(0.883883476 * Math.sin(lat));
        xy[0] = C_x * lon * Math.cos(lat);
        xy[0] /= Math.cos(lat *= 0.333333333333333);
        xy[1] = C_y * Math.sin(lat);
	};
	
	this.inverse = function (x, y, lonlat) {
		lonlat[1] = Math.asin(y / C_y);
        lonlat[0] = x * Math.cos(lonlat[1]) / C_x;
        lonlat[1] *= 3.;
        lonlat[0] /= Math.cos(lonlat[1]);
        lonlat[1] = Math.asin(1.13137085 * Math.sin(lonlat[1]));
    };
}