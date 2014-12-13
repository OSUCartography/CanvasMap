/*globals Layer, Graticule, $, Hufnagel, createMap */

var map;

function deselectButtons() {
	"use strict";
	$('#selectable .ui-selected').removeClass('ui-selected');
	$('#selectable .ui-selecting').removeClass('ui-selecting');
}

function updateProjection() {
	"use strict";
	var projection = new Hufnagel();
	projection.setA($("#sliderA").slider("value") / 100);
	projection.setB($("#sliderB").slider("value") / 100);
	projection.setPsiMax($("#sliderPsi").slider("value") / 180 * Math.PI);
	projection.setAspectRatio($("#sliderAspect").slider("value") / 100);
	map.setProjection(projection);
	if (projection.isGraticuleFolding()) {
		$("#foldingWarning").show();
	} else {
		$("#foldingWarning").hide();
	}
}

function updateSliderTexts() {
	"use strict";
	var a, b, psi, aspectRatio;
	a = $("#sliderA").slider("value") / 100;
	b = $("#sliderB").slider("value") / 100;
	psi = $("#sliderPsi").slider("value");
	aspectRatio = $("#sliderAspect").slider("value") / 100;
	$("#sliderAText").text(a.toFixed(4));
	$("#sliderBText").text(b.toFixed(4));
	$("#sliderPsiText").text(psi.toFixed(0) + "\u00B0");
	$("#sliderAspectText").text(aspectRatio.toFixed(2));
}

function setProjection(selectedItem) {
	"use strict";

	var a, b, psi, aspectRatio = 2;

	switch (selectedItem) {
	case "projectionMollweide":
		a = 0;
		b = 0;
		psi = 90;
		break;
	case "projectionEckertIV":
		a = 1;
		b = 0;
		psi = 45;
		break;
	case "projectionEckertVI":
		a = -0.09524;
		b = 0.09524;
		psi = 60;
		break;
	case "projectionMollweideWagner":
		a = 0;
		b = 0;
		psi = 60;
		break;
	case "projectionHufnagel2":
		a = 0.05556;
		b = -0.05556;
		psi = 90;
		break;
	case "projectionHufnagel3":
		a = 0.5;
		b = 0.05556;
		psi = 90;
		break;
	case "projectionHufnagel4":
		a = 0.08333;
		b = -0.08333;
		psi = 90;
		break;
	case "projectionHufnagel7":
		a = 0.08333;
		b = -0.08333;
		psi = 60;
		break;
	case "projectionHufnagel9":
		a = 0.66667;
		b = 0.33333;
		psi = 45;
		break;
	case "projectionHufnagel10":
		a = -0.66667;
		b = 0.66667;
		psi = 30;
		break;
	case "projectionHufnagel11":
		a = 0;
		b = -0.11111;
		psi = 90;
		break;
	case "projectionHufnagel12":
		a = 0;
		b = -0.11111;
		psi = 40;
		aspectRatio = 1 / 0.4;
		break;
	case "projectionCylindrical":
		a = NaN;
		b = NaN;
		psi = 1;
		aspectRatio = NaN;
		break;
	}
	
	if (!isNaN(a)) {
		$("#sliderA").slider("value", a * 100);
	}
	if (!isNaN(b)) {
		$("#sliderB").slider("value", b * 100);
	}
	if (!isNaN(psi)) {
		$("#sliderPsi").slider("value", psi);
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

function initASlider() {
	"use strict";

	function action(event, ui) {
		// fix a bug in jQuery slider
		// http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
		$("#sliderA").slider('value', ui.value);
		updateSliderTexts();
		updateProjection();
		deselectButtons();
	}

	// create the slider
	$("#sliderA").slider({
		orientation : "horizontal",
		range : "min",
		min : -100,
		max : 100,
		value : 0,
		step : 0.1,
		slide : action
	});
}

function initBSlider() {
	"use strict";
	function action(event, ui) {
		// fix a bug in jQuery slider
		// http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
		$("#sliderB").slider('value', ui.value);
		updateSliderTexts();
		updateProjection();
		deselectButtons();
	}

	// create the slider
	$("#sliderB").slider({
		orientation : "horizontal",
		range : "min",
		min : -100,
		max : 100,
		value : 0,
		step : 0.1,
		slide : action
	});
}

function initPsiSlider() {
	"use strict";
	function action(event, ui) {
		// fix a bug in jQuery slider
		// http://stackoverflow.com/questions/9121160/jquery-ui-slider-value-returned-from-slide-event-on-release-is-different-fro
		$("#sliderPsi").slider('value', ui.value);
		updateSliderTexts();
		updateProjection();
		deselectButtons();
	}

	// create the slider
	$("#sliderPsi").slider({
		orientation : "horizontal",
		range : "min",
		min : 1,
		max : 90,
		value : 90,
		step : 1,
		slide : action
	});
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
		min : 100,
		max : 275,
		value : 200,
		step : 1,
		slide : action
	});
}

function getMapScale(map) {
	"use strict";

	var K = 0.95, aspectRatio = $("#sliderAspect").slider("value") / 100;
	if (aspectRatio > map.getCanvas().width / map.getCanvas().height) {
		return map.getCanvas().width / (2 * Math.PI) * K;
	}
	return map.getCanvas().height / Math.PI * K;
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

	map = createMap(layers, new Hufnagel(), $("#mapCanvas")[0], $("#mapCanvas").width(), $("#mapCanvas").height());

	$(window).resize(function() {
		map.resize($("#mapCanvas").width(), $("#mapCanvas").height());
		map.setScale(getMapScale(map));
	});

	$("#map").bind("mousedown", mouseEventHandler);

	initASlider();
	initBSlider();
	initPsiSlider();
	initAspectSlider();
	updateSliderTexts();
	updateProjection();
	map.setScale(getMapScale(map));
});
