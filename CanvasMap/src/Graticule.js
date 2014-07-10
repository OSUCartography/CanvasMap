/*globals LineDrawer, applyStyle*/

function Graticule(style, resolutionDeg) {"use strict";

    function drawMeridian(projection, scale, canvas, lon) {
        var i, ctx, nPts, dLat, lat, lineDrawer, xy = [];
        nPts = 11;
        dLat = Math.PI / (nPts - 1);

        // draw southern and northern hemisphere separately
        // southern hemisphere
        ctx = canvas.getContext('2d');
        lineDrawer = new LineDrawer(0, scale, projection, ctx);
        for ( i = 0; i < nPts / 2; i += 1) {
            lat = -Math.PI / 2 + i * dLat;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();

        // northern hemisphere
        for ( i = 0; i < nPts / 2; i += 1) {
            lat = i * dLat;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();
    }

    function drawParallel(projection, scale, canvas, lat) {
        var i, ctx, nPts, dLon, lon, lineDrawer, xy = [];
        nPts = 20;
        dLon = 2 * Math.PI / (nPts - 1);
        ctx = canvas.getContext('2d');
        lineDrawer = new LineDrawer(0, scale, projection, ctx);
        for ( i = 0; i < nPts; i += 1) {
            lon = -Math.PI + i * dLon;
            lineDrawer.projectDraw(lon, lat);
        }
        lineDrawer.stroke();
    }


    this.render = function(projection, lon0, scale, canvas) {
        var ctx, i, lon, lat;

        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        applyStyle(style, ctx);

        // meridians
        for ( i = 0; i < 360 / resolutionDeg; i += 1) {
            lon = -Math.PI + i * resolutionDeg / 180 * Math.PI - lon0;
            while (lon < -Math.PI) {
                lon += Math.PI * 2;
            }
            while (lon > Math.PI) {
                lon -= Math.PI * 2;
            }
            drawMeridian(projection, scale, canvas, lon);
        }

        // parallels
        for ( i = 1; i < 180 / resolutionDeg; i += 1) {
            lat = -Math.PI / 2 + i * resolutionDeg / 180 * Math.PI;
            drawParallel(projection, scale, canvas, lat);
        }

        // vertical graticule border
        if ( typeof (projection.isPoleInsideGraticule) !== 'function' || projection.isPoleInsideGraticule() === false) {
            drawMeridian(projection, scale, canvas, -Math.PI);
            drawMeridian(projection, scale, canvas, Math.PI);
        }

        // horizontal graticule border
        drawParallel(projection, scale, canvas, -Math.PI / 2);
        drawParallel(projection, scale, canvas, Math.PI / 2);

        ctx.restore();
    };

    this.load = function(projection, scale, map) {
        // dummy
    };
}
