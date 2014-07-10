function MillerTransformation() {"use strict";

	var PI_HALF = Math.PI / 2, EPS = 1e-4, n = 1.5, m = 1.5;

	this.toString = function() {
		return 'Miller Transformation';
	};

	this.getM = function() {
		return m;
	};

	this.setM = function(M) {
		m = M;
	};

	this.getN = function() {
		return n;
	};

	this.setN = function(N) {
		n = N;
	};
	
	this.getAspectRatio = function() {
		return n * Math.log(Math.tan(0.5 * PI_HALF * (1 + 1 / n))) / Math.PI;
	};

	this.setAspectRatio = function(aspect) {
		if (aspect <= 0.5) {
			m = n = 1 / EPS;
		} else {
			var Cc = 1.05, tol = 1, F, Fder1, Fder2, angle;
			while (Math.abs(tol) > EPS) {
				angle = 0.5 * PI_HALF * (1 + 1 / Cc);
				F = Cc * Math.log(Math.tan(angle)) - aspect * Math.PI;
				Fder1 = Math.log(Math.tan(angle));
				Fder2 = Math.tan(angle) * Math.cos(angle) * Math.cos(angle) * Cc;
				Cc -= tol = F / (Fder1 - 0.5 * PI_HALF / Fder2);
			}
			m = n = Cc;
		}
	};

	this.forward = function(lon, lat, xy) {
		xy[0] = lon;
		xy[1] = m * Math.log(Math.tan(0.5 * (PI_HALF + lat / n)));
	};
}
