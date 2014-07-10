function WagnerPseudocylindrical() {"use strict";

	var m, n, CA, CB, EPS10 = 1.e-10;

	this.toString = function() {
		return 'Wagner Pseudocylindrical';
	};

	this.forward = function(lon, lat, xy) {
		this.setW(61.9 / 180. * Math.PI, 2.03);

		var sinO, cosO, d;

		sinO = m * Math.sin(lat);
		cosO = Math.sqrt(1 - sinO * sinO);
		d = Math.sqrt(2. / (1. + cosO));
		xy[0] = CA * d * cosO * lon;
		xy[1] = CB * d * sinO;
	};

	this.inverse = function(x, y, lonlat) {
		this.setW(65. / 180. * Math.PI, 2.);

		sinO_2 = y / (2 * CB);
		cosO_2 = Math.sqrt(1 - sinO_2 * sinO_2);

		lonlat[0] = (x / CA) * cosO_2 / (2 * cosO_2 * cosO_2 - 1);
		lonlat[1] = Math.asin(2 * sinO_2 * cosO_2 / m);
	};

	this.setW = function(latB, ratio) {

		if (latB < EPS10) {
			latB = EPS10;
		}

		m = Math.sin(latB);
		var k = Math.sqrt(2 * ratio * Math.sin(latB / 2.) / Math.PI);
		var k2 = Math.sqrt(m);
		CA = k / k2;
		CB = 1 / (k * k2);
		
		console.log('CA', CA);
		console.log('CB', CB);
		console.log('m', m);
	};

}