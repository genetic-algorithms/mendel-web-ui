import { assertNotNull } from './util';

let rootElement: HTMLElement | null = null;
let timeout = 0;

export function show(message: string) {
    if (rootElement === null) {
        rootElement = document.createElement('div');
        rootElement.className = 'snackbar';
        document.body.appendChild(rootElement);
    }

    clearTimeout(timeout);

    // Force layout so when we add the show class it will animate
    rootElement.offsetWidth;

    rootElement.textContent = message;
    rootElement.classList.add('snackbar--show');

    timeout = setTimeout(() => {
        assertNotNull(rootElement).classList.remove('snackbar--show');
    }, 5000);
}
