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
            innerCircle: this.shadowRoot.getElementById('imx__rotary-inner-circle'),
            leftDelimiter = this.shadowRoot.getElementById('imx__rotary-left-delimiter'),
            rightDelimiter = this.shadowRoot.getElementById('imx__rotary-right-delimiter'),
            needle = this.shadowRoot.getElementById('imx__rotary-needle'),
        }
        
        // defaults
        this.settings = {
            min: 0.0,
            max: 1.0,
        }

        // element measures (computed by set width)
        this.graphics = {}
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
        this.rt.outerCircle.addEventListener('mouseup', this, false);
        this.rt.outerCircle.addEventListener('mousemove', this, false);
        this.rt.outerCircle.addEventListener('wheel', this, false);

        // process attributes or add them if needed
        if (this.hasAttribute('useMidiValues')) {
            this.useMidiValues = true;
        }
        if (this.hasAttribute('value')) {
            this.value = Number(this.getAttribute('value'));
        } else {
            this.value = 0;
        }
        if (this.hasAttribute('width')) {
            this.width = Number(this.getAttribute('width'));
        } else {
            this.width = 160;
        }

        // if properties have been set before DOM insertion,
        // upgrade them to use getter/setter.
        this._upgradeProperty('useMidiValues');
        this._upgradeProperty('value');
        this._upgradeProperty('width');
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
            throw new Error('Value must be of type number between ' + this.settings.min + ' and ' + this.settings.max + '.');
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
     * Setter for the width property.
     * It computes all width based values and
     * upgrades the element accordingly. Use number values.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * rotary.width = 50;
     */
    set width(width) {
        this.setAttribute('width', width);
    }

    /**
     * Getter for the width property.
     * Returns a number.
     * @example
     * // Use it like a property:
     * let rotary = document.getElementById('my-rotary');
     * let rotaryWidth = rotary.width;
     */
    get width() {
        return Number(this.getAttribute('width'));
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