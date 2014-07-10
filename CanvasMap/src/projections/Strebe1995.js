function Strebe1995() {"use strict";

	var kg = 1.35, forward1 = new Eckert4(), inv = new Mollweide(), forward2 = new Hammer();

	this.setScaleFactor = function(sf) {
		kg = sf;
	};

	this.setForward1 = function(f1) {
		forward1 = f1;
	};
	
	this.setForward2 = function(f2) {
		forward2 = f2;
	};

	this.setInverse = function(inverse) {
		inv = inverse;
	};
		
	this.toString = function() {
		return 'Strebe 1995 (Equal Area)';
	};

	this.forward = function(lon, lat, xy) {
		// Eckert IV
		forward1.forward(lon, lat, xy);
		// Mollweide
		inv.inverse(xy[0] * kg, xy[1] / kg, xy);
		// Hammer
		forward2.forward(xy[0], xy[1], xy);
		xy[0] /= kg;
		xy[1] *= kg;
	};
}