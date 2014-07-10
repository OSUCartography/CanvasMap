/**
 * Canters, F. (2002) Small-scale Map projection Design. p. 218-219.
 * Modified Sinusoidal, equal-area.
 */
function Canters1() {"use strict";

	var C1 = 1.1966, C3 = -0.1290, C3x3 = 3 * C3, C5 = -0.0076, C5x5 = 5 * C5;

	this.toString = function() {
		return 'Canters Modified Sinusoidal I';
	};

	this.forward = function(lon, lat, xy) {
		var y2 = lat * lat,
			y4 = y2 * y2;
		xy[0] = lon * Math.cos(lat) / (C1 + C3x3 * y2 + C5x5 * y4);
		xy[1] = lat * (C1 + C3 * y2 + C5 * y4);
	};
}