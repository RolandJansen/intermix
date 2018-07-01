//used in imported html scripts to get access to the dom
const currentDocument = document.currentScript.ownerDocument;

/**
 * A basic fader web component in pure html/css/js.
 * Please use the webcomponents.js polyfill (e.g. from cloudflare)
 * if it's not working natively in your app.
 * @class
 */
class ImxFader extends HTMLElement {
    
    static get observedAttributes() {
        return ['value'];
    }
    
    constructor() {
        super();
        
        // attach template to shadow root
        this.attachShadow({mode: 'open'});
        const template = currentDocument.querySelector('#imx-fader-template');
        const instance = template.content.cloneNode(true);
        this.shadowRoot.appendChild(instance);
        
        this.faderContainer = this.shadowRoot.getElementById('imx__fader-container');
        this.faderBackground = this.shadowRoot.getElementById('imx__fader-background');
        this.faderKnob = this.shadowRoot.getElementById('imx__fader-knob');
        
        // defaults
        this.settings = {
            min: 0.0,
            max: 1.0,
        }

        // element measures (computed by setHeight and setWidth)
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
        this.faderKnob.addEventListener("mousedown", this, false);
        document.addEventListener("mouseup", this, false);
        document.addEventListener("mousemove", this, false);

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
            this.width = 60;
        }
        if (this.hasAttribute('height')) {
            this.height = Number(this.getAttribute('height'));
        } else {
            this.height = 200;
        }

        // if properties have been set before DOM insertion,
        // upgrade them to use getter/setter.
        this._upgradeProperty('useMidiValues');
        this._upgradeProperty('value');
        this._upgradeProperty('width');
        this._upgradeProperty('height');
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
     * Currently not in use.
     * @callback attributeChangedCallback
     * @param {string} name Name of the changed attribute
     * @param {string} oldValue The current value of this attribute
     * @param {string} newValue The new value of this attribute
     */
    attributeChangedCallback(name, oldValue, newValue) {
        // if (oldValue !== null && oldValue !== newValue) {
        //     this.value = newValue;
        // }
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
    }
    
    /**
     * Setter for the value property. It checks if the value is inside
     * the currently used interval and throws an error if not. Use number values.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * fader.value = 0.5;
     */
    set value(value) {
        if (typeof value === 'number' &&
        value <= this.settings.max &&
        value >= this.settings.min) {
            this.setAttribute('value', value);
            this._setKnobPosition(value);
        } else {
            throw new Error('Value must be of type number between ' + this.settings.min + ' and ' + this.settings.max + '.');
        }
    }
    
    /**
     * Upgrades the fader knob so it represents its current
     * internal value.
     * @private
     * @param {number} value The current fader value.
     */
    _setKnobPosition(value) {
        this.useMidiValues ? value = value/127 : false;
        const absolutePos = this.graphics.knobRange - this.graphics.knobRange*value + this.graphics.knobHiPos;
        this.faderKnob.style.top = absolutePos + 'px';
    }

    /**
     * Getter for the value property. Returns a number.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * let currentFaderVal = fader.value;
     */
    get value() {
        return Number(this.getAttribute('value'));
    }
    
    /**
     * Setter for the useMidiValue property.
     * If true, use interval [0,127] instead of [0,1].
     * Use boolean values.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * fader.useMidiValues = true;
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
     * let fader = document.getElementById('my-fader');
     * let midiInterval = fader.useMidiValues;
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
     * let fader = document.getElementById('my-fader');
     * fader.width = 50;
     */
    set width(width) {
        const center    = width/2;
        this.graphics.bgWidth   = width/6;
        const bgLeft    = center - this.graphics.bgWidth/2 - 2; //border is 2px
        this.graphics.knobWidth = this.graphics.bgWidth*4;
        const knobLeft  = center - this.graphics.knobWidth/2;
        
        this.faderContainer.style.width = width;
        this.faderBackground.style.width = this.graphics.bgWidth;
        this.faderBackground.style.left = bgLeft;
        this.faderKnob.style.width = this.graphics.knobWidth;
        this.faderKnob.style.left = knobLeft;
        this.setAttribute('width', width);
    }
    
    /**
     * Getter for the width property.
     * Returns a number.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * let faderWidth = fader.width;
     */
    get width() {
        return Number(this.getAttribute('width'));
    }
    
    /**
     * Setter for the height property.
     * It computes all height based values and
     * upgrades the element accordingly. Use number values.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * fader.height = 100;
     */
    set height(height) {
        this.graphics.center = height/2;  //for faders with center as 0, currently not in use
        this.graphics.bgHeight = Math.round(height*0.8);
        this.graphics.bgTop = (height - this.graphics.bgHeight)/2;
        this.graphics.knobHeight = Math.round(height*0.12);
        this.graphics.knobHiPos = this.graphics.bgTop - this.graphics.knobHeight/2;
        this.graphics.knobLowPos = this.graphics.bgHeight + this.graphics.bgTop - this.graphics.knobHeight/2;
    
        this.faderContainer.style.height = height;
        this.faderBackground.style.height = this.graphics.bgHeight;
        this.faderBackground.style.top = this.graphics.bgTop;
        this.faderKnob.style.height = this.graphics.knobHeight;
        this.faderKnob.style.top = this.graphics.knobLowPos;
        this.setAttribute('height', height);
    }
    
    /**
     * Getter for the height property.
     * Returns a number.
     * @example
     * // Use it like a property:
     * let fader = document.getElementById('my-fader');
     * let faderHeight = fader.height;
     */
    get height() {
        return Number(this.getAttribute('height'));
    }

    /**
     * Event listeners are initialized with "this"
     * as handler. This means they call this.handleEvent
     * by default. This prevents a context change and keeps
     * the listeners removable (in contrast to "bind").
     * @callback ImxFader~handleEvent
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
        };
    }
    
    /**
     * Handler for the mousedown event.
     * @private
     */
    _handleMouseDown() {
        this.mouseDown = true;
    }
    
    /**
     * Handler for the mouseup event.
     * @private
     */
    _handleMouseUp() {
        this.mouseDown = false;
    }
    
    /**
     * Handler for the mousemove event.
     * @private
     * @param {event} evt The event object.
     */
    _handleMouseMove(evt) {
        evt.preventDefault();
        let y = evt.clientY;
        if (this.mouseDown) {
            let nextPos = this.faderKnob.offsetTop + evt.movementY;
            if (nextPos >= this.graphics.knobHiPos && nextPos <= this.graphics.knobLowPos) {
                this.faderKnob.style.top = nextPos + "px";
                const darkgrayRatio = nextPos - this.graphics.bgTop + this.graphics.knobHeight/2;
                const cyanRatio = 100 - darkgrayRatio;
                const gradient = 'linear-gradient(to bottom, darkgray, ' +
                    darkgrayRatio + 'px, cyan ' + darkgrayRatio + 'px, cyan ' +
                    this.graphics.bgHeight + 'px)';
                this.faderBackground.style.background = gradient;
            } else if (nextPos < this.graphics.knobHiPos) {
                this.faderKnob.style.top = this.graphics.knobHiPos + "px";
                this.faderBackground.style.background = 'cyan';
                nextPos = this.graphics.knobHiPos;
            } else {
                this.faderKnob.style.top = this.graphics.knobLowPos + "px";
                this.faderBackground.style.background = 'darkgray';
                nextPos = this.graphics.knobLowPos;
            }
            const yPos = nextPos - this.graphics.knobHiPos;
            let val = (this.graphics.knobRange - yPos)/this.graphics.knobRange;
            this.useMidiValues ? val = Math.round(val*127) : val;
            this._emitValue(val);
            this.setAttribute('value', val);
        }
    }

    /**
     * Emits a custom 'change' event that contains the current fader value
     * @private
     * @example
     * let fader = document.getElementById('my-fader');
     * fader.addEventListener("change", function(e) {
     *     console.log('Current fader value is: ' + e.detail.value);
     * }, false);
     * @param {number} value The current internal value of the fader
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
const ImxFaderUnmutable = Object.freeze(ImxFader);
customElements.define('imx-fader', ImxFaderUnmutable);