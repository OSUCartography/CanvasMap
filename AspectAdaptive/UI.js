/*globals Layer, Graticule, $, AspectAdaptiveCylindrical, createMap */

var map;

function deselectButtons() {
	"use strict";
	$('#selectable .ui-selected').removeClass('ui-selected');
	$('#selectable .ui-selecting').removeClass('ui-selecting');
}

function updateProjection() {
	"use strict";
	var projection = new AspectAdaptiveCylindrical();
	projection.setAspectRatio($("#sliderAspect").slider("value") / 100);
	map.setProjection(projection);
}

function updateSliderTexts() {
	"use strict";
	var aspectRatio;
	aspectRatio = $("#sliderAspect").slider("value") / 100;
	$("#sliderAspectText").text(aspectRatio.toFixed(2));
}

function setProjection(selectedItem) {
	"use strict";

	var aspectRatio;

	switch (selectedItem) {
	case "projectionPlateCarree":
		aspectRatio = 0.5;
		break;
	case "projectionCompactMiller":
		aspectRatio = 0.6;
		break;
	}
	
	if (!isNaN(aspectRatio)) {
		$("#sliderAspect").slider("value", aspectRatio * 100);
	}

	updateSliderTexts();
	updateProjection();
}

$(function() {
	"use strict";

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
				setProjection(ui.selecting.id);
				last_selectedItem_id = ui.selecting.id;
				if (firstRun) {
					firstRun = false;
				}
			}
		}
	});
});

function mouseEventHandler(e) {
	"use strict";

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

function initAspectSlider() {
	"use strict";
	function action(event, ui) {
		// fix a bug in jQuery slider
		// http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
		$("#sliderAspect").slider('value', ui.value);
		updateSliderTexts();
		updateProjection();
		deselectButtons();
	}

	// create the slider
	$("#sliderAspect").slider({
		orientation : "horizontal",
		range : "min",
		min : 30,
		max : 100,
		value : 60,
		step : 1,
		slide : action
	});
}

function getMapScale(map) {
	"use strict";

	var K = 0.95/2, aspectRatio = $("#sliderAspect").slider("value") / 100;
/*
	if (aspectRatio > map.getCanvas().height / map.getCanvas().width) {
		return map.getCanvas().height / (Math.PI) * K;
	}
	return map.getCanvas().width / Math.PI * K;*/
	
	if (map.getCanvas().height > map.getCanvas().width) {
		return map.getCanvas().width / Math.PI * K;
	}
	return map.getCanvas().height / Math.PI * K
}


$(window).load(function() {
	"use strict";
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

	map = createMap(layers, new AspectAdaptiveCylindrical(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());

	$(window).resize(function() {
		map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
		map.setScale(getMapScale(map));
	});

	$("#map").bind("mousedown", mouseEventHandler);

	initAspectSlider();
	updateSliderTexts();
	updateProjection();
	map.setScale(getMapScale(map));
});
