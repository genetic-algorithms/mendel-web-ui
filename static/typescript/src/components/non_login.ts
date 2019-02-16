import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import * as React from 'react';
import { Header } from './header';
import { Content } from './content';
import { ReduxState } from '../redux_state_types';
import { ReduxAction } from '../redux_action_types';
import { apiGet } from '../api';

/*
Renders the standard virtual page with header and content for every except the login page.
*/

type Props = {
    route: string;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    loaded: boolean;
};

function mapStateToProps(state: ReduxState) {
    return {
        route: state.route,
    };
}

class Component extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            loaded: false,
        };
    }

    componentDidMount() {
        apiGet('/api/get-current-user/', {}, this.props.dispatch).then(user => {
            this.props.dispatch({
                type: 'USER',
                value: user,
            });

            this.setState({
                loaded: true,
            });
        });
    }

    render() {
        return React.createElement('div', { className: 'non-login' + (!this.state.loaded ? ' non-login--loading' : '')},
            (this.state.loaded ?
                React.createElement(React.Fragment, null,
                    React.createElement('div', { className: 'page-header__spacer' }),
                    React.createElement(Header, null),
                    React.createElement(Content, null),
                ) : null
            ),
        );
    }
}

export const NonLogin = ReactRedux.connect(mapStateToProps)(Component);
