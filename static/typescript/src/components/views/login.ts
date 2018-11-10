import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { apiPost } from '../../api';

type Props = {
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    username: string,
    password: string,
    submitting: boolean,
    wrongCredentials: boolean,
};

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

        apiPost(
            '/api/login/',
            {
                username: this.state.username,
                password: this.state.password,
            },
            this.props.dispatch,
        ).then(response => {
            if (response.status === 'success') {
                this.props.dispatch({
                    type: 'LOGIN',
                    user: response.user,
                });
                history.pushState(null, '', '/');
            } else if (response.status === 'wrong_credentials') {
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

                React.createElement('button',
                    {
                        className: 'login-view__submit button' + (this.state.submitting ? ' login-view--submitting' : ''),
                        type: 'submit',
                    },
                    React.createElement('span', { className: 'login-view__submit-text' }, 'Login'),
                ),
            ),
        );
    }
}

export const Login = ReactRedux.connect()(Component);
