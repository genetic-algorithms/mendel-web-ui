import { assertNotNull } from './util';

let rootElement: HTMLElement | null = null;

export function open(title: string, description: string, actionCallback: () => void) {
    if (rootElement !== null) {
        close();
    }

    const cancelButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Cancel')]);
    const actionButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Ok')]);
    const overlay = createElement('div', 'confirmation-dialog__overlay', []);

    rootElement = createElement('div', 'confirmation-dialog', [
        overlay,
        createElement('div', 'confirmation-dialog__content', [
            createElement('div', 'confirmation-dialog__title', [document.createTextNode(title)]),
            createElement('div', 'confirmation-dialog__description', [document.createTextNode(description)]),
            createElement('div', 'confirmation-dialog__buttons', [
                cancelButton,
                actionButton,
            ]),
        ]),
    ]);

    cancelButton.addEventListener('click', close);
    overlay.addEventListener('click', close);
    actionButton.addEventListener('click', () => {
        close();
        actionCallback();
    });

    document.body.appendChild(assertNotNull(rootElement));
}

export function close() {
    if (rootElement === null) return;
    assertNotNull(rootElement.parentNode).removeChild(rootElement);
    rootElement = null;
}

function createElement(tagName: string, className: string, children: Node[]) {
    const element = document.createElement(tagName);
    element.className = className;

    for (let i = 0; i < children.length; ++i) {
        element.appendChild(children[i]);
    }

    return element;
}