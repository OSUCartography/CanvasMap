/**
	Approximation by Canters & Decleir
*/
function Robinson() {"use strict";
    this.toString = function() {
        return 'Robinson';
    };

    this.forward = function(lon, lat, xy) {
        var lat2 = lat * lat;
        xy[0] = lon * (0.8507 - lat2 * (0.1450 + lat2 * 0.0104));
        xy[1] = lat * (0.9642 - lat2 * (0.0013 + lat2 * 0.0129));
    };
}