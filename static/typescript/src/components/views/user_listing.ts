import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { DeleteIcon } from '../icons/delete';
import * as confirmationDialog from '../../confirmation_dialog';
import { setRoute, fetchGetSmart, fetchPostSmart } from '../../util';
import { ReduxState } from '../../redux_state_types';
import { User } from '../../user_types';

type Props = {
    users: User[],
    setRoute: (url: string) => void;
    onCreateClick: () => void;
    fetchUsers: () => void;
    onDeleteClick: (userId: string) => void;
};

function mapStateToProps(state: ReduxState) {
    return {
        users: state.user_listing.users,
    };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    function fetchUsers() {
        fetchGetSmart(
            '/api/user-list/',
            dispatch,
        ).then(response => {
            dispatch({
                type: 'user_listing.USERS',
                value: response.users,
            });
        });
    }

    return {
        setRoute: (url: string) => setRoute(dispatch, url),
        onCreateClick: () => setRoute(dispatch, '/create-user/'),
        fetchUsers: fetchUsers,
        onDeleteClick: (userId: string) => {
            confirmationDialog.open(
                'Delete user?',
                'The user will be deleted, but jobs run by the user will be kept.',
                () => {
                    fetchPostSmart(
                        '/api/delete-user/',
                        {
                            id: userId,
                        },
                        dispatch,
                    ).then(fetchUsers);
                },
            );
        },
    };
}

class Component extends React.Component<Props> {
    componentDidMount() {
        this.props.fetchUsers();
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
                                onClick: () => this.props.onDeleteClick(user.id),
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
