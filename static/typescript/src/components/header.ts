import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import * as React from 'react';
import { setRoute } from '../util';
import { AccountIcon } from './icons/account';
import { ReduxState } from '../redux_state_types';
import { ReduxAction } from '../redux_action_types';
import * as confirmationDialog from '../confirmation_dialog';
import { User } from '../user_types';
import { apiPost, apiGet } from '../api';

type Props = {
    user: User | null;
    route: string;
    loading: boolean;
    onNewJobTabClick: () => void;
    onJobsTabClick: () => void;
    onUsersTabClick: () => void;
    onMyAccountClick: () => void;
    onAboutClick: () => void;
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
        onMyAccountClick: () => setRoute(dispatch, '/my-account/'),
        onAboutClick: () => {
            apiGet('/api/get-versions/', {}, dispatch).then(resp => {
                confirmationDialog.open(
                    "About Mendel's Accountant",
                    [
                        'Mendel Web UI Version: ' + resp.mendelUiVersion,
                        'Mendel Go Version: ' + resp.mendelGoVersion,
                    ],
                );
            });
        },
        onLogoutClick: () => {
            apiPost(
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

class Component extends React.Component<Props, State> {
    menuButtonElement: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.menuButtonElement = React.createRef();

        this.state = {
            menuOpen: false,
        };

        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    onDocumentClick(e: MouseEvent) {
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
                    React.createElement('div', {
                        className: 'page-header__account-menu-item',
                        onClick: this.props.onMyAccountClick,
                    }, 'My Account'),
                    React.createElement('div', {
                        className: 'page-header__account-menu-item',
                        onClick: this.props.onAboutClick,
                    }, 'About'),
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
