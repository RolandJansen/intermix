const fs = require ('fs');
// const { Script } = require("vm");
const { JSDOM } = require('jsdom-wc');
const { window } = new JSDOM(`<!DOCTYPE html>`);
// JSDOM.fromFile('src/UI/rotary/ImxRotary.html', 'windows-1252').then(dom => {
//     console.log(dom.serialize());
// })

const markup = fs.readFileSync('src/UI/fader/ImxFader.js');
// console.log(markup.toString('utf-8'));

// const s = new Script(markup);


Object.assign(global, {
    document: window.document,
    HTMLElement: window.HTMLElement,
    customElements: window.customElements,
    window,
});

require('./ImxFader.js');
// eval(markup);

// document.body.innerHTML = markup;

class BoldComponent extends HTMLElement {
    constructor() {
        this.ivalue = 5;

    }

    connectedCallback() {
      this.innerHTML = `<b>${this.innerHTML}</b>`;
    }

    get value() {
        return this.ivalue;
    }

    set value(val) {
        this.ivalue = val;
    }
}

customElements.define('bold-component', BoldComponent);

document.body.innerHTML = `<bold-component>What a time to be...</bold-component>`;

test('bold-component getter/setter', () => {
    let bc = document.querySelector('bold-component');
    // bc.value = 3;
    if (bc.hasOwnProperty('ivalue')) {
        console.log('value exists in bc');
    } else {
        console.log('value doesn\'t exist in bc:' + bc.value);
    }
})

test('fader wc exists', () => {
    const reg = customElements;
    const el = reg.get('imx-fader');
    // console.log(el);
    expect(el).toBeDefined();
})

test('fader has a value', () => {
    document.body.innerHTML = `<imx-fader id="fader" value="0.5"></imx-fader>`;
    let el = document.getElementById('fader');
    console.log(fader.getAttribute('value'));
    if (!el.hasOwnProperty('value')) {
        console.log('gut');
        console.log(el.value);
    }
    el.value = 0.3;
    if (el.hasOwnProperty('value')) {
        console.log('schlecht');
    }
    fader.addEventListener('change', (e) => {
        console.log('value is: ' + e.detail.value);
    })
    const val = el.value;
    console.log(val);
    // expect(val).toBe(0.3);
})

test('just to have a test', () => {
    expect(true).toBeTruthy();
})