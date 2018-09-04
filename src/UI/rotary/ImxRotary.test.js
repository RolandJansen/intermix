const fs = require ('fs');
const { JSDOM } = require('jsdom-wc');
const { window } = new JSDOM(`<!DOCTYPE html>`, { runScripts: "dangerously" });
// JSDOM.fromFile('src/UI/rotary/ImxRotary.html', 'windows-1252').then(dom => {
//     console.log(dom.serialize());
// })

// const markup = fs.readFileSync('src/UI/rotary/ImxRotary.html');
// console.log(markup.toString('utf-8'));

Object.assign(global, {
    document: window.document,
    HTMLElement: window.HTMLElement,
    customElements: window.customElements,
    window,
});

// document.body.innerHTML = markup;

// class BoldComponent extends HTMLElement {
//     connectedCallback() {
//       this.innerHTML = `<b>${this.innerHTML}</b>`;
//     }
// }

// customElements.define('bold-component', BoldComponent);

// document.body.innerHTML = `<bold-component>What a time to be...</bold-component>`;

// test('rotary wc exists', () => {
//     const reg = customElements;
//     const el = reg.get('imx-rotary');
//     console.log(el);
//     expect(el).toBeDefined();
// })

test('just to have a test', () => {
    expect(true).toBeTruthy();
})