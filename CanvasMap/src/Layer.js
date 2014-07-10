/*global LineDrawer, ShpType, ShpFile, DbfFile, BinaryAjax, applyStyle */

function Layer(url, style) {"use strict";

    var onShpFail, onShpComplete, onDbfFail, onDbfComplete, pointD = 4, layer = this;

    this.shpFile = null;
    this.dbfFile = null;

    function adjustLongitude(lon, lon0) {
        lon -= lon0;
        while (lon < -Math.PI) {
            lon += Math.PI * 2;
        }
        while (lon > Math.PI) {
            lon -= Math.PI * 2;
        }
        return lon;
    }

    function renderPoints(projection, lon0, scale, canvas) {

        var ctx, sc, recordID, shapeRecord, shape, projectionPoint, lon, lat, x, y, dx, dy, fill, stroke;

        projectionPoint = [];
        dx = canvas.width / 2;
        dy = -canvas.height / 2;
        ctx = canvas.getContext('2d');
        ctx.save();
        fill = typeof style !== "undefined" && style.hasOwnProperty("fillStyle");
        stroke = typeof style !== "undefined" && style.hasOwnProperty("strokeStyle");

        if (fill && ( typeof style.fillStyle !== "undefined")) {
            ctx.fillStyle = style.fillStyle;
        }
        if (stroke && ( typeof style.strokeStyle !== "undefined")) {
            ctx.strokeStyle = style.strokeStyle;
        }
        if ( typeof style !== "undefined" && style.hasOwnProperty("lineWidth") && typeof style.lineWidth !== "undefined") {
            ctx.lineWidth = style.lineWidth;
        }

        for ( recordID = 0; recordID < layer.shpFile.records.length; recordID += 1) {
            shapeRecord = layer.shpFile.records[recordID];
            shape = shapeRecord.shape;

            lon = adjustLongitude(shape.x, lon0);
            lat = shape.y;
            projection.forward(lon, lat, projectionPoint);
            x = projectionPoint[0] * scale + dx;
            y = canvas.height - projectionPoint[1] * scale + dy;

            if (fill && typeof style.fillStyle !== 'undefined') {
                ctx.fillRect(x - pointD / 2, y - pointD / 2, pointD, pointD);
            }
            if (stroke && typeof style.strokeStyle !== 'undefined') {
                ctx.strokeRect(x - pointD / 2, y - pointD / 2, pointD, pointD);
            }
        }
        ctx.restore();
    }

    function renderPolygons(projection, lon0, scale, canvas) {

        var ctx, sc, shapeRecord, recordID, shape, ringID, ring, ptID, lineDrawer;

        ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        applyStyle(style, ctx);
        lineDrawer = new LineDrawer(lon0, scale, projection, ctx);

        for ( recordID = 0; recordID < layer.shpFile.records.length; recordID += 1) {
            shapeRecord = layer.shpFile.records[recordID];
            shape = shapeRecord.shape;
            for ( ringID = 0; ringID < shape.rings.length; ringID += 1) {
                ring = shape.rings[ringID];
                for ( ptID = 0; ptID < ring.length; ptID += 1) {
                    lineDrawer.intersectProjectDraw(ring[ptID].x, ring[ptID].y);
                }
                lineDrawer.stroke();
            }
        }
        ctx.restore();
    }


    this.render = function(projection, lon0, scale, canvas) {

        if (layer.shpFile === null) {
            return;
        }

        switch (layer.shpFile.header.shapeType) {
            case ShpType.SHAPE_POLYGON:
            case ShpType.SHAPE_POLYLINE:
                renderPolygons(projection, lon0, scale, canvas);
                break;
            case ShpType.SHAPE_POINT:
                renderPoints(projection, lon0, scale, canvas);
                break;
        }
    };

    function pointsDegreeToRadian(records) {
        var i, nRecords, c = Math.PI / 180, shp;
        for ( i = 0, nRecords = records.length; i < nRecords; i += 1) {
            shp = records[i].shape;
            shp.x *= c;
            shp.y *= c;
        }
    }

    function linesDegreeToRadian(records) {
        var c = Math.PI / 180, nRecords, nRings, nVertices, i, j, ring, k, lon, lat, xMin, xMax, yMin, yMax, shp;
        for ( i = 0, nRecords = records.length; i < nRecords; i += 1) {
            shp = records[i].shape;
            xMin = Number.MAX_VALUE;
            xMax = -Number.MAX_VALUE;
            yMin = Number.MAX_VALUE;
            yMax = -Number.MAX_VALUE;

            for ( j = 0, nRings = shp.rings.length; j < nRings; j += 1) {
                ring = shp.rings[j];
                for ( k = 0, nVertices = ring.length; k < nVertices; k += 1) {
                    lon = ring[k].x * c;

                    if (lon > xMax) {
                        xMax = lon;
                    }
                    if (lon < xMin) {
                        xMin = lon;
                    }

                    if (lon > Math.PI) {
                        lon = Math.PI;
                    } else if (lon < -Math.PI) {
                        lon = -Math.PI;
                    }

                    ring[k].x = lon;

                    lat = ring[k].y * c;

                    // clamp to +/-PI/2
                    if (lat > Math.PI / 2) {
                        lat = Math.PI / 2;
                    } else if (lat < -Math.PI / 2) {
                        lat = -Math.PI / 2;
                    }

                    if (lat > yMax) {
                        yMax = lat;
                    }
                    if (lat < yMin) {
                        yMin = lat;
                    }
                    ring[k].y = lat;
                }
            }
            shp.box.xMin = xMin;
            shp.box.xMax = xMax;
            shp.box.yMin = yMin;
            shp.box.yMax = yMax;
        }
    }


    this.load = function(map) {

        function onShpFail() {
            alert('Failed to load ' + url);
        }

        function onDbfFail() {
            alert('Failed to load ' + url);
        }

        function onShpComplete(oHTTP) {
            layer.shpFile = new ShpFile(oHTTP.binaryResponse);

            // convert geometry from degrees to radians
            switch (layer.shpFile.header.shapeType) {
                case ShpType.SHAPE_POLYGON:
                case ShpType.SHAPE_POLYLINE:
                    linesDegreeToRadian(layer.shpFile.records);
                    break;
                case ShpType.SHAPE_POINT:
                    pointsDegreeToRadian(layer.shpFile.records);
                    break;
            }

            if (layer.dbfFile !== null) {
                map.render();
            }
        }

        function onDbfComplete(oHTTP) {
            layer.dbfFile = new DbfFile(oHTTP.binaryResponse);
            if (layer.shpFile !== null) {
                map.render();
            }
        }

        var shpLoader, dbfLoader;
        try {
            shpLoader = new BinaryAjax(url + '.shp', onShpComplete, onShpFail);
            dbfLoader = new BinaryAjax(url + '.dbf', onDbfComplete, onDbfFail);
        } catch (e) {
            alert(e);
        }
    };
}
