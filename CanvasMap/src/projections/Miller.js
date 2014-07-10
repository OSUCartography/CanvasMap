// by O. M. Miller
function Miller() {"use strict";

	this.toString = function() {
		return 'Miller';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = Math.log(Math.tan(Math.PI / 4 + lat * 0.4)) * 1.25;
	};
}
