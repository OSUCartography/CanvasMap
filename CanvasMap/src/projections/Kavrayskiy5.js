function Kavrayskiy5() {
    "use strict";

    var sineSeries = new SineSeries(1.504875, 1.504875 * 0.9);

    this.toString = function () {
        return 'Kavrayskiy V';
    };

    this.forward = sineSeries.forward;
    this.inverse = sineSeries.inverse;
}