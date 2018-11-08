import { Checkbox } from '../checkbox';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';

type Props = {
    userId: string;
    setRoute: (url: string) => void;
};

type State = {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
    submitting: boolean;
    usernameExists: boolean;
};

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        setRoute: (url: string) => {
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, '', url);
        },
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

        fetch('/api/create-edit-user/', {
            method: 'POST',
            body: JSON.stringify({
                id: this.props.userId,
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
        }).then(response => {
            if (response.status === 401) {
                this.props.setRoute('/login/');
                return;
            }

            response.json().then(responseJson => {
                if (responseJson.error === 'username_exists') {
                    this.setState({
                        usernameExists: true,
                        submitting: false,
                    });
                } else {
                    this.props.setRoute('/user-listing/');
                }
            });
        });
    }

    componentDidMount() {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        fetch('/api/get-user/?userId=' + encodeURIComponent(this.props.userId), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.setRoute('/login/');
                return;
            }

            response.json().then(responseJson => {
                this.setState({
                    username: responseJson.username,
                    isAdmin: responseJson.is_admin,
                });
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

                React.createElement('input', {
                    className: 'button',
                    type: 'submit',
                    value: this.state.submitting ? 'Processing…' : 'Save',
                }),
            ),
        );
    }
}

export const EditUser = ReactRedux.connect(null, mapDispatchToProps)(Component);
