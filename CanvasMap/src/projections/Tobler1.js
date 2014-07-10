function Tobler1() {"use strict";

	this.toString = function() {
		return 'Tobler I';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = lat * (1 + lat * lat / 6);
	};
}
