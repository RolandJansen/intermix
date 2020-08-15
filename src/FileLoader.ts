/* eslint-disable prettier/prettier */
// some usefull links:
// https://www.html5rocks.com/en/tutorials/file/dndfiles/
// https://scotch.io/tutorials/use-the-html5-file-api-to-work-with-files-locally-in-the-browser
// https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
// in the last link see the section about object urls to load files without gui

// export default class FileLoader {
//     public loadPlugin(pluginSrcFile: Blob): void {
//         // not implemented yet
//     }

//     public loadAudio(audioFile: Blob): void {
//         // not implemented yet
//     }
// }

// baue eine funktion, die eine js oder ts datei via script-tag einbindet
// einmal mit promise und einmal mit callback

export function loadFiles(fileList: string[]): void {
    fileList.forEach((fileName: string) => {
        loadFile(fileName);
    });
}

function loadFile(fileName: string): void {
    if (hasSuffix(fileName, "js")) {
        loadScript(fileName);
    }
    if (hasSuffix(fileName, "css")) {
        loadCSS(fileName);
    }
}

function loadScript(scriptFile: string): void {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptFile;
    script.onload = () => {};
    script.onerror = () => {};

    const documentHead = document.getElementsByTagName("head")[0];
    documentHead.append(script);
}

// function loadDOM(htmlFile: string): HTMLElement {

// }

function loadCSS(cssFile: string): void {
    // HTMLLinkElement
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = cssFile;
    link.onload = () => {}; // do something when css is loaded
    link.onerror = () => {};

    // add css-link to document head element
    const documentHead = document.getElementsByTagName("head")[0];
    documentHead.append(link);
}

function loadImage(imgFile: string): void {

}

function hasSuffix(fileName: string, suffix: string): boolean {
    const fileSuffix = fileName.split(".").pop().toLowerCase();
    return suffix === fileSuffix;
}
