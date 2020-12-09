export default class SeedableRandomDataPointGenerator{

    constructor(seed = Date.now()) {
        this._seed = seed;
    }

    // Apparently, in js there's no way to seed the random generator so:
    // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
    num(min, max) {
        this._seed = (this._seed * 9301 + 49297) % 233280;
        return min + (this._seed / 233280) * (max - min);
    }
  
    numbers (count, min, max) {
        var data = [];
        for (var i = 0; i < count; ++i)
          data.push(Math.round(this.num(min, max)));
        return data;
    }
  
    timePoints (start = Date.now, count = 100, step = 100, min, max) {
        var y = this.numbers(count, min, max);
        var points = [];
        for (var i = y.length - 1; i >= 0; i--) {
            points.push({
                x: start -= step,
                y: y[i]
            });
        }
        return points;
    }
}