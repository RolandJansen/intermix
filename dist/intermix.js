/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Helper.ts":
/*!***********************!*\
  !*** ./src/Helper.ts ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * This class provides functions that makes
 * working with Intermix easier.
 * @example <caption>Create a note event. Uid is the unique id of the
 * event receiver.</caption>
 * var noteEvent = helper.createNoteEvent(<uid>, 'c3', 0.5);
 * @example <caption>Get the frequency of a note</caption>
 * var frequencyOfGis4 = helper.getNoteFrequency('g#4');
 */
var Helper = /** @class */ (function () {
    function Helper() {
        this.frequencyLookup = this.getNoteFrequencies();
    }
    /**
     * Creates an event of any type.
     * @param uid   Unique ID of the event receiver
     * @param type  Event type (note, volume, etc)
     * @param value Value of the event
     * @return      An intermix event object (not a js event)
     */
    Helper.prototype.createGenericEvent = function (uid, type, value) {
        return {
            uid: uid,
            msg: { type: type, value: value },
        };
    };
    /**
     * Creates an event of type "note".
     * @param  uid      Unique ID of the event receiver
     * @param  note     Note (like "c3", "a#5") or midi note number
     * @param  velocity Like Midi velocity but high res float of range [0, 1]
     * @param  steps    Length of a tone in 64th note steps
     * @return          A note event
     */
    Helper.prototype.createNoteEvent = function (uid, tone, velocity, steps) {
        if (typeof tone === "string") {
            tone = this.getNoteNumber(tone);
        }
        if (velocity < 0 || velocity > 1) {
            throw new Error("Velocity out of bounds: " + velocity);
        }
        return {
            uid: uid,
            msg: {
                type: "note",
                value: tone,
                velocity: velocity,
                steps: steps,
            },
        };
    };
    /**
     * Creates an event of type "volume".
     * @param  uid    Unique ID of the event receiver.
     * @param  volume Like Midi Volume (Integer of range [0, 127])
     * @return        A volume event
     */
    Helper.prototype.createVolumeEvent = function (uid, volume) {
        if (volume < 0 || volume > 127) {
            throw new Error("Volume out of bounds: " + volume);
        }
        return {
            uid: uid,
            msg: {
                type: "volume",
                value: volume,
            },
        };
    };
    /**
     * Returns the frequency of a note.
     * @param  note Note (like "c3", "a#5") or midi note number
     * @return      Frequency
     */
    Helper.prototype.getNoteFrequency = function (note) {
        if (typeof note === "string") {
            note = this.getNoteNumber(note);
        }
        return this.frequencyLookup[note];
    };
    /**
     * Computes the frequencies of all midi notes and returns
     * them as an array.
     * @private
     * @return    Frequency table
     */
    Helper.prototype.getNoteFrequencies = function () {
        var frequencies = new Array(128);
        var a4 = 440;
        var posa4 = 69;
        for (var i = 0; i < 128; i++) {
            frequencies[i] = a4 * Math.pow(2, ((i - posa4) / 12));
        }
        return frequencies;
    };
    /**
     * Takes a string of the form c3 or d#4 and
     * returns the corresponding number. Upper classes
     * strings are allowed and "h" will be converted to "b".
     * @param  tone String representing a note
     * @return      Number representing a note
     */
    Helper.prototype.getNoteNumber = function (tone) {
        var notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
        var str = tone.toLowerCase();
        if (str.match(/^[a-h]#?[0-9]$/)) {
            var note = str.substring(0, str.length - 1);
            var oct = parseInt(str.slice(-1), 10);
            if (note === "h") {
                note = "b";
            }
            return notes.indexOf(note) + (oct + 1) * 12; // +1: because 1st midi octave is -1
        }
        else {
            throw new Error("Unvalid string. Has to be like [a-h]<#>[0-9]");
        }
    };
    return Helper;
}());
/* harmony default export */ __webpack_exports__["default"] = (Helper);
/**
 * Tests if an object is a plain javascript object (object literal)
 * and not a constructor, instance, null or anything else.
 * as suggested by RobG:
 * http://stackoverflow.com/questions/5876332/how-can-i-differentiate-between-an-object-literal-other-javascript-objects
 * @param  {Object} obj Any javascript object
 * @return {Boolean}    True if plain js object, false if not
 */
// Helper.prototype.isPlainObject = function(obj) {
//   if (typeof obj === "object" && obj !== null) {
//     var proto = Object.getPrototypeOf(obj);
//     return proto === Object.prototype || proto === null;
//   }
//   return false;
// };
// module.exports = new Helper();


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Helper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Helper */ "./src/Helper.ts");
// intermix.EventBus = require('./EventBus.js');
// intermix.SoundWave = require('./SoundWave.js');
// intermix.Sound = require('./Sound.js');
// intermix.Sequencer = require('./Sequencer.js');
// intermix.Part = require('./Part.js');
// intermix.helper = require('./Helper.js');
// intermix.eventBus = new intermix.EventBus();

var Intermix = /** @class */ (function () {
    function Intermix() {
        this.audioContext = new window.AudioContext();
        this.helper = new _Helper__WEBPACK_IMPORTED_MODULE_0__["default"]();
    }
    return Intermix;
}());
/* harmony default export */ __webpack_exports__["default"] = (Intermix);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL0hlbHBlci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQ2xFQTtBQUFBOzs7Ozs7OztHQVFHO0FBQ0g7SUFHRTtRQUNFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLG1DQUFrQixHQUF6QixVQUEwQixHQUFXLEVBQ1gsSUFBWSxFQUNaLEtBQTRCO1FBQ3BELE9BQU87WUFDTCxHQUFHO1lBQ0gsR0FBRyxFQUFFLEVBQUUsSUFBSSxRQUFFLEtBQUssU0FBRTtTQUNyQixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxnQ0FBZSxHQUF0QixVQUF1QixHQUFXLEVBQ1gsSUFBcUIsRUFDckIsUUFBZ0IsRUFDaEIsS0FBYTtRQUNsQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUM1QixJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FB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O0FBQ0gsbURBQW1EO0FBQ25ELG1EQUFtRDtBQUNuRCw4Q0FBOEM7QUFDOUMsMkRBQTJEO0FBQzNELE1BQU07QUFDTixrQkFBa0I7QUFDbEIsS0FBSztBQUVMLGlDQUFpQzs7Ozs7Ozs7Ozs7Ozs7QUN6SmpDO0FBQUEsZ0RBQWdEO0FBQ2hELGtEQUFrRDtBQUNsRCwwQ0FBMEM7QUFDMUMsa0RBQWtEO0FBQ2xELHdDQUF3QztBQUV4Qyw0Q0FBNEM7QUFDNUMsK0NBQStDO0FBQ2pCO0FBRTlCO0lBS0k7UUFDSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSwrQ0FBTSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDIiwiZmlsZSI6ImludGVybWl4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vc3JjL21haW4udHNcIik7XG4iLCJpbXBvcnQgeyBJR2VuZXJpY0V2ZW50IH0gZnJvbSBcIi4vSUhlbHBlclwiO1xuLyoqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IG1ha2VzXG4gKiB3b3JraW5nIHdpdGggSW50ZXJtaXggZWFzaWVyLlxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGEgbm90ZSBldmVudC4gVWlkIGlzIHRoZSB1bmlxdWUgaWQgb2YgdGhlXG4gKiBldmVudCByZWNlaXZlci48L2NhcHRpb24+XG4gKiB2YXIgbm90ZUV2ZW50ID0gaGVscGVyLmNyZWF0ZU5vdGVFdmVudCg8dWlkPiwgJ2MzJywgMC41KTtcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkdldCB0aGUgZnJlcXVlbmN5IG9mIGEgbm90ZTwvY2FwdGlvbj5cbiAqIHZhciBmcmVxdWVuY3lPZkdpczQgPSBoZWxwZXIuZ2V0Tm90ZUZyZXF1ZW5jeSgnZyM0Jyk7XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlbHBlciB7XG4gIHByaXZhdGUgZnJlcXVlbmN5TG9va3VwOiBudW1iZXJbXTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmZyZXF1ZW5jeUxvb2t1cCA9IHRoaXMuZ2V0Tm90ZUZyZXF1ZW5jaWVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBldmVudCBvZiBhbnkgdHlwZS5cbiAgICogQHBhcmFtIHVpZCAgIFVuaXF1ZSBJRCBvZiB0aGUgZXZlbnQgcmVjZWl2ZXJcbiAgICogQHBhcmFtIHR5cGUgIEV2ZW50IHR5cGUgKG5vdGUsIHZvbHVtZSwgZXRjKVxuICAgKiBAcGFyYW0gdmFsdWUgVmFsdWUgb2YgdGhlIGV2ZW50XG4gICAqIEByZXR1cm4gICAgICBBbiBpbnRlcm1peCBldmVudCBvYmplY3QgKG5vdCBhIGpzIGV2ZW50KVxuICAgKi9cbiAgcHVibGljIGNyZWF0ZUdlbmVyaWNFdmVudCh1aWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG51bWJlcnxzdHJpbmd8Ym9vbGVhbik6IElHZW5lcmljRXZlbnQge1xuICAgIHJldHVybiB7XG4gICAgICB1aWQsXG4gICAgICBtc2c6IHsgdHlwZSwgdmFsdWUgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gZXZlbnQgb2YgdHlwZSBcIm5vdGVcIi5cbiAgICogQHBhcmFtICB1aWQgICAgICBVbmlxdWUgSUQgb2YgdGhlIGV2ZW50IHJlY2VpdmVyXG4gICAqIEBwYXJhbSAgbm90ZSAgICAgTm90ZSAobGlrZSBcImMzXCIsIFwiYSM1XCIpIG9yIG1pZGkgbm90ZSBudW1iZXJcbiAgICogQHBhcmFtICB2ZWxvY2l0eSBMaWtlIE1pZGkgdmVsb2NpdHkgYnV0IGhpZ2ggcmVzIGZsb2F0IG9mIHJhbmdlIFswLCAxXVxuICAgKiBAcGFyYW0gIHN0ZXBzICAgIExlbmd0aCBvZiBhIHRvbmUgaW4gNjR0aCBub3RlIHN0ZXBzXG4gICAqIEByZXR1cm4gICAgICAgICAgQSBub3RlIGV2ZW50XG4gICAqL1xuICBwdWJsaWMgY3JlYXRlTm90ZUV2ZW50KHVpZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvbmU6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxvY2l0eTogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBzOiBudW1iZXIpOiBJR2VuZXJpY0V2ZW50IHtcbiAgICBpZiAodHlwZW9mIHRvbmUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRvbmUgPSB0aGlzLmdldE5vdGVOdW1iZXIodG9uZSk7XG4gICAgfVxuICAgIGlmICh2ZWxvY2l0eSA8IDAgfHwgdmVsb2NpdHkgPiAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZWxvY2l0eSBvdXQgb2YgYm91bmRzOiBcIiArIHZlbG9jaXR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdWlkLFxuICAgICAgbXNnOiB7XG4gICAgICAgIHR5cGU6IFwibm90ZVwiLFxuICAgICAgICB2YWx1ZTogdG9uZSxcbiAgICAgICAgdmVsb2NpdHksXG4gICAgICAgIHN0ZXBzLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gZXZlbnQgb2YgdHlwZSBcInZvbHVtZVwiLlxuICAgKiBAcGFyYW0gIHVpZCAgICBVbmlxdWUgSUQgb2YgdGhlIGV2ZW50IHJlY2VpdmVyLlxuICAgKiBAcGFyYW0gIHZvbHVtZSBMaWtlIE1pZGkgVm9sdW1lIChJbnRlZ2VyIG9mIHJhbmdlIFswLCAxMjddKVxuICAgKiBAcmV0dXJuICAgICAgICBBIHZvbHVtZSBldmVudFxuICAgKi9cbiAgcHVibGljIGNyZWF0ZVZvbHVtZUV2ZW50KHVpZDogc3RyaW5nLCB2b2x1bWU6IG51bWJlcik6IElHZW5lcmljRXZlbnQge1xuICAgIGlmICh2b2x1bWUgPCAwIHx8IHZvbHVtZSA+IDEyNykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVm9sdW1lIG91dCBvZiBib3VuZHM6IFwiICsgdm9sdW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdWlkLFxuICAgICAgbXNnOiB7XG4gICAgICAgIHR5cGU6IFwidm9sdW1lXCIsXG4gICAgICAgIHZhbHVlOiB2b2x1bWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZnJlcXVlbmN5IG9mIGEgbm90ZS5cbiAgICogQHBhcmFtICBub3RlIE5vdGUgKGxpa2UgXCJjM1wiLCBcImEjNVwiKSBvciBtaWRpIG5vdGUgbnVtYmVyXG4gICAqIEByZXR1cm4gICAgICBGcmVxdWVuY3lcbiAgICovXG4gIHB1YmxpYyBnZXROb3RlRnJlcXVlbmN5KG5vdGU6IG51bWJlcnxzdHJpbmcpOiBudW1iZXIge1xuICAgIGlmICh0eXBlb2Ygbm90ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbm90ZSA9IHRoaXMuZ2V0Tm90ZU51bWJlcihub3RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZnJlcXVlbmN5TG9va3VwW25vdGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHRoZSBmcmVxdWVuY2llcyBvZiBhbGwgbWlkaSBub3RlcyBhbmQgcmV0dXJuc1xuICAgKiB0aGVtIGFzIGFuIGFycmF5LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJuICAgIEZyZXF1ZW5jeSB0YWJsZVxuICAgKi9cbiAgcHJpdmF0ZSBnZXROb3RlRnJlcXVlbmNpZXMoKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGZyZXF1ZW5jaWVzID0gbmV3IEFycmF5KDEyOCk7XG4gICAgY29uc3QgYTQgPSA0NDA7XG4gICAgY29uc3QgcG9zYTQgPSA2OTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEyODsgaSsrKSB7XG4gICAgICBmcmVxdWVuY2llc1tpXSA9IGE0ICogTWF0aC5wb3coMiwgKChpIC0gcG9zYTQpIC8gMTIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZyZXF1ZW5jaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEgc3RyaW5nIG9mIHRoZSBmb3JtIGMzIG9yIGQjNCBhbmRcbiAgICogcmV0dXJucyB0aGUgY29ycmVzcG9uZGluZyBudW1iZXIuIFVwcGVyIGNsYXNzZXNcbiAgICogc3RyaW5ncyBhcmUgYWxsb3dlZCBhbmQgXCJoXCIgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gXCJiXCIuXG4gICAqIEBwYXJhbSAgdG9uZSBTdHJpbmcgcmVwcmVzZW50aW5nIGEgbm90ZVxuICAgKiBAcmV0dXJuICAgICAgTnVtYmVyIHJlcHJlc2VudGluZyBhIG5vdGVcbiAgICovXG4gIHByaXZhdGUgZ2V0Tm90ZU51bWJlcih0b25lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG5vdGVzID0gW1wiY1wiLCBcImMjXCIsIFwiZFwiLCBcImQjXCIsIFwiZVwiLCBcImZcIiwgXCJmI1wiLCBcImdcIiwgXCJnI1wiLCBcImFcIiwgXCJhI1wiLCBcImJcIl07XG4gICAgY29uc3Qgc3RyID0gdG9uZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKHN0ci5tYXRjaCgvXlthLWhdIz9bMC05XSQvKSkge1xuICAgICAgbGV0IG5vdGUgPSBzdHIuc3Vic3RyaW5nKDAsIHN0ci5sZW5ndGggLSAxKTtcbiAgICAgIGNvbnN0IG9jdCA9IHBhcnNlSW50KHN0ci5zbGljZSgtMSksIDEwKTtcblxuICAgICAgaWYgKG5vdGUgPT09IFwiaFwiKSB7XG4gICAgICAgIG5vdGUgPSBcImJcIjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBub3Rlcy5pbmRleE9mKG5vdGUpICsgKG9jdCArIDEpICogMTI7ICAvLyArMTogYmVjYXVzZSAxc3QgbWlkaSBvY3RhdmUgaXMgLTFcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW52YWxpZCBzdHJpbmcuIEhhcyB0byBiZSBsaWtlIFthLWhdPCM+WzAtOV1cIik7XG4gICAgfVxuICB9XG5cbn1cblxuLyoqXG4gKiBUZXN0cyBpZiBhbiBvYmplY3QgaXMgYSBwbGFpbiBqYXZhc2NyaXB0IG9iamVjdCAob2JqZWN0IGxpdGVyYWwpXG4gKiBhbmQgbm90IGEgY29uc3RydWN0b3IsIGluc3RhbmNlLCBudWxsIG9yIGFueXRoaW5nIGVsc2UuXG4gKiBhcyBzdWdnZXN0ZWQgYnkgUm9iRzpcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTg3NjMzMi9ob3ctY2FuLWktZGlmZmVyZW50aWF0ZS1iZXR3ZWVuLWFuLW9iamVjdC1saXRlcmFsLW90aGVyLWphdmFzY3JpcHQtb2JqZWN0c1xuICogQHBhcmFtICB7T2JqZWN0fSBvYmogQW55IGphdmFzY3JpcHQgb2JqZWN0XG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICBUcnVlIGlmIHBsYWluIGpzIG9iamVjdCwgZmFsc2UgaWYgbm90XG4gKi9cbi8vIEhlbHBlci5wcm90b3R5cGUuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuLy8gICBpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogIT09IG51bGwpIHtcbi8vICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbi8vICAgICByZXR1cm4gcHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUgfHwgcHJvdG8gPT09IG51bGw7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfTtcblxuLy8gbW9kdWxlLmV4cG9ydHMgPSBuZXcgSGVscGVyKCk7XG4iLCIvLyBpbnRlcm1peC5FdmVudEJ1cyA9IHJlcXVpcmUoJy4vRXZlbnRCdXMuanMnKTtcbi8vIGludGVybWl4LlNvdW5kV2F2ZSA9IHJlcXVpcmUoJy4vU291bmRXYXZlLmpzJyk7XG4vLyBpbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcbi8vIGludGVybWl4LlNlcXVlbmNlciA9IHJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJyk7XG4vLyBpbnRlcm1peC5QYXJ0ID0gcmVxdWlyZSgnLi9QYXJ0LmpzJyk7XG5cbi8vIGludGVybWl4LmhlbHBlciA9IHJlcXVpcmUoJy4vSGVscGVyLmpzJyk7XG4vLyBpbnRlcm1peC5ldmVudEJ1cyA9IG5ldyBpbnRlcm1peC5FdmVudEJ1cygpO1xuaW1wb3J0IEhlbHBlciBmcm9tIFwiLi9IZWxwZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW50ZXJtaXgge1xuXG4gICAgcHVibGljIGF1ZGlvQ29udGV4dDogQXVkaW9Db250ZXh0O1xuICAgIHB1YmxpYyBoZWxwZXI6IG9iamVjdDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHRoaXMuaGVscGVyID0gbmV3IEhlbHBlcigpO1xuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=