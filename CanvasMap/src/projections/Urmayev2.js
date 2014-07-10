function Urmayev2() {"use strict";

	this.toString = function() {
		return 'Urmayev II';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon;
		xy[1] = lat * (1 + 0.1275561329783 * latSqr + 0.0133641090422587 * latSqr * latSqr);
	};
}
