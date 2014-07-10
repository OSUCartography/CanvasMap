function AlbersConic() {"use strict";

	var c, rho0, n, n2, EPS10 = 1.0e-10;

	this.toString = function() {
		return 'Albers Conic';
	};

	this.initialize = function(phi0, phi1, phi2) {
        var cosPhi1, sinPhi1, secant;
        
        if (Math.abs(phi1 + phi2) < EPS10) {
            n = NaN;
            throw new Error("Standard latitudes of Albers conic too close to equator");
        }

        cosPhi1 = Math.cos(phi1);
        sinPhi1 = Math.sin(phi1);
        secant = Math.abs(phi1 - phi2) >= EPS10;
        if (secant) {
            n = 0.5 * (sinPhi1 + Math.sin(phi2));
        } else {
            n = sinPhi1;
        }
        n2 = 2 * n;
        c = cosPhi1 * cosPhi1 + n2 * sinPhi1;
        rho0 = Math.sqrt(c - n2 * Math.sin(phi0)) / n;
    };
    
	this.forward = function(lon, lat, xy) {
		var rho, n_x_lon;
        rho = c - n2 * Math.sin(lat);
        if (rho < 0) {
            xy[0] = NaN;
            xy[1] = NaN;
        }
        rho = Math.sqrt(rho) / n;
        n_x_lon = n * lon;
        xy[0] = rho * Math.sin(n_x_lon);
        xy[1] = rho0 - rho * Math.cos(n_x_lon);
	};
	
	this.initialize(45/180*Math.PI, 45/180*Math.PI, 45/180*Math.PI);
}
