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
}