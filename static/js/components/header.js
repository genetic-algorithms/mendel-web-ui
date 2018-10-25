import { setRoute } from '../util';

function mapStateToProps(state) {
    return {
        route: state.route,
        loading: state.loading_indicator_count !== 0,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onNewJobTabClick: () => setRoute(dispatch, '/'),
        onJobsTabClick: () => setRoute(dispatch, '/job-listing/'),
        onUsersTabClick: () => setRoute(dispatch, '/user-listing/'),
    };
}

export class Component extends React.Component {
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
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                    onClick: this.props.onUsersTabClick,
                }, 'Users'),
            ),
            (this.props.loading ?
                React.createElement('div', { className: 'page-header__loading-indicator' }) :
                null
            ),
        );
    }
}

export const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
