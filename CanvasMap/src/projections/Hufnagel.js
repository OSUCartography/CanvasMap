/**
 * The Hufnagel projection family was introduced by Herbert Hufnagel in
 * "Hufnagel, H. 1989. Ein System unecht-zylindrischer Kartennetze für
 * Erdkarten. Kartographische Nachrichten, 39(3), 89–96." All projections are
 * equal-area. Implementation by Bernhard Jenny, Oregon State University, Bojan
 * Savric, Oregon State University, with substantial contributions by Daniel
 * "daan" Strebe, Mapthematics. November 2014 to October 2015.
 *
 * @author Bojan Savric
 * @author Bernhard Jenny
 */

function Hufnagel() {
	"use strict";

	// a, b, psiMax and aspectRatio parameterize the Hufnagel transformation.
	var a = 0,
	    b = 0,
	    psiMax = Math.PI / 2,
	// ratio between equator and central meridian lengths
	    aspectRatio = 2,
	// tolerance for iterative computations
	    EPS = 1.0e-12,
	// maximum number of computations
	    MAX_ITER = 100,
	// size of lookup table
	    LUT_SIZE = 101,
	// lookup tables, yLUT, would be needed for inverse projection
	    latLUT,
	    psiLUT,
	// parameters pre-computed in init() from a, b, psiMax and aspectRatio
	    ksq,
	    k,
	    c,
	// true if the graticule is folding over itself. Only an approximation, not all cases with folding graticules are captured.
	    graticuleFolding = false;

	function approximatePsiFromLookupTable(lat) {
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

	function initializeLookUpTables() {
		var i,
		    psi,
		    sin2Psi,
		    sin4Psi,
		    sin6Psi,
		    sinPhi,
		    phi,
		    r,
		    y;
		latLUT = [];
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
				sinPhi = 0.25 / Math.PI * k * k * (2 * psi + (1 + a - 0.5 * b) * sin2Psi + 0.5 * (a + b) * sin4Psi + 0.5 * b * sin6Psi);
				if (Math.abs(sinPhi) > 1) {
					phi = sinPhi > 0 ? Math.PI / 2 : -Math.PI / 2;
				} else {
					phi = Math.asin(sinPhi);
				}
			}
			
			// store values in lookup tables
			latLUT.push(phi);
			psiLUT.push(psi);
		}
	}

	this.forward = function(lon, lat, xy) {
		var r,
		    deltaPsi,
		    deltaPsiNumerator,
		    deltaPsiDenominator,
		    psi = 0,
		    i = 0,
		    PI_x_sinLat = Math.PI * Math.sin(lat),
		    psi_x_2;

		if (psiMax === 0) {
			// cylindrical equal-area projection
			xy[0] = lon * k;
			xy[1] = Math.sin(lat) / k;
			return;
		}
		// approximate psi from lookup table
		psi = approximatePsiFromLookupTable(lat);

		// iteratively improve psi
		while (true) {
			psi_x_2 = psi * 2;
			deltaPsiNumerator = (ksq / 4) * (psi_x_2 + (1 + a - b / 2) * Math.sin(psi_x_2) + ((a + b) / 2) * Math.sin(2 * psi_x_2) + (b / 2) * Math.sin(3 * psi_x_2)) - PI_x_sinLat;
			if (Math.abs(deltaPsiNumerator) < EPS) {
				break;
			}
			deltaPsiDenominator = (ksq / 2) * (1 + (1 + a - (b / 2)) * Math.cos(psi_x_2) + (a + b) * Math.cos(2 * psi_x_2) + (3 * b / 2) * Math.cos(3 * psi_x_2));
			deltaPsi = deltaPsiNumerator / deltaPsiDenominator;

			i = i + 1;
			if (!isFinite(deltaPsi) || i > MAX_ITER) {
				xy[0] = NaN;
				xy[1] = NaN;
				return;
			}
			psi = psi - deltaPsi;
		}

		// calculate x and y
		r = Math.sqrt(1 + a * Math.cos(2 * psi) + b * Math.cos(4 * psi));
		xy[0] = k * r * c * lon / Math.PI * Math.cos(psi);
		xy[1] = k * r / c * Math.sin(psi);
	};

	this.init = function() {
		if (psiMax === 0) {
			k = Math.sqrt(aspectRatio / Math.PI);
		} else {
			var xy = [],
			    width;
			ksq = (4 * Math.PI) / (2 * psiMax + (1 + a - b / 2) * Math.sin(2 * psiMax) + ((a + b) / 2) * Math.sin(4 * psiMax) + (b / 2) * Math.sin(6 * psiMax));
			k = Math.sqrt(ksq);
			c = Math.sqrt(aspectRatio * Math.sin(psiMax)
                    * Math.sqrt((1 + a * Math.cos(2 * psiMax) + b * Math.cos(4 * psiMax)) / (1 + a + b)));
			initializeLookUpTables();
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