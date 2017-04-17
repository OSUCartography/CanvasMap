function Wagner1() {"use strict";
	
	var C_x = 0.8773826753, 
		Cy = 1.139753528477,
		n = 0.8660254037844386467637231707,
	 	C_y = Cy / n;

	this.toString = function() {
		return 'Wagner I';
	};

	this.forward = function(lon, lat, xy) {	
		var lat = Math.asin(n * Math.sin(lat));
        xy[0] = C_x * lon * Math.cos(lat);
        xy[1] = C_y * lat;
	};
	
	this.inverse = function (x, y, lonlat) {
		y /= C_y;
        lonlat[1] = Math.asin(Math.sin(y) / n);
        lonlat[0] = x / (C_x * Math.cos(y));
    };
}