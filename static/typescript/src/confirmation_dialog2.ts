import * as React from 'react';

/* Show an dialog to confirm an action, with Cancel and Ok buttons
How to use this dialog from another Component:
- in that component add a boolean state variable for whether this dialog should be open or closed
- in the actions in that componet for opening and closing this dialog run setState() to change the above variable
- in render() of that component create this dialog component or not based on the state variable
- pass in 2 callbacks to run if the user clicks the cancel or ok buttons
*/

type Props = {
    title: string;
    descriptions: string[];
    onCancel: () => void;
    onOk: () => void;
};

export class ConfirmationDialog extends React.Component<Props> {
    render() {
        return React.createElement('div', { className: 'confirmation-dialog' },
            React.createElement('div', { className: 'confirmation-dialog__overlay', onClick: this.props.onCancel }),
            React.createElement('div', { className: 'confirmation-dialog__content' },
                React.createElement('div', { className: 'confirmation-dialog__title' }, this.props.title),
                this.props.descriptions.map(desc => React.createElement('div', { className: 'confirmation-dialog__description' }, desc) ),
                React.createElement('div', { className: 'confirmation-dialog__buttons' },
                    React.createElement('div',
                        { className: 'confirmation-dialog__button', onClick: this.props.onCancel },
                        'Close',
                    ),
                    React.createElement('div',
                        { className: 'confirmation-dialog__button', onClick: this.props.onOk },
                        'Ok',
                    ),
                ),
            ),
        );
    }
}
