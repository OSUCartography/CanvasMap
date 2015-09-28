function AspectAdaptiveCylindrical() {"use strict";
	var A = [9.684, -33.44, 43.13, -19.77, -0.569, -0.875, 7.002, -5.948, -0.509, 3.333, -6.705, 4.148];
    var B = [0.0186, -0.0215, -1.179, 1.837];
    
	var MIN_ASPECT = 0.3, MAX_ASPECT = 1, PI_HALF = Math.PI / 2, EXTRA_ASPECT_LIMIT = 0.7, EXTRA_LAT_LIMIT = 45 / 180 * Math.PI;
	var aspectRatio, k11, k12, k13, k21, k22;

	this.toString = function() {
		return 'Aspect Adaptive Cylindrical';
	};

	this.getMinAspectRatio = function() {
		return MIN_ASPECT;
	};

	this.getMaxAspectRatio = function() {
		return MAX_ASPECT;
	};

	this.getAspectRatio = function(aspect) {
		return aspectRatio;
	};

	this.setAspectRatio = function(aspect) {
		aspectRatio = Math.max(Math.min(aspect, MAX_ASPECT), MIN_ASPECT);

		var k11x, k12x, k13x, n;

		if (aspectRatio > EXTRA_ASPECT_LIMIT) {
			k11x = A[0] + EXTRA_ASPECT_LIMIT * (A[1] + EXTRA_ASPECT_LIMIT * (A[2] + EXTRA_ASPECT_LIMIT * A[3]));
			k12x = A[4] + EXTRA_ASPECT_LIMIT * (A[5] + EXTRA_ASPECT_LIMIT * (A[6] + EXTRA_ASPECT_LIMIT * A[7]));
			k13x = A[8] + EXTRA_ASPECT_LIMIT * (A[9] + EXTRA_ASPECT_LIMIT * (A[10] + EXTRA_ASPECT_LIMIT * A[11]));

			n = PI_HALF * (k11x + PI_HALF * PI_HALF * (k12x + PI_HALF * PI_HALF * k13x));

			k11 = k11x * EXTRA_ASPECT_LIMIT * Math.PI / n;
			k12 = k12x * EXTRA_ASPECT_LIMIT * Math.PI / n;
			k13 = k13x * EXTRA_ASPECT_LIMIT * Math.PI / n;

			var k21x = B[0] + aspectRatio * B[1];
			var k22x = B[2] + aspectRatio * B[3];

			var poleDiff = PI_HALF - EXTRA_ASPECT_LIMIT;
			var n_2 = poleDiff * (k21x + poleDiff * poleDiff * k22x );

			var aspectDiff = aspectRatio - EXTRA_ASPECT_LIMIT;
			k21 = k21x * Math.PI * aspectDiff / n_2;
			k22 = k22x * Math.PI * aspectDiff / n_2;

		} else {
			k11x = A[0] + aspectRatio * (A[1] + aspectRatio * (A[2] + aspectRatio * A[3]));
			k12x = A[4] + aspectRatio * (A[5] + aspectRatio * (A[6] + aspectRatio * A[7]));
			k13x = A[8] + aspectRatio * (A[9] + aspectRatio * (A[10] + aspectRatio * A[11]));

			n = PI_HALF * (k11x + PI_HALF * PI_HALF * (k12x + PI_HALF * PI_HALF * k13x));

			k11 = k11x * aspectRatio * Math.PI / n;
			k12 = k12x * aspectRatio * Math.PI / n;
			k13 = k13x * aspectRatio * Math.PI / n;

			k21 = k22 = 0.0;
		}

	};

	this.forward = function(lon, lat, xy) {
		var lat_diff, lat2 = lat * lat;
		xy[0] = lon;
		xy[1] = lat * (k11 + lat2 * (k12 + lat2 * k13));

		if ((aspectRatio > EXTRA_ASPECT_LIMIT) && (lat > EXTRA_LAT_LIMIT)) {
			lat_diff = lat - EXTRA_LAT_LIMIT;
			xy[1] += lat_diff * (k21 + lat_diff * lat_diff * k22);
		}
		if ((aspectRatio > EXTRA_ASPECT_LIMIT) && (lat < -EXTRA_LAT_LIMIT)) {
			lat_diff = lat + EXTRA_LAT_LIMIT;
			xy[1] += lat_diff * (k21 + lat_diff * lat_diff * k22);
		}
	};
}
