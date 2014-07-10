function ArdenClose() {"use strict";

	var MAX_LAT = 88 / 180 * Math.PI;

	this.toString = function() {
		return 'Arden-Close';
	};

	this.forward = function(lon, lat, xy) {
		var y1, y2;

		if (lat > MAX_LAT) {
			lat = MAX_LAT;
		} else if (lat < -MAX_LAT) {
			lat = -MAX_LAT;
		}

		y1 = Math.log(Math.tan(Math.PI / 4 + 0.5 * lat));
		y2 = Math.sin(lat);

		xy[0] = lon;
		xy[1] = (y1 + y2) / 2;
	};
}
