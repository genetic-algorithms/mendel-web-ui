import { DeleteIcon } from '../icons/delete';
import * as confirmationDialog from '../../confirmation_dialog';
import { setRoute, fetchGetSmart, fetchPostSmart } from '../../util';

function mapStateToProps(state) {
    return {
        users: state.user_listing.users,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setRoute: url => setRoute(dispatch, url),
        onCreateClick: () => setRoute(dispatch, '/create-user/'),
        updateUsers: users => {
            dispatch({
                type: 'user_listing.USERS',
                value: users,
            });
        },
        loadingIndicatorIncrement: () => {
            dispatch({
                type: 'LOADING_INDICATOR_INCREMENT',
            });
        },
        loadingIndicatorDecrement: () => {
            dispatch({
                type: 'LOADING_INDICATOR_DECREMENT',
            });
        },
    };
}

export class Component extends React.Component {
    fetchUsers() {
        fetchGetSmart(
            '/api/user-list/',
            this.props.setRoute,
            this.props.loadingIndicatorIncrement,
            this.props.loadingIndicatorDecrement,
            response => {
                this.props.updateUsers(response.users);
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
            this.props.loadingIndicatorIncrement,
            this.props.loadingIndicatorDecrement,
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

    render() {
        return React.createElement('div', { className: 'user-listing-view' },
            React.createElement('div', { className: 'user-listing-view__title' }, 'Users'),
            React.createElement('div', {
                className: 'user-listing-view__create-button button',
                onClick: this.props.onCreateClick,
            }, 'Create User'),
            React.createElement('div', { className: 'user-listing-view__users' },
                this.props.users.map(user => (
                    React.createElement('div', { className: 'user-listing-view__user', key: user.id },
                        React.createElement('div',
                            {
                                className: 'user-listing-view__user__title',
                                onClick: () => this.props.setRoute('/edit-user/' + user.id + '/'),
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

export const UserListing = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
