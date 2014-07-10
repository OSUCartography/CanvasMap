function MillerPerspective() {"use strict";

	this.toString = function() {
		return 'Miller Perspective';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = (Math.sin(lat / 2) + Math.tan(lat / 2));
	};
}
