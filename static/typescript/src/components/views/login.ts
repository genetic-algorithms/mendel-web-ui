import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { User } from '../../user_types';

type ApiResponse = {
    status: 'success' | 'wrong_credentials';
    user: User,
};

type Props = {
    onLogin: (user: User) => void;
};

type State = {
    username: string,
    password: string,
    submitting: boolean,
    wrongCredentials: boolean,
};

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        onLogin: (user: User) => {
            dispatch({
                type: 'LOGIN',
                user: user,
            });
            history.pushState(null, '', '/');
        },
    };
}

class Component extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            submitting: false,
            wrongCredentials: false,
        };

        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onUsernameChange = this.onUsernameChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.currentTarget.value;

        this.setState(prevState => (Object.assign({}, prevState, {
            password: value,
        })));
    }

    onUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.currentTarget.value;

        this.setState(prevState => (Object.assign({}, prevState, {
            username: value,
        })));
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (this.state.submitting) return;

        this.setState({
            submitting: true,
        });

        fetch('/api/login/', {
            method: 'POST',
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
        }).then(
            response => response.json()
        ).then((responseJson: ApiResponse) => {
            if (responseJson.status === 'success') {
                this.props.onLogin(responseJson.user);
            } else if (responseJson.status === 'wrong_credentials') {
                this.setState({
                    username: '',
                    password: '',
                    submitting: false,
                    wrongCredentials: true,
                });
            }
        });
    }

    render() {
        return React.createElement('div', { className: 'login-view' },
            React.createElement('div', { className: 'login-view__title' }, 'Login'),
            React.createElement('form', { className: 'login-view__form', onSubmit: this.onSubmit },
                React.createElement('input', {
                    className: 'login-view__input',
                    type: 'text',
                    placeholder: 'Username',
                    value: this.state.username,
                    required: true,
                    onChange: this.onUsernameChange,
                }),
                React.createElement('input', {
                    className: 'login-view__password login-view__input',
                    type: 'password',
                    placeholder: 'Password',
                    value: this.state.password,
                    required: true,
                    onChange: this.onPasswordChange,
                }),

                (this.state.wrongCredentials ?
                    React.createElement('div', { className: 'login-view__form-error' }, 'Incorrect credentials') :
                    null
                ),

                React.createElement('input', {
                    className: 'login-view__submit button',
                    type: 'submit',
                    value: this.state.submitting ? 'Processing…' : 'Login',
                }),
            ),
        );
    }
}

export const Login = ReactRedux.connect(null, mapDispatchToProps)(Component);
