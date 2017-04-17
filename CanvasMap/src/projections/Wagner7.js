// w = 1: standard Wagner VII
// w = 0: Lambert azimuthal (limiting case, not included here)
// w is optional, default is w = 1
function Wagner7(w) {"use strict";
	
	var m, n, CA, CB, EPS10 = 1.e-10;

	this.toString = function() {
		return 'Wagner VII' + (w !== 1 ? ' Customized' : '');
	};

	this.forward = function(lon, lat, xy) {
		var  sinO, cosO, d;
		
		sinO = m * Math.sin(lat);
		cosO = Math.sqrt(1 - sinO * sinO);
		d = Math.sqrt(2. / (1. + cosO * Math.cos(lon *= n)));
		xy[0] = CA * d * cosO * Math.sin(lon);
		xy[1] = CB * d * sinO;
	};

	this.setW = function(weight) {
		var k, k2;
		
		w = weight;
		if (w >= 1) {
			w = 1;
		} else {
			if (w < EPS10) {
				w = EPS10;
			}
		}
		// constant values
		m = Math.sin(65 / 180 * Math.PI) * w + 1 - w;
		n = 1 / 3 * w + 1 - w;
		k = Math.sqrt((1.0745992166936477 * w + 1 - w) / Math.sin(Math.PI / 2 * n));
		k2 = Math.sqrt(m * n);
		CA = k / k2;
		CB = 1 / (k * k2);
	};
	
	this.setW(arguments.length === 0 ? 1 : w);
}