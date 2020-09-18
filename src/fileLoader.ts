/* eslint-disable prettier/prettier */
/**
 * A collection of functions useful for
 * loading files in the browser.
 * It also contains a function that
 * loads inline dedicated workers.
 */

import { getPluginClassNames } from ".";

type fn = () => void;

/**
 * Creates a dedicated worker from a function without the need
 * to put the worker code into an external file.
 * The worker will inherit the content-security-policy of the
 * script that spawns it.
 * @param fn A function that makes the body of the new worker.
 */
export const createInlineWorker = (fn: (e: MessageEvent) => void): Worker => {
    const blob = new Blob(["self.onmessage = ", fn.toString()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
};

/**
 * Loads an intermix plugin class from a file and returns the class name.
 * @param data An object that contains the binary content of a file.
 * @param onload A function that will be called after the script was executed
 * @param onerror A function that will be called if the execution of the script failed
 */
export function loadPlugin(data: Blob | File, onload: fn, onerror: fn): string {
    const pluginsBefore = getPluginClassNames();
    if (data.type === "text/javascript") {
        loadScript(data, onload, onerror);
    }
    const pluginsAfter = getPluginClassNames();
    const diff = pluginsAfter.filter((item) => !pluginsBefore.includes(item));
    return diff.toString();
}

function loadScript(data: Blob | File, onload: fn, onerror: fn): void {
    const url = URL.createObjectURL(data);
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = url;
    script.onload = onload;
    script.onerror = onerror;

    document.body.appendChild(script);
}

// function loadDOM(file: File): void {
//     // not yet implemented
//     if (file.type === "text/html" ||
//         file.type === "text/xml" ||
//         file.type === "application/xml" ||
//         file.type === "application/xhtml+xml" ||
//         file.type === "image/svg+xml") {
//             //load DOM, see DOMParser at MSN for details;
//     }
// }

// function loadCSS(file: File, onload: fn, onerror: fn): void {
//     // untested and experimental
//     if (file.type === "text/css") {
//         const url = URL.createObjectURL(file);
//         const link = document.createElement("link");

//         link.rel = "stylesheet";
//         link.type = "text/css";
//         link.href = url;
//         link.onload = onload;
//         link.onerror = onerror;

//         const documentHead = document.getElementsByTagName("head")[0];
//         documentHead.append(link);
//     }
// }

export function loadFileFromServer(url: string): Promise<ArrayBuffer> {
    return window.fetch(url)
        .then((response) => {
            if (response.ok) {
                return response.arrayBuffer();
            } else {
                throw new Error('Server error. Couldn\'t load file: ' + url);
            }
        });
};

// function hasSuffix(fileName: string, suffix: string): boolean {
//     const fileSuffix = fileName.split(".").pop().toLowerCase();
//     return suffix === fileSuffix;
// }
