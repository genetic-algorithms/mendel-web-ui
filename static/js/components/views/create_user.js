import { Checkbox } from '../checkbox';

function mapDispatchToProps(dispatch) {
    return {
        setRoute: url => {
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
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

    onUsernameChange(e) {
        this.setState({
            username: e.target.value,
            usernameExists: false,
        });
    }

    onPasswordChange(e) {
        this.setState({
            password: e.target.value,
        });
    }

    onConfirmPasswordChange(e) {
        this.setState({
            confirmPassword: e.target.value,
        });
    }

    onIsAdminChange() {
        this.setState(prevState => ({
            isAdmin: !prevState.isAdmin,
        }));
    }

    onSubmit(e) {
        e.preventDefault();

        if (this.state.submitting) return;

        if (this.state.confirmPassword !== this.state.password) return;

        this.setState({
            submitting: true,
        });

        fetch('/api/create-user/', {
            method: 'POST',
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
                confirm_password: this.state.confirmPassword,
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

    render() {
        return React.createElement('div', { className: 'create-user-view' },
            React.createElement('div', { className: 'create-user-view__title' }, 'Create User'),
            React.createElement('form', { className: 'create-user-view__form', onSubmit: this.onSubmit },
                React.createElement('label', null, 'Username'),
                React.createElement('input', {
                    type: 'text',
                    required: true,
                    value: this.state.username,
                    onChange: this.onUsernameChange,
                }),
                (this.state.usernameExists ?
                    React.createElement('div', { className: 'create-user-view__error' }, 'Username is already taken') :
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
                    React.createElement('div', { className: 'create-user-view__error' }, 'Does not match password') :
                    null
                ),

                React.createElement('div', { className: 'create-user-view__checkbox-wrapper' },
                    React.createElement(Checkbox, {
                        checked: this.state.isAdmin,
                        onChange: this.onIsAdminChange,
                    }),
                    React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin'),
                ),

                React.createElement('input', {
                    className: 'button',
                    type: 'submit',
                    value: this.state.submitting ? 'Processing…' : 'Create',
                }),
            ),
        );
    }
}

export const CreateUser = ReactRedux.connect(null, mapDispatchToProps)(Component);
