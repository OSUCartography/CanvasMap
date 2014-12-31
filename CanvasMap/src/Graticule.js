/*globals LineDrawer, applyStyle*/

/**
 * Map graticule (lines of constant longitude and latitude)
 * @param {Object} style Style for drawing the graticule
 * @param {Object} lineDistanceDeg Distance in degrees between neighboring lines of constant longitude or latitude.
 * @param {Object} maxPointDistance Maximum distance in degrees for drawing lines. Optional. Specify low value (e.g., 1 deg) if graticule is unusually curvy.
 */
function Graticule(style, lineDistanceDeg, maxPointDistance) {
	"use strict";

	if (maxPointDistance === undefined) {
		maxPointDistance = 5;
	}
	var nVerticalPoints = 180 / Math.min(lineDistanceDeg, maxPointDistance) + 1,
	    nHorizontalPoints = 360 / Math.min(lineDistanceDeg, maxPointDistance) + 1;

	function drawMeridian(projection, scale, lineDrawer, lon) {
		var i,
		    lat,
		    dLat = Math.PI / (nVerticalPoints - 1);
		for ( i = 0; i < nVerticalPoints; i += 1) {
			lat = -Math.PI / 2 + i * dLat;
			lineDrawer.projectDraw(lon, lat);
		}
		lineDrawer.stroke();
	}

	function drawParallel(projection, scale, lineDrawer, lat) {
		var i,
		    lon,
		    dLon = 2 * Math.PI / (nHorizontalPoints - 1);
		for ( i = 0; i < nHorizontalPoints; i += 1) {
			lon = -Math.PI + i * dLon;
			lineDrawer.projectDraw(lon, lat);
		}
		lineDrawer.stroke();
	}


	this.render = function(projection, lon0, scale, canvas) {
		var i,
		    lon,
		    lat,
		    ctx = canvas.getContext('2d'),
		    lineDrawer = new LineDrawer(0, scale, projection, ctx);

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		applyStyle(style, ctx);

		// meridians
		for ( i = 0; i < 360 / lineDistanceDeg; i += 1) {
			lon = -Math.PI + i * lineDistanceDeg / 180 * Math.PI - lon0;
			while (lon < -Math.PI) {
				lon += Math.PI * 2;
			}
			while (lon > Math.PI) {
				lon -= Math.PI * 2;
			}
			drawMeridian(projection, scale, lineDrawer, lon);
		}

		// parallels
		for ( i = 1; i < 180 / lineDistanceDeg; i += 1) {
			lat = -Math.PI / 2 + i * lineDistanceDeg / 180 * Math.PI;
			drawParallel(projection, scale, lineDrawer, lat);
		}

		// vertical graticule border
		if ( typeof (projection.isPoleInsideGraticule) !== 'function' || projection.isPoleInsideGraticule() === false) {
			drawMeridian(projection, scale, lineDrawer, -Math.PI);
			drawMeridian(projection, scale, lineDrawer, Math.PI);
		}

		// horizontal graticule border
		drawParallel(projection, scale, lineDrawer, -Math.PI / 2);
		drawParallel(projection, scale, lineDrawer, Math.PI / 2);

		ctx.restore();
	};

	this.load = function(projection, scale, map) {
		// dummy
	};
}
