// by O. M. Miller
function Miller2() {"use strict";

	this.toString = function() {
		return 'Miller II';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = Math.log(Math.tan(Math.PI / 4 + lat / 3)) * 1.5;
	};
}
