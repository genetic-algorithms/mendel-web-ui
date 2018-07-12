function mapDispatchToProps(dispatch) {
    return {
        onShowHome: () => {
            dispatch({
                type: 'ROUTE',
                value: '/',
            });
            history.pushState(null, null, '/');
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            submitting: false,
            wrongCredentials: false,
        };

        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onPasswordChange(e) {
        const value = e.target.value;

        this.setState((prevState) => (Object.assign({}, prevState, {
            password: value,
        })));
    }

    onSubmit(e) {
        e.preventDefault();

        if (this.state.submitting) return;

        this.setState((prevState) => (Object.assign({}, prevState, {
            submitting: true,
        })));

        fetch('/api/login/', {
            method: 'POST',
            body: JSON.stringify({
                password: this.state.password,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
        }).then(
            response => response.json()
        ).then(responseJson => {
            if (responseJson.status === 'success') {
                this.props.onShowHome();
            } else if (responseJson.status === 'wrong_credentials') {
                this.setState({
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
                    type: 'password',
                    placeholder: 'Password',
                    value: this.state.password,
                    required: true,
                    onChange: this.onPasswordChange,
                }),

                (this.state.wrongCredentials ?
                    React.createElement('div', { className: 'login-view__form-error' }, 'Incorrect password') :
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
