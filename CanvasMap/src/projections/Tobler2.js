function Tobler2() {"use strict";

	this.toString = function() {
		return 'Tobler II';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon;
		xy[1] = lat * (1 + latSqr / 6 + latSqr * latSqr / 24);
	};

}
