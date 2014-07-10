function TransverseTransformableLambert() {"use strict";

    var m, n, CA, CB, azimuthal;

    this.initialize = function(lam1, phi1, p) {
        var k, d;

        lam1 = Math.max(lam1, 0.0000001);
        phi1 = Math.max(phi1, 0.0000001);

        m = Math.sin(phi1);
        n = lam1 / Math.PI;
        k = Math.sqrt(p * Math.sin(phi1 / 2) / Math.sin(lam1 / 2));
        d = Math.sqrt(m * n);
        CA = k / d;
        CB = 1 / (k * d);
        azimuthal = (p === 1.5);
    };

    this.forward = function(lon, lat, xy) {

        var sin_O, cos_O, y, cosLon, cosLat, sinLat;

        // transverse
        lon += Math.PI / 2;   
        cosLon = Math.cos(lon);
        cosLat = Math.cos(lat);
        lon = Math.atan2(cosLat * Math.sin(lon), Math.sin(lat));
        // FIXME adjust longitude
        sinLat = -cosLat * cosLon;
        
        //sinLat = Math.sin(lat);
        
        lon *= n;
        sin_O = m * sinLat;
        cos_O = Math.sqrt(1 - sin_O * sin_O);
        y = 1 + cos_O * Math.cos(lon);
        y = Math.sqrt(2 / y);
        xy[1] = -CA * y * cos_O * Math.sin(lon);
        xy[0] = CB * y * sin_O;
    };
    
    // FIXME
    this.getGraticuleWidth = function() {
        return 4;
    };

    // FIXME
    this.getGraticuleHeight = function() {
        return 4;
    };
    
    this.isPoleInsideGraticule = function() {
        return azimuthal;
    };

    this.initialize(Math.PI / 2, Math.PI / 4, 1.5);
}