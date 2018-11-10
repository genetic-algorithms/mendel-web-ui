import { Checkbox } from '../checkbox';
import { setRoute } from '../../util';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { apiPost } from '../../api';

type Props = {
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
    usernameExists: boolean;
};

class Component extends React.Component<Props, State> {
    mounted: boolean;
    submitting: boolean;

    constructor(props: Props) {
        super(props);

        this.mounted = false;
        this.submitting = false;

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
            usernameExists: false,
        };
    }

    setRoute(url: string) {
        setRoute(this.props.dispatch, url);
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

        if (this.submitting) return;

        if (this.state.confirmPassword !== this.state.password) return;

        this.submitting = true;

        apiPost(
            '/api/create-edit-user/',
            {
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            },
            this.props.dispatch,
        ).then(response => {
            if (!this.mounted) return;

            if (response.status === 'username_exists') {
                this.submitting = false;
                this.setState({
                    usernameExists: true,
                });
            } else {
                this.setRoute('/user-listing/');
            }
        });
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        return React.createElement('div', { className: 'create-edit-user-view' },
            React.createElement('div', { className: 'create-edit-user-view__title' }, 'Create User'),
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
                    required: true,
                    value: this.state.password,
                    onChange: this.onPasswordChange,
                }),

                React.createElement('label', null, 'Confirm Password'),
                React.createElement('input', {
                    type: 'password',
                    required: true,
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

                React.createElement('input', {
                    className: 'button',
                    type: 'submit',
                    value: 'Create',
                }),
            ),
        );
    }
}

export const CreateUser = ReactRedux.connect(null, null)(Component);
