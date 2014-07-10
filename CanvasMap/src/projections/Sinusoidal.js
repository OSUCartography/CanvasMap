function Sinusoidal() {"use strict";

	this.toString = function() {
		return 'Sinusoidal (Equal Area)';
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon * Math.cos(lat);
		xy[1] = lat;
	};

	this.inverse = function (x, y, lonlat) {
        lonlat[0] = x / Math.cos(y);
        lonlat[1] = y;
    };
}