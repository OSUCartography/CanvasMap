function Hufnagel() {
	"use strict";

	// a, b, psiMax and aspectRatio parameterize the Hufnagel transformation.
	var a = 0, b = 0, psiMax = Math.PI / 2,
	// ratio between equator and central meridian lengths
	aspectRatio = 2,
	// tolerance for iterative computations
	EPS = 1.0e-6,
	// maximum number of computations
	MAX_ITER = 100,
	// size of lookup table
	LUT_SIZE = 101,
	// lookup tables
	latLUT, yLUT, psiLUT,
	// parameters pre-computed in init() from a, b, psiMax and aspectRatio
	ksq, k, c,
	// true if the graticule is folding over itself. Only an approximation, not all cases with folding graticules are captured. 
	graticuleFolding = false;

	function approximatePsi(lat) {
		var imid, lat0, lat1, d0, dif, w, psi0, psi1, psi, lat_abs = Math.abs(lat), imin = 0, imax = LUT_SIZE - 1;

		// continue searching while [imin,imax] is not empty
		while (imax >= imin) {
			// calculate the midpoint for roughly equal partition
			imid = Math.floor((imin + imax) / 2);
			lat0 = latLUT[Math.max(0, imid - 1)];
			lat1 = latLUT[imid];
			if (lat0 < lat_abs && lat1 >= lat_abs) {
				d0 = lat_abs - lat0;
				dif = lat1 - lat0;
				w = d0 / dif;
				psi0 = psiLUT[Math.max(0, imid - 1)];
				psi1 = psiLUT[imid];
				psi = w * (psi1 - psi0) + psi0;
				return lat < 0 ? -psi : psi;
			}

			// determine which subarray to search
			if (lat1 < lat_abs) {
				// change min index to search upper subarray
				imin = imid + 1;
			} else {
				// change max index to search lower subarray
				imax = imid - 1;
			}
		}
		return 0;
	}

	function initLUTs() {
		var i, psi, sin2Psi, sin4Psi, sin6Psi, phi, r, y;
		latLUT = [];
		yLUT = [];
		psiLUT = [];
		graticuleFolding = false;
		for ( i = 0; i < LUT_SIZE; i = i + 1) {
			// psi is linearly proportional to i
			psi = psiMax * i / (LUT_SIZE - 1);

			// phi computed from psi: for equation see Hufnagel 1989
			if (i === 0) {
				phi = 0;
			} else if (i === LUT_SIZE - 1) {
				phi = Math.PI / 2;
			} else {
				sin2Psi = Math.sin(2 * psi);
				sin4Psi = Math.sin(4 * psi);
				sin6Psi = Math.sin(6 * psi);
				phi = Math.asin(0.25 / Math.PI * k * k * (2 * psi + (1 + a - 0.5 * b) * sin2Psi + 0.5 * (a + b) * sin4Psi + 0.5 * b * sin6Psi));
			}

			// compute y coordinate
			r = Math.sqrt(1 + a * Math.cos(2 * psi) + b * Math.cos(4 * psi));
			y = r * Math.sin(psi);

			// test for folding graticule
			if (i > 0) {
				if (y < yLUT[i - 1] || phi < latLUT[i - 1]) {
					graticuleFolding = true;
					y = yLUT[i - 1];
					phi = latLUT[i - 1];
				}
			}

			// store values in lookup tables
			latLUT.push(phi);
			yLUT.push(y);
			psiLUT.push(psi);
		}
	}


	this.forward = function(lon, lat, xy) {
		var r, deltaPsi, deltaPsi_I, deltaPsi_II, psi0 = 0, i = 0, PI_x_sinLat = Math.PI * Math.sin(lat), psi0_x_2;

		if (lat !== 0) {
			psi0 = approximatePsi(lat);
			if (Math.abs(psi0) < Math.PI / 2) {
				do {
					psi0_x_2 = psi0 * 2;

					// TODO make this more efficient
					deltaPsi_I = (ksq / 4) * (psi0_x_2 + (1 + a - b / 2) * Math.sin(psi0_x_2) + ((a + b) / 2) * Math.sin(2 * psi0_x_2) + (b / 2) * Math.sin(3 * psi0_x_2)) - PI_x_sinLat;
					deltaPsi_II = (ksq / 2) * (1 + (1 + a - (b / 2)) * Math.cos(psi0_x_2) + (a + b) * Math.cos(2 * psi0_x_2) + (3 * b / 2) * Math.cos(3 * psi0_x_2));
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
		}

		// calculate x and y
		r = Math.sqrt(1 + a * Math.cos(2 * psi0) + b * Math.cos(4 * psi0));
		xy[0] = k * r * c * lon / Math.PI * Math.cos(psi0);
		xy[1] = k * r / c * Math.sin(psi0);
	};

	this.init = function() {
		var xy = [], width;
		ksq = (4 * Math.PI) / (2 * psiMax + (1 + a - b / 2) * Math.sin(2 * psiMax) + ((a + b) / 2) * Math.sin(4 * psiMax) + (b / 2) * Math.sin(6 * psiMax));
		k = Math.sqrt(ksq);
		c = 1;

		// lookup tables for native aspect ratio
		initLUTs();

		// compute correction factor c to obtain desired ratio between equator and central meridian
		this.forward(Math.PI, 0, xy);
		width = xy[0];
		this.forward(0, Math.PI / 2, xy);
		c = Math.sqrt(aspectRatio / (width / xy[1]));

		// lookup tables for correct aspect ratio
		initLUTs();
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
	 * ratio between equator and central meridian, default is 2.0
	 */
	this.setAspectRatio = function(newAspectRatio) {
		aspectRatio = newAspectRatio;
		this.init();
	};

	/**
	 * Returns true if the graticule is folding, false otherwise.
	 */
	this.isGraticuleFolding = function() {
		return graticuleFolding;
	};
	
	this.toString = function() {
		return 'Hufnagel';
	};
	
}

