import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import * as React from 'react';
import { setRoute } from '../util';
import { AccountIcon } from './icons/account';
import { ReduxState } from '../redux_state_types';
import { ReduxAction } from '../redux_action_types';
import { User } from '../user_types';
import { MsgDialog } from '../msg_dialog';
import { apiPost, apiGet } from '../api';

type Props = {
    user: User | null;
    route: string;
    loading: boolean;
    dispatch: Redux.Dispatch<ReduxAction>;
    onNewJobTabClick: () => void;
    onJobsTabClick: () => void;
    onUsersTabClick: () => void;
    onMyAccountClick: () => void;
    onLogoutClick: () => void;
};

// These state variables are used to control the visibility of the menu and dialog components, and to store info
// that should be passed to them.
type State = {
    menuOpen: boolean;
    aboutOpen: boolean;
    mendelUiVersion: string;
    mendelGoVersion: string;
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
        dispatch: dispatch,
        onNewJobTabClick: () => setRoute(dispatch, '/'),
        onJobsTabClick: () => setRoute(dispatch, '/job-listing/'),
        onUsersTabClick: () => setRoute(dispatch, '/user-listing/'),
        onMyAccountClick: () => setRoute(dispatch, '/my-account/'),
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
            aboutOpen: false,
            mendelUiVersion: "",
            mendelGoVersion: "",
        };

        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onAboutOpen = this.onAboutOpen.bind(this);
        this.onAboutClose = this.onAboutClose.bind(this);
    }

    onAboutOpen() {
        apiGet('/api/get-versions/', {}, this.props.dispatch).then(resp => {
            this.setState({
                aboutOpen: true,
                mendelUiVersion: resp.mendelUiVersion,
                mendelGoVersion: resp.mendelGoVersion,
            });
        });
    };

    onAboutClose() {
        this.setState({
            aboutOpen: false,
        });
    };

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
                        onClick: this.onAboutOpen,
                    }, 'About'),
                    React.createElement('div', {
                        className: 'page-header__account-menu-item',
                        onClick: this.props.onLogoutClick,
                    }, 'Logout'),
                ) :
                null
            ),
            (this.state.aboutOpen ?
                React.createElement(MsgDialog, {
                    title: "About Mendel's Accountant",
                    descriptions: [
                        "Mendel's Accountant is a genetic mutation tracking program used to simulate and study macroevolution in a biologically realistic way. It models genetic change over time by tracking each mutation that enters the simulated population from generation to generation to the end of the simulation. The software models each individual in the population, including their chromosomes, linkage blocks, and deleterious, favorable, and neutral mutations.",
                        'Mendel Web UI Version: ' + this.state.mendelUiVersion,
                        'Mendel Go Version: ' + this.state.mendelGoVersion,
                    ],
                    onClose: this.onAboutClose,
                })
                : null
            ),
        );
    }
}

export const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
