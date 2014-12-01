function Hufnagel() {
	"use strict";

	// a, b, psiMax and aspectRatio parameterize the Hufnagel transformation.
	var a = 0, b = 0, psiMax = Math.PI / 2, 
	// width-to-height aspect ratio
	aspectRatio = 2,
	// tolerance for iterative computations 
	EPS = 1.0e-6, 
	// maximum number of computations
	MAX_ITER = 100, 
	// parameters pre-computed in init() from a, b, psiMax and aspectRatio
	k2, k, c;

	this.forward = function(lon, lat, xy) {
		var r, deltaPsi, deltaPsi_I, deltaPsi_II, psi0 = 0, i = 0;

		if (lat !== 0) {
			do {
				// TODO make this more efficient
				deltaPsi_I = (k2 / 4) * (2 * psi0 + (1 + a - b / 2) * Math.sin(2 * psi0) + ((a + b) / 2) * Math.sin(4 * psi0) + (b / 2) * Math.sin(6 * psi0)) - Math.PI * Math.sin(lat);
				deltaPsi_II = (k2 / 2) * (1 + (1 + a - (b / 2)) * Math.cos(2 * psi0) + (a + b) * Math.cos(4 * psi0) + (3 * b / 2) * Math.cos(6 * psi0));
				deltaPsi = deltaPsi_I / deltaPsi_II;

				i = i + 1;
				if (!isFinite(deltaPsi) || i > MAX_ITER) {
					xy[0] = NaN;
					xy[1] = NaN;
					return;
				}
				psi0 = psi0 - deltaPsi;
			} while (Math.abs(deltaPsi) > EPS);
		}

		// calculate x and y
		r = Math.sqrt(1 + a * Math.cos(2 * psi0) + b * Math.cos(4 * psi0));
		xy[0] = k * r * c * lon / Math.PI * Math.cos(psi0);
		xy[1] = k * r / c * Math.sin(psi0);
		return;
	};

	this.init = function() {
		var xy = [], width, r;
		k2 = (4 * Math.PI) / (2 * psiMax + (1 + a - b / 2) * Math.sin(2 * psiMax) + ((a + b) / 2) * Math.sin(4 * psiMax) + (b / 2) * Math.sin(6 * psiMax));
		k = Math.sqrt(k2);
		c = 1;
		this.forward(Math.PI, 0, xy);
		width = xy[0];
		this.forward(0, Math.PI / 2, xy);
		c = Math.sqrt(aspectRatio / (width / xy[1]));
	};
	this.init();

	this.setA = function(newA) {
		a = newA;
		this.init();
	};

	this.setB = function(newB) {
		b = newB;
		this.init();
	};

	/**
	 * psi max in radians
	 */
	this.setPsiMax = function(newPsiMax) {
		psiMax = newPsiMax;
		this.init();
	};

	/**
	 * width-to-height ratio, typically 2.0
	 */
	this.setAspectRatio = function(newAspectRatio) {
		aspectRatio = newAspectRatio;
		this.init();
	};

	this.toString = function() {
		return 'Hufnagel';
	};
}

