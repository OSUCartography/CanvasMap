function Eckert4() {"use strict";

	var C_x = 0.42223820031577120149,
		C_y = 1.32650042817700232218,
		C_p = 3.57079632679489661922,
		EPS = 1.0e-7,
		NITER = 6,
		ONE_TOL = 1.00000000000001,
		HALFPI = Math.PI / 2;

	this.toString = function() {
		return 'Eckert IV';
	};

	this.forward = function(lon, lat, xy) {

		var p, V, s, c, i;
		
		p = C_p * Math.sin(lat);
		V = lat * lat;
		lat *= 0.895168 + V * (0.0218849 + V * 0.00826809);
		for ( i = NITER; i > 0; --i) {
			c = Math.cos(lat);
			s = Math.sin(lat);
			lat -= V = (lat + s * (c + 2) - p) / (1 + c * (c + 2) - s * s);
			if (Math.abs(V) < EPS) {
				xy[0] = C_x * lon * (1 + Math.cos(lat));
				xy[1] = C_y * Math.sin(lat);
				return;
			}
		}
		xy[0] = C_x * lon;
		xy[1] = lat < 0 ? -C_y : C_y;
	};

	this.inverse = function (x, y, lonlat) {
		var sinTheta = y / 1.3265004;
		var theta = Math.asin(sinTheta);
        lonlat[0] = x / (0.4222382 * (1 + Math.cos(theta)));
        lonlat[1] = Math.asin((theta + sinTheta * Math.cos(theta) + 2 * sinTheta) / (2 + Math.PI / 2));
    };

}