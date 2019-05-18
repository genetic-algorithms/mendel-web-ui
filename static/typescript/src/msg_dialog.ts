import * as React from 'react';

/* Show an info or error msg dialog, with Close button
How to use this dialog from another Component:
- in that component add a boolean state variable for whether this dialog should be open or closed
- in the actions in that componet for opening and closing this dialog run setState() to change the above variable
- in render() of that component create this dialog component or not based on the state variable
- pass in a callback to run when the user clicks the close button
*/

type Props = {
    title: string;
    descriptions: string[];
    onClose: () => void;
};

export class MsgDialog extends React.Component<Props> {
    render() {
        return React.createElement('div', { className: 'msg-dialog' },
            React.createElement('div', { className: 'msg-dialog__overlay', onClick: this.props.onClose }),
            React.createElement('div', { className: 'msg-dialog__content' },
                React.createElement('div', { className: 'msg-dialog__title' }, this.props.title),
                this.props.descriptions.map(desc => React.createElement('div', { className: 'msg-dialog__description' }, desc) ),
                React.createElement('div', { className: 'msg-dialog__buttons' },
                    React.createElement('div',
                        { className: 'msg-dialog__button', onClick: this.props.onClose },
                        'Close',
                    ),
                ),
            ),
        );
    }
}
