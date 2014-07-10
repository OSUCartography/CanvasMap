function NaturalEarth() {"use strict";

    var MAX_Y = 0.8707 * 0.52 * Math.PI;

    this.toString = function() {
        return 'Natural Earth';
    };    

    this.forward = function(lon, lat, xy) {
        var lat2 = lat * lat, lat4 = lat2 * lat2;
		
        xy[0] = lon * (0.8707 - 0.131979 * lat2 + lat4 * (-0.013791 + lat4 * (0.003971 * lat2 - 0.001529 * lat4)));
        xy[1] = lat * (1.007226 + lat2 * (0.015085 + lat4 * (-0.044475 + 0.028874 * lat2 - 0.005916 * lat4)));
    };
}