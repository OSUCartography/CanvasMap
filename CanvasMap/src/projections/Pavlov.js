function Pavlov() {"use strict";

	this.toString = function() {
		return 'Pavlov';
	};

	this.forward = function(lon, lat, xy) {
		var phi3, phi5;

		phi3 = lat * lat * lat;
		phi5 = phi3 * lat * lat;

		xy[0] = lon;
		xy[1] = (lat - 0.1531 / 3 * phi3 - 0.0267 / 5 * phi5);
	};
}
