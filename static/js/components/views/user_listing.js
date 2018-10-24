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

function fetchGetSmart(url, setRoute, loadingIndicator, onSuccess) {
    const abortController = new AbortController();
    loadingIndicator.increment();

    fetch(url, {
        credentials: 'same-origin',
        signal: abortController.signal,
    }).then(response => {
        loadingIndicator.decrement();

        if (response.status === 401) {
            setRoute('/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicator.decrement();
        console.error(err);
    });

    return abortController;
}

function fetchPost(url, body) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
    });
}

function fetchPostSmart(url, body, setRoute, loadingIndicator, onSuccess) {
    loadingIndicator.increment();

    return fetchPost(url, body).then(response => {
        loadingIndicator.decrement();

        if (response.status === 401) {
            setRoute('/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicator.decrement();
        console.error(err);
    });
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fetchUsersController = new AbortController();

        this.state = {
            users: [],
        };
    }

    fetchUsers() {
        this.fetchUsersController.abort();

        this.fetchUsersController = fetchGetSmart(
            '/api/user-list/',
            this.props.setRoute,
            this.props.loadingIndicator,
            response => {
                this.setState({
                    users: response.users,
                });
            }
        );
    }

    fetchDeleteUser(userId) {
        fetchPostSmart(
            '/api/delete-user/',
            {
                id: userId,
            },
            this.props.setRoute,
            this.props.loadingIndicator,
            () => {
                this.fetchUsers();
            },
        );
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
