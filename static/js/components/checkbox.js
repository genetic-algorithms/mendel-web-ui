import { CheckboxCheckedIcon } from './icons/checkbox_checked';
import { CheckboxUncheckedIcon } from './icons/checkbox_unchecked';

export class Checkbox extends React.PureComponent {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.props.onChange(!this.props.checked);
    }

    render() {
        return React.createElement('div',
            {
                className: 'checkbox ' + (this.props.checked ? 'checkbox--checked' : ''),
                onClick: this.onClick,
            },
            (this.props.checked ?
                React.createElement(CheckboxCheckedIcon, { width: 24, height: 24 }) :
                React.createElement(CheckboxUncheckedIcon, { width: 24, height: 24 })
            ),
        );
    }
}
