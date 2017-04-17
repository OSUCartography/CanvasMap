function Eckert6() {"use strict";
	
	var n = 2.570796326794896619231321691,
		C_y = Math.sqrt((2) / n),
		C_x = C_y / 2,
		MAX_ITER = 8,
		LOOP_TOL = 1e-7;

    this.forward = function(lon, lat, xy) {
        var i, v, k = n * Math.sin(lat);
        for (i = MAX_ITER; i > 0;) {
            lat -= v = (lat + Math.sin(lat) - k) / (1 + Math.cos(lat));
            if (Math.abs(v) < LOOP_TOL) {
                break;
            }
            --i;
        }

        xy[0] = C_x * lon * (1 + Math.cos(lat));
        xy[1] = C_y * lat;
    };
    
	this.toString = function() {
		return 'Eckert VI';
	};
}