function Braun2() {"use strict";

	this.toString = function() {
		return 'Braun2';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = 7 / 5 * Math.sin(lat) / (2 / 5 + Math.cos(lat));
	};
}
