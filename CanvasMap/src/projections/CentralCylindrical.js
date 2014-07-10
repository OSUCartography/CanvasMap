function CentralCylindrical() {"use strict";
		
	var MAX_LAT = 80 / 180 * Math.PI;
	
	this.toString = function() {
		return 'Central Cylindrical';
	};
	
	this.forward = function(lon, lat, xy) {
		if (lat > MAX_LAT) {
            lat = MAX_LAT;
        } else if (lat < -MAX_LAT) {
            lat = -MAX_LAT;
        }
		xy[0] = lon;
		xy[1] = Math.tan(lat);
	};
}