//used in imported html scripts to get access to the dom
const currentDocument = document.currentScript.ownerDocument;

/**
 * A basic fader web component in pure html/css/js.
 * Please use the webcomponents.js polyfill (e.g. from cloudflare)
 * if it's not working natively in your app.
 * @class
 */
class ImxFader extends HTMLElement {
    
    constructor() {
        super();
        
        this.faderContainer;
        this.faderBackground;
        this.faderKnob;

        // defaults
        this.settings = {
            min: 0.0,
            max: 1.0,
            step: 0.1,
            value: 0.0,
        }

        // style defaults
        // knobRange: knobLowPos - knobHiPos
        this.style = {
            width: 60,
            height: 200,
            bgWidth: 10,
            bgHeight: 160,
            knobWidth: 40,
            knobHeight: 20,
            knobHiPos: 10,
            knobLowPos: 170,
            knobRange: 160
        }

        // event flags
        this.mouseDown = false;
    }

    static get observedAttributes() {
        return ['value'];
    }

    /**
     * When the element gets inserted into DOM
     * it initializes shadow DOM, adds event listeners
     * and reads out its html attributes.
     * @callback connectedCallback
     */
    connectedCallback() {
        // attach template to shadow root
        const shadowRoot = this.attachShadow({mode: 'open'});
        const template = currentDocument.querySelector('#imx-fader-template');
        const instance = template.content.cloneNode(true);
        shadowRoot.appendChild(instance);

        this.getShadowRootRefs(shadowRoot);
    
        // add event listener
        this.faderKnob.addEventListener("mousedown", this, false);
        document.addEventListener("mouseup", this, false);
        document.addEventListener("mousemove", this, false);

        // read html attributes
        this.getAttribute('min') !== null ? this.min = Number(this.getAttribute('min')) : true;
        this.getAttribute('max') !== null ? this.max = Number(this.getAttribute('max')) : true;
        this.getAttribute('step') !== null ? this.step = Number(this.getAttribute('step')) : true;
        this.getAttribute('value') !== null ? this.value = Number(this.getAttribute('value')) : true;
        this.getAttribute('width') !== null ? this.width = Number(this.getAttribute('width')) : true;
        this.getAttribute('height') !== null ? this.height = Number(this.getAttribute('height')) : true;
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
    
    /**
     * Event listeners are initialized with "this"
     * as handler. This means they call this.handleEvent
     * as default. This prevents a context change and keeps
     * the listeners removable (in contrast to "bind").
     * @callback ImxFader~handleEvent
     * @param {event} evt The event object
     * @returns {void}
     */
    handleEvent(evt) {
        switch(evt.type) {
            case 'mousedown':
            this.handleMouseDown();
            break;
            case 'mouseup':
            this.handleMouseUp();
            break;
            case 'mousemove':
            this.handleMouseMove(evt);
            break;
        };
    }
    
    handleMouseDown() {
        this.faderKnob.style.backgroundColor = "red";
        this.mouseDown = true;
    }
    
    handleMouseUp() {
        this.faderKnob.style.backgroundColor = "aqua";
        this.mouseDown = false;
    }
    
    handleMouseMove(evt) {
        evt.preventDefault();
        let y = evt.clientY;
        if (this.mouseDown) {
            let nextPos = this.faderKnob.offsetTop + evt.movementY;
            if (nextPos >= this.knobHiPos && nextPos <= this.knobLowPos) {
                this.faderKnob.style.top = nextPos + "px";
            } else if (nextPos < this.knobHiPos) {
                this.faderKnob.style.top = this.knobHiPos + "px";
                nextPos = this.knobHiPos;
            } else {
                this.faderKnob.style.top = this.knobLowPos + "px";
                nextPos = this.knobLowPos;
            }
            const yPos = nextPos - this.knobHiPos;
            const val = (this.knobRange - yPos)/this.knobRange;
            this.setAttribute('value', val);
        }
    }

    setKnobPosition(value) {
        const absolutePos = this.knobRange - this.knobRange*value + this.knobHiPos;
        this.faderKnob.style.pos = absolutePos;
    }
    
    getShadowRootRefs(shadowRoot) {
        this.faderContainer = shadowRoot.getElementById('imx__fader-container');
        this.faderBackground = shadowRoot.getElementById('imx__fader-background');
        this.faderKnob = shadowRoot.getElementById('imx__fader-knob');
    }
    
    get min() {
        return this.settings.min;
    }

    set min(value) {
        if (typeof value === 'number') {
            this.settings.min = value;
        }
    }

    get max() {
        return this.settings.max;
    }

    set max(value) {
        if (typeof value === 'number') {
            this.settings.max = value;
        }
    }

    get value() {
        return this.getAttribute('value');
    }

    set value(value) {
        // debugger;
        if (typeof value === 'number' &&
            value <= this.max &&
            value >= this.min) {
            this.settings.value = value;
        } else {
            throw new Error('Value must be a number between ' + this.min + ' and ' + this.max + '.');
        }
    }

    get width() {
        return this.style.width;
    }

    set width(width) {
        const stretch   = width/this.faderWidth;
        const center    = width/2;
        const bgWidth   = this.bgWidth*stretch;
        const bgLeft    = center - bgWidth/2;
        const knobWidth = this.knobWidth*stretch;
        const knobLeft  = center - knobWidth/2;
        
        this.faderContainer.style.width = width;
        this.faderBackground.style.width = bgWidth;
        this.faderBackground.style.left = bgLeft;
        this.faderKnob.style.width = knobWidth;
        this.faderKnob.style.left = knobLeft;
        this.style.width = width;
    }

    get height() {
        return this.style.height;
    }

    set height(height) {
        const stretch = height/this.faderHeight;
        const center = height/2;
        const bgHeight = this.bgHeight*stretch;
        const bgTop = center - bgHeight/2;
        const knobHeight = this.knobHeight*stretch;
        const knobTop = center - knobHeight/2;

        this.faderContainer.style.height = height;
        this.faderBackground.style.height = bgHeight;
        this.faderBackground.style.top = bgTop;
        this.faderKnob.style.height = knobHeight;
        this.faderKnob.style.top = knobTop;
        this.style.height = height;
    }

}
const ImxFaderUnmutable = Object.freeze(ImxFader);
customElements.define('imx-fader', ImxFaderUnmutable);