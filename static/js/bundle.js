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
            onSubmit: (fieldValues) => {
                fetch('/api/new-job/create/', {
                    method: 'POST',
                    body: JSON.stringify(fieldValues),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                }).then(response => {
                    response.json().then(responseJson => {
                        const url = '/jobs/' + responseJson.job_id + '/';
                        dispatch({
                            type: 'ROUTE',
                            value: url,
                        });
                        history.pushState(null, null, url);
                    });
                });
            },
        };
    }

    class Component$1 extends React.Component {
        constructor(props) {
            super(props);

            this.fieldChangeHandlers = {
                pop_size: (e) => this.simpleFieldChanged('pop_size', e),
                num_generations: (e) => this.simpleFieldChanged('num_generations', e),
            };

            this.onSubmit = this.onSubmit.bind(this);

            this.state = {
                loading: true,
                data: null,
                fieldValues: {
                    pop_size: '1000',
                    num_generations: '200',
                },
            };
        }

        onSubmit(e) {
            e.preventDefault();
            this.props.onSubmit(this.state.fieldValues);
        }

        simpleFieldChanged(id, e) {
            const value = e.target.value;

            this.setState(prevState => {
                const newFieldValues = Object.assign({}, prevState.fieldValues);
                newFieldValues[id] = value;

                return Object.assign({}, prevState, {
                    fieldValues: newFieldValues,
                });
            });
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
                    React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit },
                        React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Basic'),
                        React.createElement('div', { className: 'new-job-view__field' },
                            React.createElement('label', {}, 'Population size (initial or fixed)'),
                            React.createElement('input', {
                                type: 'number',
                                min: '2',
                                max: '1000000',
                                step: '1',
                                value: this.state.fieldValues.pop_size,
                                onChange: this.fieldChangeHandlers.pop_size,
                            }),
                        ),
                        React.createElement('div', { className: 'new-job-view__field' },
                            React.createElement('label', {}, 'Generations'),
                            React.createElement('input', {
                                type: 'number',
                                min: '0',
                                max: '1000000',
                                step: '1',
                                value: this.state.fieldValues.num_generations,
                                onChange: this.fieldChangeHandlers.num_generations,
                            }),
                        ),

                        React.createElement('input', { className: 'button', type: 'submit', value: 'Submit' }),
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
                        className: 'login-view__submit button',
                        type: 'submit',
                        value: this.state.submitting ? 'Processing…' : 'Login',
                    }),
                ),
            );
        }
    }

    const Login = ReactRedux.connect(null, mapDispatchToProps$2)(Component$2);

    function mapDispatchToProps$3(dispatch) {
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

    class Component$3 extends React.Component {
        constructor(props) {
            super(props);

            this.fetchOutput = this.fetchOutput.bind(this);

            this.state = {
                output: '',
            };

            this.mounted = false;
            this.outputOffset = 0;
        }

        componentDidMount() {
            this.mounted = true;
            this.fetchOutput();
        }

        componentWillUnmount() {
            this.mounted = false;
        }

        fetchOutput() {
            if (!this.mounted) return;

            fetch('/api/job-output/?jobId=' + encodeURIComponent(this.props.jobId) + '&offset=' + encodeURIComponent(this.outputOffset), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    this.outputOffset += responseJson.output.length;

                    this.setState((prevState, props) => ({
                        output: prevState.output + responseJson.output,
                        finished: responseJson.done,
                    }));

                    if (!responseJson.done) {
                        this.timeout = setTimeout(this.fetchOutput, 1000);
                    }
                });
            });
        }

        render() {
            return React.createElement('div', { className: 'job-detail-view' },
                React.createElement('div', { className: 'job-detail-view__id' }, this.props.jobId),
                React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output),
            );
        }
    }

    const JobDetail = ReactRedux.connect(null, mapDispatchToProps$3)(Component$3);

    function mapStateToProps$1(state) {
        return {
            route: state.route,
        };
    }

    function getView(route) {
        const jobDetailMatch = route.match(new RegExp('^/jobs/(\\w+)/$'));

        if (route === '/') {
            return React.createElement(NewJob, {});
        } else if (route === '/login/') {
            return React.createElement(Login, {});
        } else if (jobDetailMatch) {
            return React.createElement(JobDetail, {
                jobId: jobDetailMatch[1],
            });
        } else {
            return null;
        }
    }

    function Component$4(props) {
        return React.createElement('div', { className: 'page-content' },
            getView(props.route),
        );
    }

    const Content = ReactRedux.connect(mapStateToProps$1)(Component$4);

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
