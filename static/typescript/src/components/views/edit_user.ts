import { Checkbox } from '../checkbox';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { setRoute, assertNotNull } from '../../util';
import { apiPost, apiGet } from '../../api';
import { ReduxState } from '../../redux_state_types';

type Props = {
    userId: string;
    sessionUserId: string;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
    submitting: boolean;
    usernameExists: boolean;
};

function mapStateToProps(state: ReduxState) {
    return {
        sessionUserId: assertNotNull(state.user).id,
    };
}

class Component extends React.Component<Props, State> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);

        this.fetchController = new AbortController();

        this.onUsernameChange = this.onUsernameChange.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onConfirmPasswordChange = this.onConfirmPasswordChange.bind(this);
        this.onIsAdminChange = this.onIsAdminChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            username: '',
            password: '',
            confirmPassword: '',
            isAdmin: false,
            submitting: false,
            usernameExists: false,
        };
    }

    onUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            username: e.currentTarget.value,
            usernameExists: false,
        });
    }

    onPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            password: e.currentTarget.value,
        });
    }

    onConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            confirmPassword: e.currentTarget.value,
        });
    }

    onIsAdminChange() {
        this.setState(prevState => ({
            isAdmin: !prevState.isAdmin,
        }));
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (this.state.submitting) return;

        if (this.state.confirmPassword !== this.state.password) return;

        this.setState({
            submitting: true,
        });

        apiPost('/api/create-edit-user/',
            {
                id: this.props.userId,
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            },
            this.props.dispatch,
        ).then(response => {
            if (response.status === 'username_exists') {
                this.setState({
                    usernameExists: true,
                    submitting: false,
                });
            } else {
                if (this.props.userId === this.props.sessionUserId) {
                    this.props.dispatch({
                        type: 'USER',
                        value: {
                            id: this.props.userId,
                            username: this.state.username,
                            is_admin: this.state.isAdmin,
                        },
                    });
                }

                setRoute(this.props.dispatch, '/user-listing/');
            }
        });
    }

    componentDidMount() {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        apiGet(
            '/api/get-user/',
            { userId: this.props.userId },
            this.props.dispatch,
            this.fetchController.signal,
        ).then(response => {
            this.setState({
                username: response.username,
                isAdmin: response.is_admin,
            });
        });
    }

    componentWillUnmount() {
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'create-edit-user-view' },
            React.createElement('div', { className: 'create-edit-user-view__title' }, 'Edit User'),
            React.createElement('form', { className: 'create-edit-user-view__form', onSubmit: this.onSubmit },
                React.createElement('label', null, 'Username'),
                React.createElement('input', {
                    type: 'text',
                    required: true,
                    value: this.state.username,
                    onChange: this.onUsernameChange,
                }),
                (this.state.usernameExists ?
                    React.createElement('div', { className: 'create-edit-user-view__error' }, 'Username is already taken') :
                    null
                ),

                React.createElement('label', null, 'Password'),
                React.createElement('input', {
                    type: 'password',
                    value: this.state.password,
                    onChange: this.onPasswordChange,
                }),

                React.createElement('label', null, 'Confirm Password'),
                React.createElement('input', {
                    type: 'password',
                    value: this.state.confirmPassword,
                    onChange: this.onConfirmPasswordChange,
                }),
                (this.state.confirmPassword !== this.state.password ?
                    React.createElement('div', { className: 'create-edit-user-view__error' }, 'Does not match password') :
                    null
                ),

                React.createElement('div', { className: 'create-edit-user-view__checkbox-wrapper' },
                    React.createElement(Checkbox, {
                        checked: this.state.isAdmin,
                        onChange: this.onIsAdminChange,
                    }),
                    React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin'),
                ),

                React.createElement('input', { className: 'button', type: 'submit', value: 'Save' }),
            ),
        );
    }
}

export const EditUser = ReactRedux.connect(mapStateToProps)(Component);
