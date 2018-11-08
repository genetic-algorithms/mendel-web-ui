import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import * as React from 'react';
import { fetchGetSmart } from '../util';
import { Header } from './header';
import { Content } from './content';
import { ReduxState } from '../redux_state_types';
import { ReduxAction } from '../redux_action_types';
import { UserWithId } from '../user_types';

type Props = {
    route: string;
    fetchCurrentUser: () => void;
};

function mapStateToProps(state: ReduxState) {
    return {
        route: state.route,
    };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        fetchCurrentUser: () => {
            fetchGetSmart(
                '/api/get-current-user/',
                dispatch,
            ).then((response: UserWithId) => {
                dispatch({
                    type: 'USER',
                    value: response,
                });
            });
        },
    };
}

class Component extends React.Component<Props> {
    componentDidMount() {
        this.props.fetchCurrentUser();
    }

    render() {
        return React.createElement('div', null,
            (this.props.route == '/login/' ? null : React.createElement('div', { className: 'page-header__spacer' })),
            (this.props.route == '/login/' ? null : React.createElement(Header, null)),
            React.createElement(Content, null),
        );
    }
}

export const Root = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
