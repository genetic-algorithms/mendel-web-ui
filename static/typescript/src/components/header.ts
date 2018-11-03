import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import * as React from 'react';
import { setRoute, fetchPostSmart } from '../util';
import { AccountIcon } from './icons/account';
import { ReduxState } from '../redux_state_types';
import { ReduxAction } from '../redux_action_types';
import { User } from '../user_types';

type Props = {
    user: User | null;
    route: string;
    loading: boolean;
    onNewJobTabClick: () => void;
    onJobsTabClick: () => void;
    onUsersTabClick: () => void;
    onLogoutClick: () => void;
};

type State = {
    menuOpen: boolean;
};

function mapStateToProps(state: ReduxState) {
    return {
        user: state.user,
        route: state.route,
        loading: state.loading_indicator_count !== 0,
    };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        onNewJobTabClick: () => setRoute(dispatch, '/'),
        onJobsTabClick: () => setRoute(dispatch, '/job-listing/'),
        onUsersTabClick: () => setRoute(dispatch, '/user-listing/'),
        onLogoutClick: () => {
            fetchPostSmart(
                '/api/logout/',
                {},
                dispatch,
            ).then(() => {
                dispatch({
                    type: 'LOGOUT',
                });
                history.pushState(null, '', '/login/');
            });
        },
    };
}

export class Component extends React.Component<Props, State> {
    menuButtonElement: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.menuButtonElement = React.createRef();

        this.state = {
            menuOpen: false,
        };

        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    onDocumentClick(e: Event) {
        if (this.state.menuOpen) {
            this.setState({
                menuOpen: false,
            });
        } else {
            const target = e.target as HTMLElement;

            if (this.menuButtonElement.current && this.menuButtonElement.current.contains(target)) {
                this.setState({
                    menuOpen: true,
                });
            }
        }
    };

    componentDidMount() {
        document.addEventListener('click', this.onDocumentClick);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onDocumentClick);
    }

    render() {
        return React.createElement('div', { className: 'page-header' },
            React.createElement('div', { className: 'page-header__tabs' },
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/' ? 'page-header--active-tab' : ''),
                    onClick: this.props.onNewJobTabClick,
                }, 'New Job'),
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/job-listing/' ? 'page-header--active-tab' : ''),
                    onClick: this.props.onJobsTabClick,
                }, 'Jobs'),
                (this.props.user && this.props.user.is_admin ?
                    React.createElement('div', {
                        className: 'page-header__tab ' + (this.props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                        onClick: this.props.onUsersTabClick,
                    }, 'Users') :
                    null
                ),
            ),
            (this.props.loading ?
                React.createElement('div', { className: 'page-header__loading-indicator' }) :
                null
            ),
            (this.props.user ?
                React.createElement('div',
                    {
                        className: 'page-header__account-menu-button',
                        ref: this.menuButtonElement,
                    },
                    React.createElement(AccountIcon, { width: 24, height: 24 }),
                ) :
                null
            ),
            (this.props.user ?
                React.createElement('div',
                    {
                        className: 'page-header__account-menu ' + (this.state.menuOpen ? 'page-header--account-menu-open' : '' ),
                    },
                    React.createElement('div', { className: 'page-header__account-menu-item' }, 'My Account'),
                    React.createElement('div', {
                        className: 'page-header__account-menu-item',
                        onClick: this.props.onLogoutClick,
                    }, 'Logout'),
                ) :
                null
            ),
        );
    }
}

export const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
