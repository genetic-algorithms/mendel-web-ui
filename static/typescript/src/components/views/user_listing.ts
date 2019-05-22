import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { DeleteIcon } from '../icons/delete';
import { ConfirmationDialog } from '../../confirmation_dialog';
import { setRoute } from '../../util';
//import { ReduxState } from '../../redux_state_types';
import { User } from '../../user_types';
import { apiPost, apiGet } from '../../api';

type Props = {
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    users: User[],
    // these state variables are used to control the visibility of the dialog component, and to store info that should be passed to it
    confirmationOpen: boolean;
    userIdToDelete: string;
};

/*
function mapStateToProps(state: ReduxState) {
    return {
        users: state.user_listing.users,
    };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        dispatch: dispatch,
        setRoute: (url: string) => setRoute(dispatch, url),
        onCreateClick: () => setRoute(dispatch, '/create-user/'),
    };
}
*/

class Component extends React.Component<Props, State> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);
        this.fetchController = new AbortController();

        this.state = {
            users: [],
            confirmationOpen: false,
            userIdToDelete: "",
        };

        this.onCreateClick = this.onCreateClick.bind(this);
        this.onConfirmationOpen = this.onConfirmationOpen.bind(this);
        this.onConfirmationCancel = this.onConfirmationCancel.bind(this);
        this.onConfirmationOk = this.onConfirmationOk.bind(this);
    }

    onCreateClick() {
        setRoute(this.props.dispatch, '/create-user/');
    }

    fetchUsers() {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        return apiGet('/api/user-list/', {}, this.props.dispatch, this.fetchController.signal);
    }


    deleteUser(userId: string) {
        return apiPost(
            '/api/delete-user/',
            { id: userId },
            this.props.dispatch,
        );
    }

    componentDidMount() {
        this.fetchUsers().then(response => {
            this.setState({
                users: response.users,
            });
        });
    }

    onConfirmationOpen(userId: string) {
        this.setState({
            confirmationOpen: true,
            userIdToDelete: userId,
        });
    };

    onConfirmationCancel() {
        this.setState({
            confirmationOpen: false,
            userIdToDelete: "",
        });
    };

    // Delete user
    onConfirmationOk() {
        this.deleteUser(this.state.userIdToDelete).then( () => {
            this.fetchUsers().then(response => {
                this.setState({
                    users: response.users,
                    confirmationOpen: false,
                    userIdToDelete: "",
                });
            });
        });
    };

    componentWillUnmount() {
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'user-listing-view' },
            React.createElement('div', { className: 'user-listing-view__title' }, 'Users'),
            React.createElement('div', {
                className: 'user-listing-view__create-button button',
                onClick: this.onCreateClick,
            }, 'Create User'),
            React.createElement('div', { className: 'user-listing-view__users' },
                this.state.users.map(user => (
                    React.createElement('div', { className: 'user-listing-view__user', key: user.id },
                        React.createElement('div',
                            {
                                className: 'user-listing-view__user__title',
                                onClick: () => setRoute(this.props.dispatch, '/edit-user/' + user.id + '/'),
                            },
                            React.createElement('div', { className: 'user-listing-view__user__username' }, user.username),
                            (user.is_admin ? React.createElement('div', { className: 'user-listing-view__user__admin' }, 'Admin') : null),
                        ),
                        React.createElement('div',
                            {
                                className: 'user-listing-view__user__delete-button',
                                onClick: () => this.onConfirmationOpen(user.id),
                            },
                            React.createElement(DeleteIcon, { width: 24, height: 24 }),
                        ),
                    )
                )),
            ),
            (this.state.confirmationOpen ?
                React.createElement(ConfirmationDialog, {
                    title: 'Delete user?',
                    descriptions: ['The user will be deleted, but jobs run by the user will be kept.'],
                    onCancel: this.onConfirmationCancel,
                    onOk: this.onConfirmationOk,
                })
                : null
            ),
        );
    }
}

export const UserListing = ReactRedux.connect()(Component);
