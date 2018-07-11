(function () {
    'use strict';

    function reducer(state, action) {
        if (state === undefined) {
            return {
                page_loaded: false,
                page_data: {},
                authenticated: false,
                route: location.pathname,
            };
        }

        switch (action.type) {
            case 'PAGE_LOADED':
                return immer.default(state, draft => {
                    draft.page_loaded = true;
                    draft.page_data = action.page_data;
                    draft.authenticated = action.authenticated;
                });
            case 'ROUTE':
                return immer.default(state, draft => {
                    draft.route = action.value;
                });
            default:
                return state;
        }
    }

    function mapStateToProps(state) {
        return {
            route: state.route,
        };
    }

    function mapDispatchToProps(dispatch) {
        return {
            onNewJobTabClick: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/',
                });
                history.pushState(null, null, '/');
            },
            onJobsTabClick: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/jobs/',
                });
                history.pushState(null, null, '/jobs/');
            },
        };
    }

    function Component(props) {
        return React.createElement('div', { className: 'page-header' },
            React.createElement('div', { className: 'page-header__tabs' },
                React.createElement('div', {
                    className: 'page-header__tab ' + (props.route === '/' ? 'page-header--active-tab' : ''),
                    onClick: props.onNewJobTabClick,
                }, 'New Job'),
                React.createElement('div', {
                    className: 'page-header__tab ' + (props.route === '/jobs/' ? 'page-header--active-tab' : ''),
                    onClick: props.onJobsTabClick,
                }, 'Jobs'),
            ),
        );
    }

    const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);

    function mapDispatchToProps$1(dispatch) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
        };
    }

    class Component$1 extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                loading: true,
                data: null,
            };
        }

        componentDidMount() {
            fetch('/api/new-job/', {
                credentials: 'same-origin',
            }).then(response => {
                if (response.status === 401) {
                    this.props.onShowLogin();
                } else {
                    response.json().then(responseJson => {
                        this.setState({
                            loading: false,
                            data: responseJson,
                        });
                    });
                }
            });
        }

        render() {
            return React.createElement('div', { className: 'new-job-view' },
                (this.state.loading ?
                    React.createElement('div', { className: 'new-job-view__loading' }) :
                    React.createElement('form', { className: 'new-job-view__form' },
                    )
                )
            );
        }
    }

    const NewJob = ReactRedux.connect(null, mapDispatchToProps$1)(Component$1);

    function mapDispatchToProps$2(dispatch) {
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

    class Component$2 extends React.Component {
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
                        className: 'login-view__submit',
                        type: 'submit',
                        value: this.state.submitting ? 'Processing…' : 'Login',
                    }),
                ),
            );
        }
    }

    const Login = ReactRedux.connect(null, mapDispatchToProps$2)(Component$2);

    function mapStateToProps$1(state) {
        return {
            route: state.route,
        };
    }

    function getView(route) {
        if (route === '/') {
            return React.createElement(NewJob, {});
        } else if (route === '/login/') {
            return React.createElement(Login, {});
        } else {
            return null;
        }
    }

    function Component$3(props) {
        return React.createElement('div', { className: 'page-content' },
            getView(props.route),
        );
    }

    const Content = ReactRedux.connect(mapStateToProps$1)(Component$3);

    function init() {
        const store = Redux.createStore(reducer);

        const root = React.createElement(ReactRedux.Provider, { store: store },
            React.createElement('div', null,
                React.createElement(Header, {}),
                React.createElement(Content, {}),
            ),
        );

        ReactDOM.render(root, document.getElementById('react-root'));

        window.addEventListener('popstate', () => {
            store.dispatch({
                type: 'ROUTE',
                value: location.pathname,
            });
        });
    }

    init();

}());
