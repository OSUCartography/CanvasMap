function Hufnagel() {
	"use strict";

	// a, b, psiMax and aspectRatio parameterize the Hufnagel transformation.
	var a = 0,
	    b = 0,
	    psiMax = Math.PI / 2,
	// ratio between equator and central meridian lengths
	    aspectRatio = 2,
	// tolerance for iterative computations
	    EPS = 1.0e-6,
	// maximum number of computations
	    MAX_ITER = 100,
	// size of lookup table
	    LUT_SIZE = 101,
	// lookup tables
	    latLUT,
	// yLUT, would be needed for inverse projection
	    psiLUT,
	// parameters pre-computed in init() from a, b, psiMax and aspectRatio
	    ksq,
	    k,
	    c,
	// true if the graticule is folding over itself. Only an approximation, not all cases with folding graticules are captured.
	    graticuleFolding = false;

	function approximatePsi(lat) {
		var w,
		    psi,
		    lat_abs = Math.abs(lat),
		    imid,
		    imin = 0,
		    imax =
		    LUT_SIZE;

		while (true) {
			imid = Math.floor((imin + imax) / 2);
			if (imid === imin) {
				// This also handles abs(phi) == latitudeTable[0] because mid must == min.
				break;
			} else if (lat_abs > latLUT[imid]) {
				imin = imid;
			} else {
				// abs(phi) < latitudeTable[mid], or abs(phi) == latitudeTable[mid] and mid ≠ 0
				imax = imid;
			}
		}

		w = (lat_abs - latLUT[imin]) / (latLUT[imin + 1] - latLUT[imin]);
		psi = w * (psiLUT[imin + 1] - psiLUT[imin]) + psiLUT[imin];

		return lat < 0 ? -psi : psi;
	}

	function initLUTs() {
		var i,
		    psi,
		    sin2Psi,
		    sin4Psi,
		    sin6Psi,
		    as,
		    phi,
		    r,
		    y;
		latLUT = [];
		//yLUT = [];
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
				as = 0.25 / Math.PI * k * k * (2 * psi + (1 + a - 0.5 * b) * sin2Psi + 0.5 * (a + b) * sin4Psi + 0.5 * b * sin6Psi);
				if (Math.abs(as) > 1) {
					phi = as > 0 ? Math.PI / 2 : -Math.PI / 2;
				} else {
					phi = Math.asin(as);
				}
			}
			/*
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
			*/
			// store values in lookup tables
			latLUT.push(phi);
			//yLUT.push(y);
			psiLUT.push(psi);
		}
	}


	this.forward = function(lon, lat, xy) {
		var r,
		    deltaPsi,
		    deltaPsiNominator,
		    deltaPsiDenominator,
		    psi0 = 0,
		    i = 0,
		    PI_x_sinLat = Math.PI * Math.sin(lat),
		    psi0_x_2;

		if (psiMax === 0) {
			// standard parallel of equal-area cylindrical projection
			xy[0] = lon * k;
			xy[1] = Math.sin(lat) / k;
			return;
		}
		psi0 = approximatePsi(lat);

		while (true) {
			psi0_x_2 = psi0 * 2;
			deltaPsiNominator = (ksq / 4) * (psi0_x_2 + (1 + a - b / 2) * Math.sin(psi0_x_2) + ((a + b) / 2) * Math.sin(2 * psi0_x_2) + (b / 2) * Math.sin(3 * psi0_x_2)) - PI_x_sinLat;
			if (Math.abs(deltaPsiNominator) < EPS) {
				break;
			}
			deltaPsiDenominator = (ksq / 2) * (1 + (1 + a - (b / 2)) * Math.cos(psi0_x_2) + (a + b) * Math.cos(2 * psi0_x_2) + (3 * b / 2) * Math.cos(3 * psi0_x_2));
			deltaPsi = deltaPsiNominator / deltaPsiDenominator;

			i = i + 1;
			if (!isFinite(deltaPsi) || i > MAX_ITER) {
				xy[0] = NaN;
				xy[1] = NaN;
				return;
			}
			psi0 = psi0 - deltaPsi;
		}

		// calculate x and y
		r = Math.sqrt(1 + a * Math.cos(2 * psi0) + b * Math.cos(4 * psi0));
		xy[0] = k * r * c * lon / Math.PI * Math.cos(psi0);
		xy[1] = k * r / c * Math.sin(psi0);
	};

	this.init = function() {
		if (psiMax === 0) {
			k = Math.sqrt(aspectRatio / Math.PI);
		} else {
			var xy = [],
			    width;
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
		}
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