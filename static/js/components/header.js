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
                value: '/jobs/',
            });
            history.pushState(null, null, '/jobs/');
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
                className: 'page-header__tab ' + (props.route === '/jobs/' ? 'page-header--active-tab' : ''),
                onClick: props.onJobsTabClick,
            }, 'Jobs'),
        ),
    );
}

export const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
