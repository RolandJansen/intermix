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
        
        // this.getShadowRootRefs(shadowRoot);

        // defaults
        this._settings = {
            min: 0.0,
            max: 1.0,
        }

        // style refs
        // knobRange: knobLowPos - knobHiPos
        this.containerStyle = window.getComputedStyle(this.faderContainer, null);
        console.log(this.containerStyle);
        this._style = {
            bgWidth: this.faderBackground.style.width,
            bgHeight: this.faderBackground.style.height,
            knobWidth: 40,
            knobHeight: 20,
            knobHiPos: 10,
            knobLowPos: 170,
            knobRange: 160
        }
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
        // upgrade them to use get/set methods.
        this._upgradeProperty('useMidiValues');
        this._upgradeProperty('value');
        this._upgradeProperty('width');
        this._upgradeProperty('height');
    }

    _upgradeProperty(prop) {
        if (this.hasOwnProperty(prop)) {
            let value = this[prop];
            delete this[prop];
            this[prop] = value;
        }
    }

    /**
     * This is called every time the 'value' attribute changes.
     * Notable detail: values are always strings (not numbers)
     * which should be taken into consideration in getter/setter.
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
    
    set value(value) {
        if (typeof value === 'number' &&
        value <= this._settings.max &&
        value >= this._settings.min) {
            this.setAttribute('value', value);
            this._setKnobPosition(value);
        } else {
            throw new Error('Value must be of type number between ' + this._settings.min + ' and ' + this._settings.max + '.');
        }
    }
    
    _setKnobPosition(value) {
        this.useMidiValues ? value = value/127 : false;
        const absolutePos = this._style.knobRange - this._style.knobRange*value + this._style.knobHiPos;
        this.faderKnob.style.top = absolutePos;
    }

    get value() {
        return Number(this.getAttribute('value'));
    }
    
    set useMidiValues(value) {
        const isChecked = Boolean(value);
        if (isChecked) {
            this._setMidiInterval();
            this.setAttribute('useMidiValues', '');
        } else {
            this.removeAttribute('useMidiValues');
        }
    }
    
    _setMidiInterval() {
        this._settings.min = 0;
        this._settings.max = 127;
        return true;
    }

    /**
     * if true, use interval [0,127] instead of [0,1]
     */
    get useMidiValues() {
        return this.hasAttribute('useMidiValues');
    }
    
    set width(width) {
        const stretch   = parseInt(this.faderContainer.style.width, 10);
        const center    = width/2;
        const bgWidth   = this._style.bgWidth*stretch;
        const bgLeft    = center - bgWidth/2;
        const knobWidth = this._style.knobWidth*stretch;
        const knobLeft  = center - knobWidth/2;
        
        this.faderContainer.style.width = width;
        this.faderBackground.style.width = bgWidth;
        this.faderBackground.style.left = bgLeft;
        this.faderKnob.style.width = knobWidth;
        this.faderKnob.style.left = knobLeft;
        this.setAttribute('width', width);
    }
    
    get width() {
        return Number(this.getAttribute('width'));
    }
    
    set height(height) {
        const stretch = height/this._style.height;
        const center = height/2;
        const bgHeight = this._style.bgHeight*stretch;
        const bgTop = center - bgHeight/2;
        const knobHeight = this._style.knobHeight*stretch;
        const knobTop = center - knobHeight/2;
        
        this.faderContainer.style.height = height;
        this.faderBackground.style.height = bgHeight;
        this.faderBackground.style.top = bgTop;
        this.faderKnob.style.height = knobHeight;
        this.faderKnob.style.top = knobTop;
        this.setAttribute('height', height);
    }
    
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
    
    _handleMouseDown() {
        this.faderKnob.style.backgroundColor = "red";
        this.mouseDown = true;
    }
    
    _handleMouseUp() {
        this.faderKnob.style.backgroundColor = "aqua";
        this.mouseDown = false;
    }
    
    _handleMouseMove(evt) {
        evt.preventDefault();
        let y = evt.clientY;
        if (this.mouseDown) {
            let nextPos = this.faderKnob.offsetTop + evt.movementY;
            if (nextPos >= this._style.knobHiPos && nextPos <= this._style.knobLowPos) {
                this.faderKnob.style.top = nextPos + "px";
            } else if (nextPos < this._style.knobHiPos) {
                this.faderKnob.style.top = this._style.knobHiPos + "px";
                nextPos = this._style.knobHiPos;
            } else {
                this.faderKnob.style.top = this._style.knobLowPos + "px";
                nextPos = this._style.knobLowPos;
            }
            const yPos = nextPos - this._style.knobHiPos;
            let val = (this._style.knobRange - yPos)/this._style.knobRange;
            this.useMidiValues ? val = Math.round(val*127) : val;
            this._emitValue(val);
            this.value = val;
        }
    }

    _emitValue(value) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: value,
            },
            bubbles: true,
        }));
    }

    _getNumberFromCSS(cssValue) {

    }
    
}
const ImxFaderUnmutable = Object.freeze(ImxFader);
customElements.define('imx-fader', ImxFaderUnmutable);