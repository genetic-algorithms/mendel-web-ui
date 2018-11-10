import { Checkbox } from '../checkbox';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { ReduxState } from '../../redux_state_types';
import { assertNotNull } from '../../util';
import { User } from '../../user_types';
import * as snackbar from '../../snackbar';
import { apiPost } from '../../api';

type Props = {
    user: User | null;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
    usernameExists: boolean;
};

function mapStateToProps(state: ReduxState) {
    return {
        user: state.user,
    };
}

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
            username: assertNotNull(this.props.user).username,
            password: '',
            confirmPassword: '',
            isAdmin: assertNotNull(this.props.user).is_admin,
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

        if (this.submitting) return;

        if (this.state.confirmPassword !== this.state.password) return;

        this.submitting = true;

        apiPost(
            '/api/create-edit-user/',
            {
                id: assertNotNull(this.props.user).id,
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            },
            this.props.dispatch,
        ).then(response => {
            this.submitting = false;

            if (!this.mounted) return;

            if (response.status === 'username_exists') {
                this.setState({
                    usernameExists: true,
                });
            } else {
                this.props.dispatch({
                    type: 'USER',
                    value: {
                        id: assertNotNull(this.props.user).id,
                        username: this.state.username,
                        is_admin: this.state.isAdmin,
                    },
                });

                snackbar.show('Saved');
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
            React.createElement('div', { className: 'create-edit-user-view__title' }, 'My Account'),
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

                (assertNotNull(this.props.user).is_admin ?
                    React.createElement('div', { className: 'create-edit-user-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.isAdmin,
                            onChange: this.onIsAdminChange,
                        }),
                        React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin'),
                    ) : null
                ),

                React.createElement('input', {
                    className: 'button',
                    type: 'submit',
                    value: 'Save',
                }),
            ),
        );
    }
}

export const MyAccount = ReactRedux.connect(mapStateToProps, null)(Component);
