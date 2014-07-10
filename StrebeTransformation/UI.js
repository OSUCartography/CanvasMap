/*globals Map, Layer, Graticule, $, Strebe1995, createMap*/

var map;

function getMapScale(map) {"use strict";
    return 80;
    //var K = 0.80;
    //return Math.min(map.getMaximumVerticalScale(), map.getMaximumHorizontalScale()) * K;
}

function writeSliderValue(nbr) {"use strict";
    $("#sliderText").text(nbr);
}

function mouseEventHandler(e) {"use strict";

    var mouseMove, mouseUp, prevMouse;

    prevMouse = {
        x : e.clientX,
        y : e.clientY
    };

    mouseMove = function(e) {
        var unitsPerPixel, lon0, dx = e.clientX - prevMouse.x;

        unitsPerPixel = 1 / getMapScale(map);
        lon0 = map.getCentralLongitude();
        lon0 -= dx * unitsPerPixel;

        map.setCentralLongitude(lon0);

        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
        e.preventDefault();
    };

    mouseUp = function(e) {
        document.body.style.cursor = null;
        document.removeEventListener('mousemove', mouseMove, false);
        document.removeEventListener('mouseup', mouseUp, false);
    };

    document.body.style.cursor = 'move';
    document.addEventListener('mousemove', mouseMove, false);
    document.addEventListener('mouseup', mouseUp, false);
}

function initSlider() {"use strict";

    $(function() {

        function action(event, ui) {
            // fix a bug in jQuery slider
            // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
            $("#slider").slider('value', ui.value);
            writeSliderValue(ui.value);
            map.getProjection().setScaleFactor(ui.value);
            map.render();
        }

        // create the slider
        $("#slider").slider({
            orientation : "horizontal",
            range : "min",
            min : 0,
            max : 5,
            value : 1.35,
            step : 0.01,
            slide : action
        });
        writeSliderValue(1.35);
    });
}

function getProjection(projectionName) {"use strict";
    var proj;

    switch (projectionName) {
        case "AlbersConic":
            return new AlbersConic();
        case "ArdenClose":
            return new ArdenClose();
        case "Bonne":
            return new Bonne();
        case "BraunStereographic":
            proj = new CylindricalStereographic();
            proj.setStandardParallel(0);
            return proj;
        case "Braun2":
            return new Braun2();
        case "BSAM":
            proj = new CylindricalStereographic();
            proj.setStandardParallel(30 / 180 * Math.PI);
            return proj;
        case "Canters1":
            return new Canters1();
        case "Canters2":
            return new Canters2();
        case "CentralCylindrical":
            return new CentralCylindrical();
        case "CylindricalStereographic":
            return new CylindricalStereographic();
        case "Eckert4":
            return new Eckert4();
        case "EqualAreaCylindrical":
            return new EqualAreaCylindrical();
        case "Equirectangular":
            return new Equirectangular();
        case "GallIsographic":
            proj = new Equirectangular();
            proj.setStandardParallel(Math.PI / 4);
            return proj;
        case "GallPeters":
            proj = new EqualAreaCylindrical();
            proj.setStandardParallel(Math.PI / 4);
            return proj;
        case "GallStereographic":
            proj = new CylindricalStereographic();
            proj.setStandardParallel(Math.PI / 4);
            return proj;
        case "Hammer":
            return new Hammer();
        case "Hufnagel":
            return new Hufnagel();
        case "Kamenetskiy1":
            proj = new CylindricalStereographic();
            proj.setStandardParallel(55 / 180 * Math.PI);
            return proj;
        case "Kavrayskiy1":
            return new Kavrayskiy1();
        case "KharchenkoShabanova":
            return new KharchenkoShabanova();
        case "LambertEqualAreaCylindrical":
            return new LambertEqualAreaCylindrical();
        case "Mercator":
            return new Mercator();
        case "Miller":
            return new Miller();
        case "Miller2":
            return new Miller2();
        case "MillerGall":
            proj = new CylindricalStereographic();
            // standard parallel at 66.16 degrees
            proj.setStandardParallel(2 / Math.sqrt(3));
            return proj;
        case "MillerPerspective":
            return new MillerPerspective();
        case "Mollweide":
            return new Mollweide();
        case "NaturalEarth":
            return new NaturalEarth();
        case "Pavlov":
            return new Pavlov();
        case "PlateCarree":
            proj = new Equirectangular();
            proj.setStandardParallel(0);
            return proj;
        case "RMillerMinOverallScaleDistortion":
            proj = new Equirectangular();
            proj.setStandardParallel(37.5 / 180 * Math.PI);
            return proj;
        case "RMillerMinContinentalScaleDistortion":
            proj = new Equirectangular();
            proj.setStandardParallel(43.5 / 180 * Math.PI);
            return proj;
        case "Robinson":
            return new Robinson();
        case "Sinusoidal":
            return new Sinusoidal();
        case "Strebe1995":
            return new Strebe1995();
        case "Tobler1":
            return new Tobler1();
        case "Tobler2":
            return new Tobler2();
        case "Urmayev2":
            return new Urmayev2();
        case "Urmayev3":
            return new Urmayev3();
        case "Wagner7":
            return new Wagner7();
        case "LambertAzimuthalEqualAreaPolar":
            return new LambertAzimuthalEqualAreaPolar();
        default:
            return null;
    }
}

function setForward1() {"use strict";
    map.getProjection().setForward1(getProjection($("#forward1-menu").val()));
    map.render();
}

function setInverse() {"use strict";
    map.getProjection().setInverse(getProjection($("#inverse-menu").val()));
    map.render();
}

function setForward2() {"use strict";
    map.getProjection().setForward2(getProjection($("#forward2-menu").val()));
    map.render();
}

$(window).load(function() {"use strict";

    // currently styling works like this:
    // - if there's a fillStyle then it will be filled
    // - if there's a strokeStyle then it will be stroked
    // - points are always 3px rectangles
    // - polylines can't be filled

    var layers = [];

    function Style(strokeStyle, lineWidth, fillStyle) {
        if (strokeStyle !== undefined) {
            this.strokeStyle = strokeStyle;
            this.lineWidth = lineWidth;
        }
        if (fillStyle !== undefined) {
            this.fillStyle = fillStyle;
        }
    }

    //create the map
    layers.push(new Layer("../data/ne_110m_coastline", new Style("#888", "1")));
    layers.push(new Graticule(new Style("#77b", "1"), 15));

    map = createMap(layers, new Strebe1995(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());
    $(window).resize(function() {
        map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
        map.setScale(getMapScale(map));
    });

    map.setScale(getMapScale(map));

    // init UI controls
    $("#map").bind("mousedown", mouseEventHandler);

    initSlider();

    // ie
    $("#mapCanvas")[0].onselectstart = function() {
        return false;
    };
    // mozilla
    $("#mapCanvas")[0].onmousedown = function() {
        return false;
    };

    $("#forward1-menu").bind("change", setForward1);
    $("#inverse-menu").bind("change", setInverse);
    $("#forward2-menu").bind("change", setForward2);
    
});

