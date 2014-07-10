function KharchenkoShabanova() {"use strict";
    var K = Math.cos(10 / 180 * Math.PI);
    
	this.toString = function() {
		return 'Kharchenko-Shabanova';
	};

	this.forward = function(lon, lat, xy) {
		var latSqr = lat * lat;

		xy[0] = lon * K;
		xy[1] = lat * (0.99 + latSqr * (0.0026263 + latSqr * 0.10734));
	};
}
