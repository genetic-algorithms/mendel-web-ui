function mapDispatchToProps(dispatch) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
        onClick: (userId) => {
            const url = '/edit-user/' + userId + '/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
        onCreateClick: () => {
            const url = '/create-user/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fetchController = new AbortController();

        this.state = {
            users: [],
        };
    }

    fetchUsers() {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        fetch('/api/user-list/', {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.onShowLogin();
                return;
            }

            response.json().then(responseJson => {
                this.setState({
                    users: responseJson.users,
                });
            });
        });
    }

    componentDidMount() {
        this.fetchUsers();
    }

    componentWillUnmount() {
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'user-listing-view' },
            React.createElement('div', { className: 'user-listing-view__title' }, 'Users'),
            React.createElement('div', {
                className: 'user-listing-view__create-button button',
                onClick: this.props.onCreateClick,
            }, 'Create User'),
            React.createElement('div', { className: 'user-listing-view__users' },
                React.createElement('div', { className: 'user-listing-view__labels' },
                    React.createElement('div', { className: 'user-listing-view__labels__username' }, 'Username'),
                    React.createElement('div', { className: 'user-listing-view__labels__admin' }, 'Admin'),
                ),

                this.state.users.map(user => (
                    React.createElement('div',
                        {
                            className: 'user-listing-view__user',
                            key: user.id,
                            onClick: () => this.props.onClick(user.id),
                        },
                        React.createElement('div', { className: 'user-listing-view__user__username' }, user.username),
                        React.createElement('div', { className: 'user-listing-view__user__admin' }, user.is_admin ? 'Admin' : ''),
                    )
                )),
            ),
        );
    }
}

export const UserListing = ReactRedux.connect(null, mapDispatchToProps)(Component);
