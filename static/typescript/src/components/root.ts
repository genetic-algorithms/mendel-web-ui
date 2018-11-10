import * as ReactRedux from 'react-redux';
import * as React from 'react';
import { ReduxState } from '../redux_state_types';
import { Login } from './views/login';
import { NonLogin } from './non_login';

type Props = {
    route: string;
};

function mapStateToProps(state: ReduxState) {
    return {
        route: state.route,
    };
}

class Component extends React.Component<Props> {
    render() {
        return React.createElement('div', null,
            (this.props.route === '/login/' ?
                React.createElement(Login, null) :
                React.createElement(NonLogin, null)
            )
        );
    }
}

export const Root = ReactRedux.connect(mapStateToProps)(Component);
