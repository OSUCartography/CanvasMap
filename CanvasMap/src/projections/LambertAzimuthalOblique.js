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
