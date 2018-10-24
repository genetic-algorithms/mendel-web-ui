function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.onNewJobTabClick = () => this.props.setRoute('/');
        this.onJobsTabClick = () => this.props.setRoute('/job-listing/');
        this.onUsersTabClick = () => this.props.setRoute('/user-listing/');
    }

    render() {
        return React.createElement('div', { className: 'page-header' },
            React.createElement('div', { className: 'page-header__tabs' },
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/' ? 'page-header--active-tab' : ''),
                    onClick: this.onNewJobTabClick,
                }, 'New Job'),
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/job-listing/' ? 'page-header--active-tab' : ''),
                    onClick: this.onJobsTabClick,
                }, 'Jobs'),
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                    onClick: this.onUsersTabClick,
                }, 'Users'),
            ),
            (this.props.loading ?
                React.createElement('div', { className: 'page-header__loading-indicator' }) :
                null
            ),
        );
    }
}

export const Header = ReactRedux.connect(mapStateToProps, null)(Component);
