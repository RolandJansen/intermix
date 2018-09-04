//used in imported html scripts to get access to the dom
// const currentDocument = document.currentScript.ownerDocument;

/**
   * Cloning contents from a &lt;template&gt; element is more performant
   * than using innerHTML because it avoids addtional HTML parse costs.
   */
const template = document.createElement('template');
template.innerHTML = `
    <div class="imx__fader-container" id="imx__fader-container">
        <div class="imx__fader-background" id="imx__fader-background"></div>
        <div class="imx__fader-knob" id="imx__fader-knob"><hr></div>
    </div>
`;

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
        // const template = currentDocument.querySelector('#imx-fader-template');
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

        // element dimensions (computed by set height and set width)
        this.dim = {}

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
     * If a property is set before the element gets inserted
     * into DOM, it won't use its getter/setter. This method
     * checks and upgrades the property if necessary.
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
        const absolutePos = this.dim.knobRange - this.dim.knobRange*value + this.dim.knobHiPos;
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
        console.log('this is the value getter: ' + this.getAttribute('value'));
        return Number(this.getAttribute('value'));
    }
    
    /**
     * Setter for the useMidiValues property.
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
     * fader.useMidiValues ? fader.value = 64 : fader.value = 0.5;
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
        this.dim.bgWidth   = width/6;
        const bgLeft    = center - this.dim.bgWidth/2 - 2; //border is 2px
        this.dim.knobWidth = this.dim.bgWidth*4;
        const knobLeft  = center - this.dim.knobWidth/2;
        
        this.faderContainer.style.width = width;
        this.faderBackground.style.width = this.dim.bgWidth;
        this.faderBackground.style.left = bgLeft;
        this.faderKnob.style.width = this.dim.knobWidth;
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
        this.dim.center = height/2;  //for faders with center as 0, currently not in use
        this.dim.bgHeight = Math.round(height*0.8);
        this.dim.bgTop = (height - this.dim.bgHeight)/2;
        this.dim.knobHeight = Math.round(height*0.12);
        this.dim.knobHiPos = this.dim.bgTop - this.dim.knobHeight/2;
        this.dim.knobLowPos = this.dim.bgHeight + this.dim.bgTop - this.dim.knobHeight/2;
    
        this.faderContainer.style.height = height;
        this.faderBackground.style.height = this.dim.bgHeight;
        this.faderBackground.style.top = this.dim.bgTop;
        this.faderKnob.style.height = this.dim.knobHeight;
        this.faderKnob.style.top = this.dim.knobLowPos;
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
        evt.preventDefault();
        let y = evt.clientY;
        if (this.mouseDown) {
            let nextPos = this.faderKnob.offsetTop + evt.movementY;
            if (nextPos >= this.dim.knobHiPos && nextPos <= this.dim.knobLowPos) {
                this.faderKnob.style.top = nextPos + "px";
                const darkgrayRatio = nextPos - this.dim.bgTop + this.dim.knobHeight/2;
                const cyanRatio = 100 - darkgrayRatio;
                const gradient = 'linear-gradient(to bottom, darkgray, ' +
                    darkgrayRatio + 'px, cyan ' + darkgrayRatio + 'px, cyan ' +
                    this.dim.bgHeight + 'px)';
                this.faderBackground.style.background = gradient;
            } else if (nextPos < this.dim.knobHiPos) {
                this.faderKnob.style.top = this.dim.knobHiPos + "px";
                this.faderBackground.style.background = 'cyan';
                nextPos = this.dim.knobHiPos;
            } else {
                this.faderKnob.style.top = this.dim.knobLowPos + "px";
                this.faderBackground.style.background = 'darkgray';
                nextPos = this.dim.knobLowPos;
            }
            const yPos = nextPos - this.dim.knobHiPos;
            let val = (this.dim.knobRange - yPos)/this.dim.knobRange;
            this.useMidiValues ? val = Math.round(val*127) : false;
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