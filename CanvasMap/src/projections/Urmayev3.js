function Urmayev3() {"use strict";

	this.toString = function() {
		return 'Urmayev III';
	};

	this.forward = function(lon, lat, xy) {
		var a0 = 0.92813433, a2 = 1.11426959;
        
		xy[0] = lon;
		xy[1] = lat * (a0 + a2 / 3 * lat * lat);
	};
}
