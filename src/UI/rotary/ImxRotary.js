//used in imported html scripts to get access to the dom
const currentDocument = document.currentScript.ownerDocument;

/**
 * A basic rotary web component in pure html/css/js.
 * Please use the webcomponents.js polyfill (e.g. from cloudflare)
 * if it's not working natively in your app.
 * @class
 */
class ImxRotary extends HTMLElement {

    constructor() {
        super();

        // attach template to shadow root
        this.attachShadow({mode: 'open'});
        const template = currentDocument.querySelector('#imx__rotary-template');
        const instance = template.content.cloneNode(true);
        this.shadowRoot.appendChild(instance);

        // refs to shadowed html elements
        this.rt = {
            outerCircle: this.shadowRoot.getElementById('imx__rotary-outer-circle'),
            middleCircle: this.shadowRoot.getElementById('imx__rotary-middle-circle'),
            innerCircle: this.shadowRoot.getElementById('imx__rotary-inner-circle'),
            maskLowerLeft: this.shadowRoot.getElementById('imx__rotary-mask-lower-left'),
            maskUpperLeft: this.shadowRoot.getElementById('imx__rotary-mask-upper-left'),
            maskRight: this.shadowRoot.getElementById('imx__rotary-mask-right'),
            needle: this.shadowRoot.getElementById('imx__rotary-needle'),
        };

        // rotate masks to default positions
        this.rt.maskLowerLeft.style.transform = 'rotate(135deg)';
        this.rt.maskUpperLeft.style.transform = 'rotate(225deg)';
        this.rt.maskRight.style.transform = 'rotate(315deg)';

        // keep track of mask visibility
        this.masks = {
            lowerLeftVisible: true,
            upperLeftVisible: true,
            rightVisible: true,
        }
        
        // defaults
        this.settings = {
            min: 0.0,
            max: 1.0,
            minDeg: 135,
            maxDeg: 405,
            rangeDeg: 270,
        };
        
        // element dimensions (computed by 'set width()')
        this.dim = {};

        this.mouseDown = false;
    }

    /**
     * When the element gets inserted into DOM
     * it initializes shadow DOM, adds event listeners
     * and reads out its html attributes.
     * @callback connectedCallback
     */
    connectedCallback() {
        // add event listener
        this.rt.outerCircle.addEventListener('mousedown', this, false);
        document.addEventListener('mouseup', this, false);
        document.addEventListener('mousemove', this, false);
        document.addEventListener('wheel', this, false);

        // process attributes or add them if needed
        if (this.hasAttribute('useMidiValues')) {
            this.useMidiValues = true;
        }
        if (this.hasAttribute('value')) {
            this.value = Number(this.getAttribute('value'));
        } else {
            this.value = 0;
        }
        if (this.hasAttribute('diameter')) {
            this.diameter = Number(this.getAttribute('diameter'));
        } else {
            this.diameter = 160;
        }

        // if properties have been set before DOM insertion,
        // upgrade them to use getter/setter.
        this._upgradeProperty('useMidiValues');
        this._upgradeProperty('value');
        this._upgradeProperty('diameter');
    }

    /**
     * If a property was set before the element get got inserted
     * into DOM, they won't use their getter/setter. This method
     * checks and upgrades them if necessary.
     * @private
     * @param {any} prop A property to be upgraded
     */
    _upgradeProperty(prop) {
        if (this.hasOwnProperty(prop)) {
            let value = this[prop];
            delete this[prop];
            this[prop] = value;
        }
    }

    /**
     * When the element gets removed from DOM it
     * removes all event listeners.
     * @callback disconnectedCallback
     */
    disconnectedCallback() {
        this.removeEventListener('mousedown');
        this.removeEventListener('mouseup');
        this.removeEventListener('mousemove');
        this.removeEventListener('wheel');
    }
    
    /**
     * Getter for the value property. Returns a number.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * let currentRotaryVal = rotary.value;
     */
    get value() {
        return Number(this.getAttribute('value'));
    }

    /**
     * Setter for the value property. It checks if the value is inside
     * the currently used interval and throws an error if not. Use number values.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * rotary.value = 0.5;
     */
    set value(value) {
        if (typeof value === 'number' &&
        value <= this.settings.max &&
        value >= this.settings.min) {
            this.setAttribute('value', value);
            this._setNeedlePosition(value);
        } else {
            throw new Error(`Value must be of type number between ${this.settings.min} and ${this.settings.max}.`);
        }
    }

    /**
     * Getter for the useMidiValues property.
     * Returns a boolean.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * rotary.useMidiValues ? rotary.value = 64 : rotary.value = 0.5;
     */
    get useMidiValues() {
        return this.hasAttribute('useMidiValues');
    }

    /**
     * Setter for the useMidiValues property.
     * If true, use interval [0,127] instead of [0,1].
     * Use boolean values.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * rotary.useMidiValues = true;
     */
    set useMidiValues(value) {
        const isChecked = Boolean(value);
        if (isChecked) {
            this._setMidiInterval();
            this.setAttribute('useMidiValues', '');
        } else {
            this.removeAttribute('useMidiValues');
        }
    }
    
    /**
     * Upgrades internal settings to use values within [0, 127].
     * @private
     */
    _setMidiInterval() {
        this.settings.min = 0;
        this.settings.max = 127;
        return true;
    }
    
    /**
     * Getter for the diameter property.
     * Returns a number.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * let rotaryWidth = rotary.diameter;
     */
    get diameter() {
        return Number(this.getAttribute('diameter'));
    }
    
    /**
     * Setter for the diameter property.
     * It computes all dimension based properties and
     * upgrades the element accordingly. Use number values.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * rotary.diameter = 50;
     */
    set diameter(value) {
        this.dim.center = {
            x: value/2,
            y: value/2,
        }
        this.rt.outerCircle.style.width = value;
        this.rt.outerCircle.style.height = value;
        this.setAttribute('diameter', value);
    }

    /**
     * Event listeners are initialized with "this"
     * as handler. This means they call this.handleEvent
     * by default. This prevents a context change and keeps
     * the listeners removable (in contrast to "bind").
     * @callback ImxRotary~handleEvent
     * @param {event} evt The event object
     * @returns {void}
     */
    handleEvent(evt) {
        switch(evt.type) {
            case 'mousedown':
            this._handleMouseDown();
            break;
            case 'mouseup':
            this._handleMouseUp();
            break;
            case 'mousemove':
            this._handleMouseMove(evt);
            break;
            case 'wheel':
            this._handleMouseWheel(evt);
        };
    }
    
    /**
     * Event handler for the mousedown event.
     * @private
     */
    _handleMouseDown() {
        this.mouseDown = true;
    }

    /**
     * Event handler for the mouseup event.
     * @private
     */
    _handleMouseUp() {
        this.mouseDown = false;
    }

    /**
     * Event handler for the mousemove event.
     * @private
     * @param {event} evt The event object.
     */
    _handleMouseMove(evt) {
        if (this.mouseDown) {
            evt.preventDefault();
            let val = this.value;
            let maxVal = 1;
            if (this.useMidiValues) {
                val -= evt.movementY;
                maxVal = 127;
            } else {
                val -= evt.movementY/127;
            }
            val < 0 ? val = 0 : true;
            val > maxVal ? val = maxVal : true;
            this._setNeedlePosition(val);
            this.value = val;
            this._emitValue(val);
        }
    }
    
    /**
     * Event handler for the wheel event.
     * @todo Compare with _handleMouseMove, great intersection
     * @param {event} evt 
     */
    _handleMouseWheel(evt) {
        if (this.mouseDown) {
            evt.preventDefault();
            let val = this.value;
            let maxVal = 1;
            if (this.useMidiValues) {
                val -= evt.movementY/2;
                maxVal = 127;
            } else {
                val -= evt.movementY/127;
            }
            val < 0 ? val = 0 : true;
            val > maxVal ? val = maxVal : true;
            this._setNeedlePosition(val);
            this.value = val;
            this._emitValue(val);
        }
    }
    
    /**
     * Upgrades the rotary needle so it represents its current
     * internal value.
     * @private
     * @param {number} value The current rotary value.
     */
    _setNeedlePosition(value) {
        this.useMidiValues ? value = value/127 : false;
        const deg = value*this.settings.rangeDeg + this.settings.minDeg;
        this.rt.needle.style.transform = `rotate(${deg}deg)`;
        this._updateMasks(deg);
    }

    _updateMasks(deg) {
        this.rt.maskLowerLeft.style.transform = `rotate(${deg}deg)`;
        if (deg < 225 && !this.masks.upperLeftVisible) {
            this.rt.maskUpperLeft.style.visibility = 'visible';
            this.masks.upperLeftVisible = true;
        }
        if (deg >= 225 && this.masks.upperLeftVisible) {
            this.rt.maskUpperLeft.style.visibility = 'hidden';
            this.masks.upperLeftVisible = false;
        }
        if (deg < 315 && !this.masks.rightVisible) {
            this.rt.maskRight.style.visibility = 'visible';
            this.masks.rightVisible = true;
        }
        if (deg >= 315 && this.masks.rightVisible) {
            this.rt.maskRight.style.visibility = 'hidden';
            this.masks.rightVisible = false;
        }
    }

    /**
     * Emits a custom 'change' event that contains the current rotary value
     * @private
     * @example
     * let rotary = document.getElementById('my-rotary');
     * rotary.addEventListener("change", function(e) {
     *     console.log('Current rotary value is: ' + e.detail.value);
     * }, false);
     * @param {number} value The current internal value of the rotary
     */
    _emitValue(value) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: value,
            },
            bubbles: true,
        }));
    }
}
const ImxRotaryUnmutable = Object.freeze(ImxRotary);
customElements.define('imx-rotary', ImxRotaryUnmutable);