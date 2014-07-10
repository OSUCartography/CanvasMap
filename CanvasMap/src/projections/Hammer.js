/**
* Custom shapes between a Lambert azimuthal (w = 1) and a Quartic Authalic (w = 0) can be defined with 
* the optional argument w. If not provided, the default 0.5 for the Hammer projection is used.
*/
function Hammer(w) {
    
    "use strict";

    var w, W_MAX = 0.999999, EPS10 = 1.e-10;

    this.toString = function() {
        switch (w) {
    	    case 0:
        		return 'Quartic Authalic';
	        case 0.5: 
    	    	return 'Hammer';
        	default:
	        	return 'Hammer Customized';
    	}
    };
    
    this.forward = function(lon, lat, xy) {
        var cosLat = Math.cos(lat), d;
        lon *= w;
        d = Math.sqrt(2 / (1 + cosLat * Math.cos(lon)));
        xy[0] = d * cosLat * Math.sin(lon) / w;
        xy[1] = d * Math.sin(lat);
    };
    
    this.inverse = function (x, y, lonlat) {
        var EPS = 1.0e-10;
        var wx = w * x;
        var z = Math.sqrt(1 - 0.25 * (wx * wx + y * y));
        var zz2_1 = 2 * z * z - 1;
        if(Math.abs(zz2_1) < EPS) {
            lonlat[0] = NaN;
            lonlat[1] = NaN;
        } else {
            lonlat[0] = Math.atan2(wx * z, zz2_1) / w;
            lonlat[1] = Math.asin(z * y);
        }
    };

    this.setW = function(weight) {
        w = weight;
        if(w >= W_MAX) {
            w = W_MAX;
        } else if(w < 0) {
             w = 0;
        }
        if (w === 0) {
        	this.forward = this.quarticAuthalicForward;
            this.inverse = this.quarticAuthalicInverse;
        } else {
			//it's already set
            //this.forward = hammerForward;
            //this.inverse = hammerInverse;
        }
    };
    this.setW(arguments.length === 0 ? 0.5 : w);
    
    this.getW = function() {
    	return w;
    };
    
 }