import { setRoute, fetchPostSmart } from '../util';
import { AccountIcon } from './icons/account';

function mapStateToProps(state) {
    return {
        user: state.user,
        route: state.route,
        loading: state.loading_indicator_count !== 0,
    };
}

function mapDispatchToProps(dispatch) {
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
                history.pushState(null, null, '/login/');
            });
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.menuButtonElement = React.createRef();

        this.state = {
            menuOpen: false,
        };

        this.onDocumentClick = e => {
            if (this.state.menuOpen) {
                this.setState({
                    menuOpen: false,
                });
            } else {
                if (this.menuButtonElement.current && this.menuButtonElement.current.contains(e.target)) {
                    this.setState({
                        menuOpen: true,
                    });
                }
            }
        };
    }

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
