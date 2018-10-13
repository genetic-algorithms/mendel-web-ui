function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onNewJobTabClick: () => {
            dispatch({
                type: 'ROUTE',
                value: '/',
            });
            history.pushState(null, null, '/');
        },
        onJobsTabClick: () => {
            dispatch({
                type: 'ROUTE',
                value: '/job-listing/',
            });
            history.pushState(null, null, '/job-listing/');
        },
        onUsersTabClick: () => {
            dispatch({
                type: 'ROUTE',
                value: '/user-listing/',
            });
            history.pushState(null, null, '/user-listing/');
        },
    };
}

function Component(props) {
    return React.createElement('div', { className: 'page-header' },
        React.createElement('div', { className: 'page-header__tabs' },
            React.createElement('div', {
                className: 'page-header__tab ' + (props.route === '/' ? 'page-header--active-tab' : ''),
                onClick: props.onNewJobTabClick,
            }, 'New Job'),
            React.createElement('div', {
                className: 'page-header__tab ' + (props.route === '/job-listing/' ? 'page-header--active-tab' : ''),
                onClick: props.onJobsTabClick,
            }, 'Jobs'),
            React.createElement('div', {
                className: 'page-header__tab ' + (props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                onClick: props.onUsersTabClick,
            }, 'Users'),
        ),
    );
}

export const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
