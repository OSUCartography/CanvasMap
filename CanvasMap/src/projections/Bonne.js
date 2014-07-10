function Bonne() {"use strict";
    var phi1 = 85 / 180 * Math.PI, cotphi1 = 1 / Math.tan(phi1);
    
	this.toString = function() {
		return 'Bonne (Equal Area)';
	};

    this.getGraticuleHeight = function() {
        return 6;
    };

    this.getStandardParallel = function() {
        return phi1;
    };
    
    this.setStandardParallel = function(stdParallel) {
        phi1 = stdParallel;
        cotphi1 = 1 / Math.tan(phi1);
    };
    
	this.forward = function(lon, lat, xy) {
        var r = cotphi1 + phi1 - lat;
        var E = lon * Math.cos(lat) / r;
		xy[0] = r * Math.sin(E);
		xy[1] = cotphi1 - r * Math.cos(E);
	};
}
