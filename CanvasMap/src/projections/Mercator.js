function Mercator() {"use strict";

	var PI_HALF = Math.PI / 2, WEB_MERCATOR_MAX_LAT = 1.4844222297453322;

	this.toString = function() {
		return 'Mercator';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		if (lat > WEB_MERCATOR_MAX_LAT) {
			xy[1] = Math.PI;
		} else if (lat < -WEB_MERCATOR_MAX_LAT) {
			xy[1] = -Math.PI;
		} else {
			xy[1] = Math.log(Math.tan(0.5 * (PI_HALF + lat)));
		}
	};
}
