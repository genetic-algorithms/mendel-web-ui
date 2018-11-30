import * as React from 'react';
import { HelpIcon } from '../../icons/help';
import { assertNotNull } from '../../../util';

type Props = {
    title: string;
    content: string;
    url?: string;
};

type State = {
    open: boolean;
};

export class Help extends React.PureComponent<Props, State> {
    buttonRef: React.RefObject<HTMLElement>;
    menuRef: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.buttonRef = React.createRef();
        this.menuRef = React.createRef();

        this.state = {
            open: false,
        };

        this.onButtonClick = this.onButtonClick.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    onButtonClick(e: MouseEvent) {
        this.setState(prevState => ({
            open: !prevState.open,
        }));
    }

    onDocumentClick(e: MouseEvent) {
        const target = e.target as HTMLElement;

        if (
            this.state.open &&
            !assertNotNull(this.buttonRef.current).contains(target) &&
            !assertNotNull(this.menuRef.current).contains(target)
        ) {
            this.setState({
                open: false,
            });
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.onDocumentClick);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onDocumentClick);
    }

    render() {
        return React.createElement('div', { className: 'new-job-view__help' },
            React.createElement('div', { className: 'new-job-view__help-button', ref: this.buttonRef, onClick: this.onButtonClick },
                React.createElement(HelpIcon, { width: 24, height: 24 }),
            ),
            (this.state.open ?
                React.createElement('div', { className: 'new-job-view__help-menu', ref: this.menuRef },
                    React.createElement('div', { className: 'new-job-view__help-menu-title' }, this.props.title),
                    React.createElement('div', { className: 'new-job-view__help-menu-content' }, this.props.content),
                    (this.props.url ?
                        React.createElement('a', { className: 'new-job-view__help-menu-link', href: this.props.url, target: '_blank' }, 'Read More') :
                        null
                    ),
                ) :
                null
            ),
        );
    }
}
