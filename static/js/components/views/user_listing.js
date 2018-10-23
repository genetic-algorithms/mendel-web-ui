import { DeleteIcon } from '../icons/delete';
import * as confirmationDialog from '../../confirmation_dialog';

function mapDispatchToProps(dispatch) {
    return {
        setRoute: url => {
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

class ApiPost {
    constructor(url, setRoute, setInProgress) {
        this.url = url;
        this.setRoute = setRoute;
        this.setInProgress = setInProgress;
        this.abortController = new AbortController();
    }

    fetch(body, callback) {
        this.abortController.abort();
        this.abortController = new AbortController();

        this.setInProgress(true);

        fetch(this.url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            signal: this.abortController.signal,
        }).then(response => {
            this.setInProgress(false);

            if (response.status === 401) {
                this.setRoute('/login/');
                return;
            }

            callback(response);
        }).catch(err => {
            this.setInProgress(false);
        });
    }

    abort() {
        this.abortController.abort();
    }
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fetchUsersController = new AbortController();
        this.fetchDeleteUserController = new AbortController();

        this.state = {
            users: [],
        };
    }

    fetchUsers() {
        this.fetchUsersController.abort();
        this.fetchUsersController = new AbortController();

        fetch('/api/user-list/', {
            credentials: 'same-origin',
            signal: this.fetchUsersController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.setRoute('/login/');
                return;
            }

            response.json().then(responseJson => {
                this.setState({
                    users: responseJson.users,
                });
            });
        });
    }

    fetchDeleteUser(userId) {
        this.fetchDeleteUserController.abort();
        this.fetchDeleteUserController = new AbortController();

        fetch('/api/delete-user/', {
            method: 'POST',
            body: JSON.stringify({
                id: userId,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            signal: this.fetchDeleteUserController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.setRoute('/login/');
                return;
            }

            this.fetchUsers();
        });
    }

    onDeleteClick(userId) {
        confirmationDialog.open(
            'Delete user?',
            'The user will be deleted, but jobs run by the user will be kept.',
            () => this.fetchDeleteUser(userId),
        );
    }

    componentDidMount() {
        this.fetchUsers();
    }

    componentWillUnmount() {
        this.fetchUsersController.abort();
        this.fetchDeleteUserController.abort();
    }

    render() {
        return React.createElement('div', { className: 'user-listing-view' },
            React.createElement('div', { className: 'user-listing-view__title' }, 'Users'),
            React.createElement('div', {
                className: 'user-listing-view__create-button button',
                onClick: this.props.onCreateClick,
            }, 'Create User'),
            React.createElement('div', { className: 'user-listing-view__users' },
                this.state.users.map(user => (
                    React.createElement('div', { className: 'user-listing-view__user', key: user.id },
                        React.createElement('div',
                            {
                                className: 'user-listing-view__user__title',
                                onClick: () => this.props.setRoute('/edit-user/' + userId + '/'),
                            },
                            React.createElement('div', { className: 'user-listing-view__user__username' }, user.username),
                            (user.is_admin ? React.createElement('div', { className: 'user-listing-view__user__admin' }, 'Admin') : null),
                        ),
                        React.createElement('div',
                            {
                                className: 'user-listing-view__user__delete-button',
                                onClick: () => this.onDeleteClick(user.id),
                            },
                            React.createElement(DeleteIcon, { width: 24, height: 24 }),
                        ),
                    )
                )),
            ),
        );
    }
}

export const UserListing = ReactRedux.connect(null, mapDispatchToProps)(Component);
