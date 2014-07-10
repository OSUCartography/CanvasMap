/*globals Layer, Graticule, $, TransformableLambert, createMap */

var map,

//true when projection is animated
animateFlag = false,

// id for stopping the animation
animationIntervalId,

// frames per second for animations
ANIMATION_FPS = 20,

// the duration of an animation in seconds
ANIMATION_DURATION = 1,

// the number of frames for one animation
ANIMATION_NBR_FRAMES = Math.round(ANIMATION_DURATION * 1000 / ANIMATION_FPS);

function selectSelectableElement(selectableContainer, elementsToSelect) {"use strict";
    // add unselecting class to all elements in the styleboard canvas except the ones to select
    $(".ui-selected", selectableContainer).not(elementsToSelect).removeClass("ui-selected").addClass("ui-unselecting");

    // add ui-selecting class to the elements to select
    $(elementsToSelect).not(".ui-selected").addClass("ui-selecting");

    // trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
    $('#selectable').selectable("option", "stop");
}

function updateProjection() {"use strict";
    var lat0, w, lam1, phi1, pCyl, p, phi0, projection;

    if (!animateFlag) {
        if ($("#sliderBoundingParallel").slider("value") === 90 && $("#sliderBoundingMeridian").slider("value") === 180 && $("#sliderEquator").slider("value") === 1.41) {
            selectSelectableElement($("#selectable"), $("li:first", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 90 && $("#sliderBoundingMeridian").slider("value") === 90 && $("#sliderEquator").slider("value") === 2) {
            selectSelectableElement($("#selectable"), $("li:nth-child(2)", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 90 && $("#sliderBoundingMeridian").slider("value") === 45 && $("#sliderEquator").slider("value") === 2.16) {
            selectSelectableElement($("#selectable"), $("li:nth-child(3)", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 90 && $("#sliderBoundingMeridian").slider("value") === 0 && $("#sliderEquator").slider("value") === 2.22) {
            selectSelectableElement($("#selectable"), $("li:nth-child(4)", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 65 && $("#sliderBoundingMeridian").slider("value") === 60 && $("#sliderEquator").slider("value") === 2) {
            selectSelectableElement($("#selectable"), $("li:nth-child(5)", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 0 && $("#sliderBoundingMeridian").slider("value") === 0 && $("#sliderEquator").slider("value") === 3.14) {
            selectSelectableElement($("#selectable"), $("li:nth-child(6)", "#selectable"));
        } else if ($("#sliderBoundingParallel").slider("value") === 62 && $("#sliderBoundingMeridian").slider("value") === 0 && $("#sliderEquator").slider("value") === 2.03) {
            selectSelectableElement($("#selectable"), $("li:last", "#selectable"));
        } else {
            $('#selectable .ui-selected').removeClass('ui-selected');
            $('#selectable .ui-selecting').removeClass('ui-selecting');
        }
    }

    p = $("#sliderEquator").slider("value");
    phi1 = $("#sliderBoundingParallel").slider("value") / 180 * Math.PI;
    lam1 = $("#sliderBoundingMeridian").slider("value") / 180 * Math.PI;

    projection = new TransformableLambert();

    phi0 = Math.acos(Math.sqrt(p / Math.PI));
    phi0 = phi0 * 180 / Math.PI;

    if (parseFloat(phi1.toFixed(1)) === 0 && parseFloat(lam1.toFixed(1)) === 0) {
        if (parseFloat(p.toFixed(2)) < 3.14) {
            //$('#StParallel').show();
            $("#StParallel").html('Cylindrical projection with standard parallels at &plusmn;' + phi0.toFixed(1) + "\u00B0" + ".");
        } else if (parseFloat(p.toFixed(2)) === 3.14) {
            //$('#StParallel').show();
            $("#StParallel").html('Cylindrical projection with standard parallels at ' + "0" + "\u00B0" + ".");
        } else if (parseFloat(p.toFixed(2)) > 3.14) {
            //$('#StParallel').hide();
            $("#StParallel").html('&nbsp;');
        }
    } else {
        //$('#StParallel').hide();
        $("#StParallel").html('&nbsp;');
    }
    projection.initialize(lam1, phi1, p);
    map.setProjection(projection);
}

function updateSliderTexts() {"use strict";
    $("#sliderBoundingParallelText").text($("#sliderBoundingParallel").slider('value').toFixed(0) + "\u00B0");
    $("#sliderBoundingMeridianText").text($("#sliderBoundingMeridian").slider('value').toFixed(0) + "\u00B0");
    $("#sliderEquatorText").text($("#sliderEquator").slider('value').toFixed(2));
}

function animate(targetBoundingParallel, targetBoundingMeridian, targetEquator) {"use strict";

    var dBoundingParallel, dBoundingMeridian, dEquator, frameCounter = 1;
    function animateSliders() {

        $("#sliderBoundingParallel").slider("value", targetBoundingParallel - (ANIMATION_NBR_FRAMES - frameCounter) * dBoundingParallel);
        $("#sliderBoundingMeridian").slider("value", targetBoundingMeridian - (ANIMATION_NBR_FRAMES - frameCounter) * dBoundingMeridian);
        $("#sliderEquator").slider("value", targetEquator - (ANIMATION_NBR_FRAMES - frameCounter) * dEquator);
        
        //console.log(targetBoundingParallel - (ANIMATION_NBR_FRAMES - frameCounter) * dBoundingParallel, targetBoundingMeridian - (ANIMATION_NBR_FRAMES - frameCounter) * dBoundingMeridian, targetEquator - (ANIMATION_NBR_FRAMES - frameCounter) * dEquator);
                
        updateSliderTexts();
        updateProjection();
        
        frameCounter += 1;
        if (frameCounter > ANIMATION_NBR_FRAMES) {
            clearInterval(animationIntervalId);
        }
    }

    // compute the change/step for each slider
    dBoundingParallel = (targetBoundingParallel - $("#sliderBoundingParallel").slider("value") ) / ANIMATION_NBR_FRAMES;
    dBoundingMeridian = (targetBoundingMeridian - $("#sliderBoundingMeridian").slider("value") ) / ANIMATION_NBR_FRAMES;
    dEquator = (targetEquator - $("#sliderEquator").slider("value") ) / ANIMATION_NBR_FRAMES;

    // calls projection at specified intervals (milliseconds)
    animationIntervalId = setInterval(animateSliders, 1 / ANIMATION_FPS);
}

function animateHelper(selectedItem) {"use strict";

    var targetBoundingParallel, targetBoundingMeridian, targetEquator;

    animateFlag = true;
    clearInterval(animationIntervalId);
    //selectedItem = $('#selectable .ui-selecting').attr('id');
    //selectedItem = $('#selectable .ui-selected').attr('id');

    if (selectedItem === "projectionLambertAzimuthalEA") {
        targetBoundingParallel = 90;
        targetBoundingMeridian = 180;
        targetEquator = Math.sqrt(2);
    } else if (selectedItem === "projectionHammer") {
        targetBoundingParallel = 90;
        targetBoundingMeridian = 90;
        targetEquator = 2;
    } else if (selectedItem === "projectionEckertGreifendorff") {
        targetBoundingParallel = 90;
        targetBoundingMeridian = 45;
        targetEquator = 4 * Math.sqrt(2) * Math.sin(22.5 * Math.PI / 180);
    } else if (selectedItem === "projectionQuarticAuthalic") {
        targetBoundingParallel = 90;
        targetBoundingMeridian = 0;
        targetEquator = (Math.sqrt(2) / 2) * Math.PI;
    } else if (selectedItem === "projectionWagnerVII") {
        targetBoundingParallel = 65;
        targetBoundingMeridian = 60;
        targetEquator = 2;
    } else if (selectedItem === "projectionLambertCylindricalEA") {
        targetBoundingParallel = 0;
        targetBoundingMeridian = 0;
        targetEquator = Math.PI;
    } else if (selectedItem === "projectionPseudocylindrical") {
        targetBoundingParallel = 62;
        targetBoundingMeridian = 0;
        targetEquator = 2.03;
    }

    animate(targetBoundingParallel, targetBoundingMeridian, targetEquator);
}

$(function() {"use strict";

    var mousedown = false, firstRun = true, last_selectedItem_id;
    $('#selectable').selectable({
        start : function(event, ui) {
            mousedown = true;
        },
        stop : function(event, ui) {
            //Here the event ends, so that we can remove the selected class to all but the one we want
            $(event.target).children('.ui-selected').not("#" + last_selectedItem_id).removeClass('ui-selected');
            mousedown = false;
        },
        //a special case is the first run,
        //$(".ui-selected, .ui-selecting").length is considered to be 2
        selecting : function(event, ui) {
            if (($(".ui-selected, .ui-selecting").length > 1 ) && firstRun === false) {
                $(event.target).children('.ui-selecting').not(':first').removeClass('ui-selecting');
                $(ui.selecting).removeClass("ui-selecting");
            } else {
                animateHelper(ui.selecting.id);
                last_selectedItem_id = ui.selecting.id;
                if (firstRun) {
                    firstRun = false;
                }
            }
        }
    });
});

function mouseEventHandler(e) {"use strict";

    var mouseMove, mouseUp, prevMouse;

    prevMouse = {
        x : e.clientX,
        y : e.clientY
    };

    mouseMove = function(e) {
        var unitsPerPixel, lon0, dx = e.clientX - prevMouse.x;

        unitsPerPixel = 1 / map.getScale();
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

function initBoundingParallelSlider() {"use strict";

    function action(event, ui) {
        //if animation is going on, interrupt it!
        clearInterval(animationIntervalId);
        animateFlag = false;

        // fix a bug in jQuery slider
        // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
        $("#sliderBoundingParallel").slider('value', ui.value);
        updateSliderTexts();
        updateProjection();
    }

    // create the slider
    $("#sliderBoundingParallel").slider({
        orientation : "horizontal",
        range : "min",
        min : 0,
        max : 90,
        value : 90,
        step : 1,
        slide : action
    });
}

function initBoundingMeridianSlider() {"use strict";
    function action(event, ui) {
        //if animation is going on, interrupt it!
        clearInterval(animationIntervalId);
        animateFlag = false;

        // fix a bug in jQuery slider
        // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
        $("#sliderBoundingMeridian").slider('value', ui.value);
        updateSliderTexts();
        updateProjection();
    }

    // create the slider
    $("#sliderBoundingMeridian").slider({
        orientation : "horizontal",
        range : "min",
        min : 0,
        max : 180,
        value : 180,
        step : 1,
        slide : action
    });
}

function initEquatorSlider() {"use strict";
    function action(event, ui) {
        //if animation is going on, interrupt it!
        clearInterval(animationIntervalId);
        animateFlag = false;

        // fix a bug in jQuery slider
        // http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
        $("#sliderEquator").slider('value', ui.value);
        updateSliderTexts();
        updateProjection();
    }

    // create the slider
    $("#sliderEquator").slider({
        orientation : "horizontal",
        range : "min",
        min : 1,
        max : 3.5,
        value : 1.41,
        step : 0.01,
        slide : action
    });
}

function getMapScale(map) {"use strict";
    
    // a reduction factor such that the Lambert Cylindrical fits horizontally
    var K = 0.62, 
    // use the Lambert azimuthal as a reference to compute the map scale
    // otherwise different scales would result depending on the chosen parameters, which would
    // result in abrupt changes when the canvas is resized.
    // the graticule diameter of the Lambert azimuthal is 4
    hScale = map.getCanvas().width / 4, vScale = map.getCanvas().height / 4;
    return Math.min(vScale, hScale) * K;
}


$(window).load(function() {"use strict";
    // currently styling works like this:
    // - if there's a fillStyle then it will be filled
    // - if there's a strokeStyle then it will be stroked
    // - points are always 3px rectangles
    // - polylines can't be filled

    var layers, graticule;

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
    graticule = new Graticule(new Style("#77b", "1"), 15);
    layers = [];
    layers.push(new Layer("../data/ne_110m_coastline", new Style("#888", "1")));
    layers.push(graticule);

    map = createMap(layers, new TransformableLambert(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());
    
    $(window).resize(function() {
        map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
        map.setScale(getMapScale(map));
    });
    
    $("#map").bind("mousedown", mouseEventHandler);

    initBoundingParallelSlider();
    initBoundingMeridianSlider();
    initEquatorSlider();
    updateSliderTexts();
    updateProjection();
    map.setScale(getMapScale(map));
});
