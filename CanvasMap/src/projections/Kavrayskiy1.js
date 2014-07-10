function Kavrayskiy1() {"use strict";

	var PI_HALF = Math.PI / 2, MERCATOR_MAX_LAT = 70 / 180 * Math.PI, DY, C;
    DY = Math.log(Math.tan(0.5 * (PI_HALF + MERCATOR_MAX_LAT)));
    C = 1 / Math.cos(MERCATOR_MAX_LAT);
    
	this.toString = function() {
		return 'Kavrayskiy I';
	};

	this.forward = function(lon, lat, xy) {
	    
		xy[0] = lon;
		if (lat > MERCATOR_MAX_LAT) {
			xy[1] = (lat  - MERCATOR_MAX_LAT) * C + DY;
		} else if (lat < -MERCATOR_MAX_LAT) {
            xy[1] = (lat  + MERCATOR_MAX_LAT) * C - DY;
        } else {
			xy[1] = Math.log(Math.tan(0.5 * (PI_HALF + lat)));
		}
	};
}
