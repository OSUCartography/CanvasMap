function McBrydeThomas1() {
    "use strict";

    var sineSeries = new SineSeries(1.48875, 1.36509);

    this.toString = function () {
        return 'McBryde-Thomas I';
    };

    this.forward = sineSeries.forward;
    this.inverse = sineSeries.inverse;
}