import { CheckboxCheckedIcon } from './icons/checkbox_checked';
import { CheckboxUncheckedIcon } from './icons/checkbox_unchecked';
import * as React from 'react';

type Props = {
    disabled?: boolean;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

export class Checkbox extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (!this.props.disabled) {
            this.props.onChange(!this.props.checked);
        }
    }

    render() {
        return React.createElement('div',
            {
                className: [
                    'checkbox',
                    this.props.checked ? 'checkbox--checked' : '',
                    this.props.disabled ? 'checkbox--disabled' : '',
                ].join(' '),
                onClick: this.onClick,
            },
            (this.props.checked ?
                React.createElement(CheckboxCheckedIcon, { width: 24, height: 24 }) :
                React.createElement(CheckboxUncheckedIcon, { width: 24, height: 24 })
            ),
        );
    }
}
