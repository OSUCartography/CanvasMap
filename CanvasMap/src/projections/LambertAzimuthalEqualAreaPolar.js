function LambertAzimuthalEqualAreaPolar() {"use strict";

    var FORTPI = Math.PI / 4, southPole = false;

    this.toString = function() {
        return 'Lambert Azimuthal Equal Area - Polar';
    };

    //forwardNorthPole
    this.forward = function(lon, lat, xy) {
        var y = 2 * Math.sin(FORTPI - lat * 0.5);
        xy[0] = y * Math.sin(lon);
        xy[1] = y * -Math.cos(lon);
    };

    function forwardSouthPole(lon, lat, xy) {
        var y = 2 * Math.cos(FORTPI - lat * 0.5);
        xy[0] = y * Math.sin(lon);
        xy[1] = y * Math.cos(lon);
    }


    this.getGraticuleWidth = function() {
        return 4;
    };

    this.getGraticuleHeight = function() {
        return 4;
    };

    this.isPoleInsideGraticule = function() {
        return true;
    };
}