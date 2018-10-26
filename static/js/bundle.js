(function () {
    'use strict';

    function reducer(state, action) {
        if (state === undefined) {
            return {
                user: null,
                route: location.pathname,
                loading_indicator_count: 0,
                user_listing: {
                    users: [],
                },
            };
        }

        switch (action.type) {
            case 'USER':
                return immer.default(state, draft => {
                    draft.user = action.value;
                });
            case 'LOGIN':
                return immer.default(state, draft => {
                    draft.route = '/';
                    draft.user = action.user;
                });
            case 'LOGOUT':
                return immer.default(state, draft => {
                    draft.route = '/login/';
                    draft.user = null;
                });
            case 'ROUTE':
                return immer.default(state, draft => {
                    draft.route = action.value;
                });
            case 'LOADING_INDICATOR_INCREMENT':
                return immer.default(state, draft => {
                    draft.loading_indicator_count += 1;
                });
            case 'LOADING_INDICATOR_DECREMENT':
                return immer.default(state, draft => {
                    draft.loading_indicator_count = Math.max(draft.loading_indicator_count - 1, 0);
                });
            case 'user_listing.USERS':
                return immer.default(state, draft => {
                    draft.user_listing.users = action.value;
                });
            default:
                return state;
        }
    }

    function setRoute(dispatch, url) {
        dispatch({
            type: 'ROUTE',
            value: url,
        });
        history.pushState(null, null, url);
    }


    function loadingIndicatorIncrement(dispatch) {
        dispatch({
            type: 'LOADING_INDICATOR_INCREMENT',
        });
    }

    function loadingIndicatorDecrement(dispatch) {
        dispatch({
            type: 'LOADING_INDICATOR_DECREMENT',
        });
    }

    function fetchGetSmart(url, dispatch, onSuccess) {
        loadingIndicatorIncrement(dispatch);

        fetch(url, {
            credentials: 'same-origin',
        }).then(response => {
            loadingIndicatorDecrement(dispatch);

            if (response.status === 401) {
                setRoute(dispatch, '/login/');
                return;
            }

            response.json().then(responseJson => {
                onSuccess(responseJson);
            });
        }).catch(err => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
        });
    }

    function fetchPost(url, body) {
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
        });
    }

    function fetchPostSmart(url, body, dispatch, onSuccess) {
        loadingIndicatorIncrement(dispatch);

        return fetchPost(url, body).then(response => {
            loadingIndicatorDecrement(dispatch);

            if (response.status === 401) {
                setRoute(dispatch, '/login/');
                return;
            }

            response.json().then(responseJson => {
                onSuccess(responseJson);
            });
        }).catch(err => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
        });
    }

    class AccountIcon extends React.PureComponent {
        render() {
            return React.createElement(
                'svg',
                {
                    width: this.props.width.toString(),
                    height: this.props.height.toString(),
                    viewBox: '0 0 24 24',
                    xmlns: 'http://www.w3.org/2000/svg',
                },
                React.createElement('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' }),
            );
        }
    }

    function mapStateToProps(state) {
        return {
            user: state.user,
            route: state.route,
            loading: state.loading_indicator_count !== 0,
        };
    }

    function mapDispatchToProps(dispatch) {
        return {
            onNewJobTabClick: () => setRoute(dispatch, '/'),
            onJobsTabClick: () => setRoute(dispatch, '/job-listing/'),
            onUsersTabClick: () => setRoute(dispatch, '/user-listing/'),
            onLogoutClick: () => {
                fetchPostSmart(
                    '/api/logout/',
                    {},
                    dispatch,
                    () => {
                        dispatch({
                            type: 'LOGOUT',
                        });
                        history.pushState(null, null, '/login/');
                    },
                );
            },
        };
    }

    class Component extends React.Component {
        constructor(props) {
            super(props);

            this.menuButtonElement = React.createRef();

            this.state = {
                menuOpen: false,
            };

            this.onDocumentClick = e => {
                if (this.state.menuOpen) {
                    this.setState({
                        menuOpen: false,
                    });
                } else {
                    if (this.menuButtonElement.current && this.menuButtonElement.current.contains(e.target)) {
                        this.setState({
                            menuOpen: true,
                        });
                    }
                }
            };
        }

        componentDidMount() {
            document.addEventListener('click', this.onDocumentClick);
        }

        componentWillUnmount() {
            document.removeEventListener('click', this.onDocumentClick);
        }

        render() {
            return React.createElement('div', { className: 'page-header' },
                React.createElement('div', { className: 'page-header__tabs' },
                    React.createElement('div', {
                        className: 'page-header__tab ' + (this.props.route === '/' ? 'page-header--active-tab' : ''),
                        onClick: this.props.onNewJobTabClick,
                    }, 'New Job'),
                    React.createElement('div', {
                        className: 'page-header__tab ' + (this.props.route === '/job-listing/' ? 'page-header--active-tab' : ''),
                        onClick: this.props.onJobsTabClick,
                    }, 'Jobs'),
                    (this.props.user && this.props.user.is_admin ?
                        React.createElement('div', {
                            className: 'page-header__tab ' + (this.props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                            onClick: this.props.onUsersTabClick,
                        }, 'Users') :
                        null
                    ),
                ),
                (this.props.loading ?
                    React.createElement('div', { className: 'page-header__loading-indicator' }) :
                    null
                ),
                (this.props.user ?
                    React.createElement('div',
                        {
                            className: 'page-header__account-menu-button',
                            ref: this.menuButtonElement,
                        },
                        React.createElement(AccountIcon, { width: 24, height: 24 }),
                    ) :
                    null
                ),
                (this.props.user ?
                    React.createElement('div',
                        {
                            className: 'page-header__account-menu ' + (this.state.menuOpen ? 'page-header--account-menu-open' : '' ),
                        },
                        React.createElement('div', { className: 'page-header__account-menu-item' }, 'My Account'),
                        React.createElement('div', {
                            className: 'page-header__account-menu-item',
                            onClick: this.props.onLogoutClick,
                        }, 'Logout'),
                    ) :
                    null
                ),
            );
        }
    }

    const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);

    class CheckboxCheckedIcon extends React.PureComponent {
        render() {
            return React.createElement(
                'svg',
                {
                    width: this.props.width.toString(),
                    height: this.props.height.toString(),
                    viewBox: '0 0 24 24',
                    xmlns: 'http://www.w3.org/2000/svg',
                },
                React.createElement('path', { d: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }),
            );
        }
    }

    class CheckboxUncheckedIcon extends React.PureComponent {
        render() {
            return React.createElement(
                'svg',
                {
                    width: this.props.width.toString(),
                    height: this.props.height.toString(),
                    viewBox: '0 0 24 24',
                    xmlns: 'http://www.w3.org/2000/svg',
                },
                React.createElement('path', { d: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' }),
            );
        }
    }

    class Checkbox extends React.PureComponent {
        constructor(props) {
            super(props);

            this.onClick = this.onClick.bind(this);
        }

        onClick() {
            this.props.onChange(!this.props.checked);
        }

        render() {
            return React.createElement('div',
                {
                    className: 'checkbox ' + (this.props.checked ? 'checkbox--checked' : ''),
                    onClick: this.onClick,
                },
                (this.props.checked ?
                    React.createElement(CheckboxCheckedIcon, { width: 24, height: 24 }) :
                    React.createElement(CheckboxUncheckedIcon, { width: 24, height: 24 })
                ),
            );
        }
    }

    function mapDispatchToProps$1(dispatch) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
            onSubmit: (data) => {
                fetch('/api/create-job/', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                }).then(response => {
                    response.json().then(responseJson => {
                        const url = '/job-detail/' + responseJson.job_id + '/';
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
                title: (e) => this.simpleFieldChanged('title', e),
                pop_size: (e) => this.simpleFieldChanged('pop_size', e),
                num_generations: (e) => this.simpleFieldChanged('num_generations', e),
                mutn_rate: (e) => this.simpleFieldChanged('mutn_rate', e),
                fitness_effect_model: (e) => this.simpleFieldChanged('fitness_effect_model', e),
                files_to_output_fit: (checked) => this.checkboxFieldChanged('files_to_output_fit', checked),
                files_to_output_hst: (checked) => this.checkboxFieldChanged('files_to_output_hst', checked),
                files_to_output_allele_bins: (checked) => this.checkboxFieldChanged('files_to_output_allele_bins', checked),
            };

            this.onSubmit = this.onSubmit.bind(this);

            this.state = {
                fieldValues: {
                    title: '',
                    pop_size: '1000',
                    num_generations: '200',
                    mutn_rate: '50.0',
                    fitness_effect_model: 'weibull',
                    uniform_fitness_effect_del: '0.0001',
                    uniform_fitness_effect_fav: '0.0001',
                    files_to_output_fit: true,
                    files_to_output_hst: true,
                    files_to_output_allele_bins: true,
                },
            };
        }

        onSubmit(e) {
            e.preventDefault();
            this.props.onSubmit({
                title: this.state.fieldValues.title,
                config: [
                    '[basic]',
                    'pop_size = ' + tomlInt(this.state.fieldValues.pop_size),
                    'num_generations = ' + tomlInt(this.state.fieldValues.num_generations),

                    '[mutations]',
                    'mutn_rate = ' + tomlFloat(this.state.fieldValues.mutn_rate),
                    'fitness_effect_model = ' + tomlString(this.state.fieldValues.fitness_effect_model),
                    'uniform_fitness_effect_del = ' + tomlFloat(this.state.fieldValues.uniform_fitness_effect_del),
                    'uniform_fitness_effect_fav = ' + tomlFloat(this.state.fieldValues.uniform_fitness_effect_fav),

                    '[computation]',
                    'plot_allele_gens = 1',
                    'files_to_output = ' + tomlString(
                        filesToOutputString(
                            this.state.fieldValues.files_to_output_fit,
                            this.state.fieldValues.files_to_output_hst,
                            this.state.fieldValues.files_to_output_allele_bins
                        )
                    ),
                ].join('\n'),
            });
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

        checkboxFieldChanged(id, checked) {
            this.setState(prevState => {
                const newFieldValues = Object.assign({}, prevState.fieldValues);
                newFieldValues[id] = checked;

                return Object.assign({}, prevState, {
                    fieldValues: newFieldValues,
                });
            });
        }

        render() {
            return React.createElement('div', { className: 'new-job-view' },
                React.createElement('div', { className: 'new-job-view__loading' }),
                React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit },
                    React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Metadata'),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Job title'),
                        React.createElement('input', {
                            type: 'text',
                            value: this.state.fieldValues.title,
                            onChange: this.fieldChangeHandlers.title,
                        }),
                    ),

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

                    React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Mutations'),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Total mutation rate (per individual per generation)'),
                        React.createElement('input', {
                            type: 'number',
                            min: '0',
                            max: '1000',
                            step: 'any',
                            value: this.state.fieldValues.mutn_rate,
                            onChange: this.fieldChangeHandlers.mutn_rate,
                        }),
                    ),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Fitness effect model'),
                        React.createElement('select',
                            {
                                value: this.state.fieldValues.fitness_effect_model,
                                onChange: this.fieldChangeHandlers.fitness_effect_model,
                            },
                            React.createElement('option', { value: 'fixed' }, 'Fixed'),
                            React.createElement('option', { value: 'uniform' }, 'Uniform'),
                            React.createElement('option', { value: 'weibull' }, 'Weibull (default)'),
                        ),
                    ),
                    React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                        React.createElement('label', {}, 'For fixed: effect for each deleterious mutation'),
                        React.createElement('input', {
                            type: 'number',
                            min: '0',
                            max: '0.1',
                            step: 'any',
                            disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                            value: this.state.fieldValues.uniform_fitness_effect_del,
                            onChange: this.fieldChangeHandlers.uniform_fitness_effect_del,
                        }),
                    ),
                    React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                        React.createElement('label', {}, 'For fixed: effect for each beneficial mutation'),
                        React.createElement('input', {
                            type: 'number',
                            min: '0',
                            max: '0.1',
                            step: 'any',
                            disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                            value: this.state.fieldValues.uniform_fitness_effect_fav,
                            onChange: this.fieldChangeHandlers.uniform_fitness_effect_fav,
                        }),
                    ),

                    React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Output Files'),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'mendel.fit'),
                        React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                            React.createElement(Checkbox, {
                                checked: this.state.fieldValues.files_to_output_fit,
                                onChange: this.fieldChangeHandlers.files_to_output_fit,
                            }),
                        ),
                    ),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'mendel.hst'),
                        React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                            React.createElement(Checkbox, {
                                checked: this.state.fieldValues.files_to_output_hst,
                                onChange: this.fieldChangeHandlers.files_to_output_hst,
                            }),
                        ),
                    ),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Allele bin and distribution files'),
                        React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                            React.createElement(Checkbox, {
                                checked: this.state.fieldValues.files_to_output_allele_bins,
                                onChange: this.fieldChangeHandlers.files_to_output_allele_bins,
                            }),
                        ),
                    ),

                    React.createElement('input', { className: 'button', type: 'submit', value: 'Submit' }),
                )
            );
        }
    }

    function filesToOutputString(fit, hst, alleles) {
        if (fit && hst && alleles) {
            return '*';
        } else {
            const outputFiles = [];

            if (fit) {
                outputFiles.push('mendel.fit');
            }

            if (hst) {
                outputFiles.push('mendel.hst');
            }

            if (alleles) {
                outputFiles.push('allele-bins/');
                outputFiles.push('normalized-allele-bins/');
                outputFiles.push('allele-distribution-del/');
                outputFiles.push('allele-distribution-fav/');
            }

            return outputFiles.join(',');
        }
    }

    // In TOML ints must NOT contain a period
    function tomlInt(s) {
        return parseInt(s).toString();
    }

    // In TOML floats must contain a period
    function tomlFloat(s) {
        if (s.includes('.')) {
            return s;
        } else {
            return s + '.0';
        }
    }

    function tomlString(s) {
        return '"' + s + '"';
    }

    const NewJob = ReactRedux.connect(null, mapDispatchToProps$1)(Component$1);

    function mapDispatchToProps$2(dispatch) {
        return {
            onLogin: user => {
                dispatch({
                    type: 'LOGIN',
                    user: user,
                });
                history.pushState(null, null, '/');
            },
        };
    }

    class Component$2 extends React.Component {
        constructor(props) {
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

        onPasswordChange(e) {
            const value = e.target.value;

            this.setState(prevState => (Object.assign({}, prevState, {
                password: value,
            })));
        }

        onUsernameChange(e) {
            const value = e.target.value;

            this.setState(prevState => (Object.assign({}, prevState, {
                username: value,
            })));
        }

        onSubmit(e) {
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
            ).then(responseJson => {
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
            onClick: (jobId) => {
                const url = '/job-detail/' + jobId + '/';
                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$3 extends React.Component {
        constructor(props) {
            super(props);

            this.onFilterChanged = this.onFilterChanged.bind(this);
            this.fetchController = new AbortController();

            this.state = {
                jobs: [],
                all: false,
            };
        }

        onFilterChanged(e) {
            const value = e.target.value;
            const all = value === 'all';

            this.fetchJobs(all);

            this.setState({
                all: all,
            });
        }

        fetchJobs(all) {
            this.fetchController.abort();
            this.fetchController = new AbortController();

            fetch('/api/job-list/?filter=' + (all ? 'all' : 'mine'), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                if (response.status === 401) {
                    this.props.onShowLogin();
                    return;
                }

                response.json().then(responseJson => {
                    this.setState({
                        jobs: responseJson.jobs,
                    });
                });
            });
        }

        componentDidMount() {
            this.fetchJobs(this.state.all);
        }

        componentWillUnmount() {
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'job-listing-view' },
                React.createElement('div', { className: 'job-listing-view__title' }, 'Jobs'),
                React.createElement('select',
                    {
                        className: 'job-listing-view__filter',
                        value: this.state.all ? 'all' : 'mine',
                        onChange: this.onFilterChanged,
                    },
                    React.createElement('option', { value: 'mine' }, 'My Jobs'),
                    React.createElement('option', { value: 'all' }, 'All Jobs'),
                ),
                React.createElement('div', { className: 'job-listing-view__jobs' },
                    React.createElement('div', { className: 'job-listing-view__labels' },
                        React.createElement('div', { className: 'job-listing-view__labels__title' }, 'Title'),
                        React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'),
                        React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'),
                    ),

                    this.state.jobs.map(job => (
                        React.createElement('div',
                            {
                                className: 'job-listing-view__job',
                                key: job.id,
                                onClick: () => this.props.onClick(job.id),
                            },
                            React.createElement('div', { className: 'job-listing-view__job__title' }, job.title),
                            React.createElement('div', { className: 'job-listing-view__job__time' }, moment(job.time).fromNow()),
                            React.createElement('div', { className: 'job-listing-view__job__status' },
                                capitalizeFirstLetter(job.status),
                            ),
                        )
                    )),
                ),
            );
        }
    }

    function capitalizeFirstLetter(s) {
        return s[0].toUpperCase() + s.substring(1);
    }

    const JobListing = ReactRedux.connect(null, mapDispatchToProps$3)(Component$3);

    class DeleteIcon extends React.PureComponent {
        render() {
            return React.createElement(
                'svg',
                {
                    width: this.props.width.toString(),
                    height: this.props.height.toString(),
                    viewBox: '0 0 24 24',
                    xmlns: 'http://www.w3.org/2000/svg',
                },
                React.createElement('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' }),
            );
        }
    }

    let rootElement = null;

    function open(title, description, actionCallback) {
        if (rootElement !== null) {
            close();
        }

        const cancelButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Cancel')]);
        const actionButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Ok')]);
        const overlay = createElement('div', 'confirmation-dialog__overlay', []);

        rootElement = createElement('div', 'confirmation-dialog', [
            overlay,
            createElement('div', 'confirmation-dialog__content', [
                createElement('div', 'confirmation-dialog__title', [document.createTextNode(title)]),
                createElement('div', 'confirmation-dialog__description', [document.createTextNode(description)]),
                createElement('div', 'confirmation-dialog__buttons', [
                    cancelButton,
                    actionButton,
                ]),
            ]),
        ]);

        cancelButton.addEventListener('click', close);
        overlay.addEventListener('click', close);
        actionButton.addEventListener('click', () => {
            close();
            actionCallback();
        });

        document.body.appendChild(rootElement);
    }

    function close() {
        if (rootElement === null) return;
        rootElement.parentNode.removeChild(rootElement);
        rootElement = null;
    }

    function createElement(tagName, className, children) {
        const element = document.createElement(tagName);
        element.className = className;

        for (let i = 0; i < children.length; ++i) {
            element.appendChild(children[i]);
        }

        return element;
    }

    function mapStateToProps$1(state) {
        return {
            users: state.user_listing.users,
        };
    }

    function mapDispatchToProps$4(dispatch) {
        function fetchUsers() {
            fetchGetSmart(
                '/api/user-list/',
                dispatch,
                response => {
                    dispatch({
                        type: 'user_listing.USERS',
                        value: response.users,
                    });
                }
            );
        }

        return {
            setRoute: url => setRoute(dispatch, url),
            onCreateClick: () => setRoute(dispatch, '/create-user/'),
            fetchUsers: fetchUsers,
            fetchDeleteUser: userId => {
                fetchPostSmart(
                    '/api/delete-user/',
                    {
                        id: userId,
                    },
                    dispatch,
                    fetchUsers,
                );
            }
        };
    }

    class Component$4 extends React.Component {
        onDeleteClick(userId) {
            open(
                'Delete user?',
                'The user will be deleted, but jobs run by the user will be kept.',
                () => this.props.fetchDeleteUser(userId),
            );
        }

        componentDidMount() {
            this.props.fetchUsers();
        }

        render() {
            return React.createElement('div', { className: 'user-listing-view' },
                React.createElement('div', { className: 'user-listing-view__title' }, 'Users'),
                React.createElement('div', {
                    className: 'user-listing-view__create-button button',
                    onClick: this.props.onCreateClick,
                }, 'Create User'),
                React.createElement('div', { className: 'user-listing-view__users' },
                    this.props.users.map(user => (
                        React.createElement('div', { className: 'user-listing-view__user', key: user.id },
                            React.createElement('div',
                                {
                                    className: 'user-listing-view__user__title',
                                    onClick: () => this.props.setRoute('/edit-user/' + user.id + '/'),
                                },
                                React.createElement('div', { className: 'user-listing-view__user__username' }, user.username),
                                (user.is_admin ? React.createElement('div', { className: 'user-listing-view__user__admin' }, 'Admin') : null),
                            ),
                            React.createElement('div',
                                {
                                    className: 'user-listing-view__user__delete-button',
                                    onClick: () => this.onDeleteClick(user.id),
                                },
                                React.createElement(DeleteIcon, { width: 24, height: 24 }),
                            ),
                        )
                    )),
                ),
            );
        }
    }

    const UserListing = ReactRedux.connect(mapStateToProps$1, mapDispatchToProps$4)(Component$4);

    function mapDispatchToProps$5(dispatch) {
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

    class Component$5 extends React.Component {
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

            fetch('/api/create-edit-user/', {
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
                        value: this.state.submitting ? 'Processing…' : 'Create',
                    }),
                ),
            );
        }
    }

    const CreateUser = ReactRedux.connect(null, mapDispatchToProps$5)(Component$5);

    function mapDispatchToProps$6(dispatch) {
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

    class Component$6 extends React.Component {
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

    const EditUser = ReactRedux.connect(null, mapDispatchToProps$6)(Component$6);

    function mapDispatchToProps$7(dispatch, ownProps) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
            onPlotsClick: () => {
                const url = '/plots/' + ownProps.jobId + '/average-mutations/';

                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$7 extends React.Component {
        constructor(props) {
            super(props);

            this.fetchOutput = this.fetchOutput.bind(this);
            this.fetchController = new AbortController();
            this.fetchTimeout = null;
            this.outputOffset = 0;

            this.state = {
                output: '',
                done: false,
            };
        }

        componentDidMount() {
            this.fetchOutput();
        }

        componentWillUnmount() {
            this.fetchController.abort();
            window.clearTimeout(this.fetchTimeout);
        }

        fetchOutput() {
            this.fetchController = new AbortController();

            fetch('/api/job-output/?jobId=' + encodeURIComponent(this.props.jobId) + '&offset=' + encodeURIComponent(this.outputOffset), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                if (response.status === 401) {
                    this.props.onShowLogin();
                    return;
                }

                response.json().then(responseJson => {
                    this.outputOffset += responseJson.output.length;

                    this.setState((prevState, props) => ({
                        output: prevState.output + responseJson.output,
                        done: responseJson.done,
                    }));

                    if (!responseJson.done) {
                        this.fetchTimeout = setTimeout(this.fetchOutput, 1000);
                    }
                });
            });
        }

        render() {
            return React.createElement('div', { className: 'job-detail-view' },
                React.createElement('div', { className: 'job-detail-view__title' },
                    'Job',
                    React.createElement('span', { className: 'job-detail-view__job-id' }, this.props.jobId),
                ),
                React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output),
                React.createElement('div', { className: 'job-detail-view__bottom' },
                    React.createElement('div', { className: 'job-detail-view__status' },
                        'Status: ' + (this.state.done ? 'Done' : 'Running')
                    ),
                    (this.state.done ?
                        React.createElement('div',
                            {
                                className: 'job-detail-view__plots-button button',
                                onClick: this.props.onPlotsClick,
                            },
                            'Plots',
                        ) :
                        null
                    ),
                ),
            );
        }
    }

    const JobDetail = ReactRedux.connect(null, mapDispatchToProps$7)(Component$7);

    const LINKS = [
        {
            title: 'Average mutations/individual',
            slug: 'average-mutations',
        },
        {
            title: 'Fitness history',
            slug: 'fitness-history',
        },
        {
            title: 'Distribution of accumulated mutations (deleterious)',
            slug: 'deleterious-mutations',
        },
        {
            title: 'Distribution of accumulated mutations (beneficial)',
            slug: 'beneficial-mutations',
        },
        {
            title: 'SNP Frequencies',
            slug: 'snp-frequencies',
        },
        {
            title: 'Minor Allele Frequencies',
            slug: 'minor-allele-frequencies',
        },
    ];

    function mapDispatchToProps$8(dispatch, ownProps) {
        return {
            onClick: (slug) => {
                const url = '/plots/' + ownProps.jobId + '/' + slug + '/';
                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$8 extends React.Component {
        render() {
            return React.createElement('div', { className: 'plots-view__sidebar' },
                LINKS.map(link => (
                    React.createElement('div', {
                        className: 'plots-view__sidebar__item ' + (this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                        onClick: () => this.props.onClick(link.slug),
                        key: link.slug,
                    }, link.title)
                )),
            );
        }
    }

    const Sidebar = ReactRedux.connect(null, mapDispatchToProps$8)(Component$8);

    class AverageMutations extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-average-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    const data = [
                        {
                            x: responseJson.generations,
                            y: responseJson.deleterious,
                            type: 'scatter',
                            name: 'Deleterious',
                            line: {
                                color: 'rgb(200, 0, 0)',
                            },
                        },
                        {
                            x: responseJson.generations,
                            y: responseJson.neutral,
                            type: 'scatter',
                            name: 'Neutral',
                            line: {
                                color: 'rgb(0, 0, 200)',
                            },
                        },
                        {
                            x: responseJson.generations,
                            y: responseJson.favorable,
                            type: 'scatter',
                            name: 'Favorable',
                            line: {
                                color: 'rgb(0, 200, 0)',
                            },
                        },
                    ];

                    const layout = {
                        title: 'Average mutations/individual',
                        xaxis: {
                            title: 'Generations',
                        },
                        yaxis: {
                            title: 'Mutations',
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'average-mutations' }),
                React.createElement('div', { className: 'plots-view__non-sidebar' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                ),
            );
        }
    }

    class FitnessHistory extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-fitness-history/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    const data = [
                        {
                            x: responseJson.generations,
                            y: responseJson.fitness,
                            type: 'scatter',
                            name: 'Fitness',
                            line: {
                                color: 'rgb(200, 0, 0)',
                            },
                        },
                        {
                            x: responseJson.generations,
                            y: responseJson.pop_size,
                            type: 'scatter',
                            name: 'Population Size',
                            line: {
                                color: 'rgb(0, 0, 200)',
                            },
                            yaxis: 'y2',
                        },
                    ];

                    const layout = {
                        title: 'Fitness history',
                        xaxis: {
                            title: 'Generations',
                        },
                        yaxis: {
                            title: 'Fitness',
                        },
                        yaxis2: {
                            title: 'Population Size',
                            overlaying: 'y',
                            side: 'right',
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'fitness-history' }),
                React.createElement('div', { className: 'plots-view__non-sidebar' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                ),
            );
        }
    }

    class DeleteriousMutations extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;

            this.state = {
                data: [],
                currentIndex : 0,
            };
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        sliderInputChange(e) {
            const newIndex = parseInt(e.target.value);

            if (newIndex < this.state.data.length) {
                Plotly.restyle(this.plotElement, {
                    y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
                }, [0, 1]);
            }

            this.setState({
                currentIndex: newIndex,
            });
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-deleterious-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    let maxY = 0;
                    for (let generation of responseJson) {
                        for (let n of generation.dominant) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.recessive) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }
                    }

                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
                        {
                            x: generationData.binmidpointfitness,
                            y: generationData.dominant,
                            type: 'scatter',
                            name: 'Dominant',
                            line: {
                                color: 'rgb(0, 200, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 200, 0, 0.5)',
                        },
                        {
                            x: generationData.binmidpointfitness,
                            y: generationData.recessive,
                            type: 'scatter',
                            name: 'Recessive',
                            line: {
                                color: 'rgb(200, 0, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 0, 0.5)',
                        },
                    ];

                    const layout = {
                        title: 'Distribution of accumulated mutations (deleterious)',
                        xaxis: {
                            title: 'Mutational Fitness Degradation',
                            type: 'log',
                            autorange: 'reversed',
                            exponentformat: 'e',
                        },
                        yaxis: {
                            title: 'Fraction of Mutations Retained in Genome',
                            range: [0, maxY],
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);

                    this.setState({
                        data: responseJson,
                        currentIndex: responseJson.length - 1,
                    });
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'deleterious-mutations' }),
                React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                    React.createElement('div', { className: 'plots-view__slider' },
                        React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'),
                        React.createElement('div', { className: 'plots-view__slider-number' },
                            this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation
                        ),
                        React.createElement('input', {
                            className: 'plots-view__slider-input',
                            type: 'range',
                            max: this.state.data.length - 1,
                            value: this.state.currentIndex,
                            onChange: this.sliderInputChange,
                        }),
                    ),
                ),
            );
        }
    }

    class BeneficialMutations extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;

            this.state = {
                data: [],
                currentIndex : 0,
            };
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        sliderInputChange(e) {
            const newIndex = parseInt(e.target.value);

            if (newIndex < this.state.data.length) {
                Plotly.restyle(this.plotElement, {
                    y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
                }, [0, 1]);
            }

            this.setState({
                currentIndex: newIndex,
            });
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-beneficial-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    let maxY = 0;
                    for (let generation of responseJson) {
                        for (let n of generation.dominant) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.recessive) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }
                    }

                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
                        {
                            x: generationData.binmidpointfitness,
                            y: generationData.dominant,
                            type: 'scatter',
                            name: 'Dominant',
                            line: {
                                color: 'rgb(0, 200, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 200, 0, 0.5)',
                        },
                        {
                            x: generationData.binmidpointfitness,
                            y: generationData.recessive,
                            type: 'scatter',
                            name: 'Recessive',
                            line: {
                                color: 'rgb(200, 0, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 0, 0.5)',
                        },
                    ];

                    const layout = {
                        title: 'Distribution of accumulated mutations (beneficial)',
                        xaxis: {
                            title: 'Mutational Fitness Enhancement',
                            type: 'log',
                            exponentformat: 'e',
                        },
                        yaxis: {
                            title: 'Fraction of Mutations Retained in Genome',
                            range: [0, maxY],
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);

                    this.setState({
                        data: responseJson,
                        currentIndex: responseJson.length - 1,
                    });
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'beneficial-mutations' }),
                React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                    React.createElement('div', { className: 'plots-view__slider' },
                        React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'),
                        React.createElement('div', { className: 'plots-view__slider-number' },
                            this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation
                        ),
                        React.createElement('input', {
                            className: 'plots-view__slider-input',
                            type: 'range',
                            max: this.state.data.length - 1,
                            value: this.state.currentIndex,
                            onChange: this.sliderInputChange,
                        }),
                    ),
                ),
            );
        }
    }

    class SnpFrequencies extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;

            this.state = {
                data: [],
                currentIndex : 0,
            };
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        sliderInputChange(e) {
            const newIndex = parseInt(e.target.value);

            if (newIndex < this.state.data.length) {
                Plotly.restyle(this.plotElement, {
                    y: [
                        this.state.data[newIndex].deleterious,
                        this.state.data[newIndex].favorable,
                        this.state.data[newIndex].neutral,
                        this.state.data[newIndex].delInitialAlleles,
                        this.state.data[newIndex].favInitialAlleles,
                    ],
                }, [0, 1, 2, 3, 4]);
            }

            this.setState({
                currentIndex: newIndex,
            });
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-snp-frequencies/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    let maxY = 0;
                    for (let generation of responseJson) {
                        for (let n of generation.deleterious) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.favorable) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.neutral) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.delInitialAlleles) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.favInitialAlleles) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }
                    }

                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
                        {
                            x: generationData.bins,
                            y: generationData.deleterious,
                            type: 'scatter',
                            name: 'Deleterious',
                            line: {
                                color: 'rgb(200, 0, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.favorable,
                            type: 'scatter',
                            name: 'Favorable',
                            line: {
                                color: 'rgb(0, 200, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 200, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.neutral,
                            type: 'scatter',
                            name: 'Neutral',
                            line: {
                                color: 'rgb(0, 0, 200)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 0, 200, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.delInitialAlleles,
                            type: 'scatter',
                            name: 'Deleterious Initial',
                            line: {
                                color: 'rgb(237, 158, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(237, 158, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.favInitialAlleles,
                            type: 'scatter',
                            name: 'Favorable Initial',
                            line: {
                                color: 'rgb(200, 0, 200)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 200, 0.5)',
                        },
                    ];

                    const layout = {
                        title: 'SNP Frequencies',
                        xaxis: {
                            title: 'SNP Frequencies',
                        },
                        yaxis: {
                            title: 'Number of Alleles',
                            range: [0, maxY],
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);

                    this.setState({
                        data: responseJson,
                        currentIndex: responseJson.length - 1,
                    });
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'snp-frequencies' }),
                React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                    React.createElement('div', { className: 'plots-view__slider' },
                        React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'),
                        React.createElement('div', { className: 'plots-view__slider-number' },
                            this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation
                        ),
                        React.createElement('input', {
                            className: 'plots-view__slider-input',
                            type: 'range',
                            max: this.state.data.length - 1,
                            value: this.state.currentIndex,
                            onChange: this.sliderInputChange,
                        }),
                    ),
                ),
            );
        }
    }

    class MinorAlleleFrequencies extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.fetchController = new AbortController();
            this.plotElement = null;

            this.state = {
                data: [],
                currentIndex : 0,
            };
        }

        resizePlot() {
            Plotly.Plots.resize(this.plotElement);
        }

        sliderInputChange(e) {
            const newIndex = parseInt(e.target.value);

            if (newIndex < this.state.data.length) {
                Plotly.restyle(this.plotElement, {
                    y: [
                        this.state.data[newIndex].deleterious,
                        this.state.data[newIndex].favorable,
                        this.state.data[newIndex].neutral,
                        this.state.data[newIndex].delInitialAlleles,
                        this.state.data[newIndex].favInitialAlleles,
                    ],
                }, [0, 1, 2, 3, 4]);
            }

            this.setState({
                currentIndex: newIndex,
            });
        }

        componentDidMount() {
            this.fetchController = new AbortController();

            fetch('/api/plot-minor-allele-frequencies/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
                signal: this.fetchController.signal,
            }).then(response => {
                response.json().then(responseJson => {
                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
                        {
                            x: generationData.bins,
                            y: generationData.deleterious,
                            type: 'scatter',
                            name: 'Deleterious',
                            line: {
                                color: 'rgb(200, 0, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.favorable,
                            type: 'scatter',
                            name: 'Favorable',
                            line: {
                                color: 'rgb(0, 200, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 200, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.neutral,
                            type: 'scatter',
                            name: 'Neutral',
                            line: {
                                color: 'rgb(0, 0, 200)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0, 0, 200, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.delInitialAlleles,
                            type: 'scatter',
                            name: 'Deleterious Initial',
                            line: {
                                color: 'rgb(237, 158, 0)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(237, 158, 0, 0.5)',
                        },
                        {
                            x: generationData.bins,
                            y: generationData.favInitialAlleles,
                            type: 'scatter',
                            name: 'Favorable Initial',
                            line: {
                                color: 'rgb(200, 0, 200)',
                                shape: 'hvh',
                            },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(200, 0, 200, 0.5)',
                        },
                    ];

                    const layout = {
                        title: 'SNP Frequencies',
                        xaxis: {
                            title: 'SNP Frequencies',
                        },
                        yaxis: {
                            title: 'Number of Alleles',
                            range: [0, 1],
                        },
                    };

                    Plotly.newPlot(this.plotElement, data, layout);

                    this.setState({
                        data: responseJson,
                        currentIndex: responseJson.length - 1,
                    });
                });
            });

            window.addEventListener('resize', this.resizePlot);
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'minor-allele-frequencies' }),
                React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                    React.createElement('div', { className: 'plots-view__slider' },
                        React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'),
                        React.createElement('div', { className: 'plots-view__slider-number' },
                            this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation
                        ),
                        React.createElement('input', {
                            className: 'plots-view__slider-input',
                            type: 'range',
                            max: this.state.data.length - 1,
                            value: this.state.currentIndex,
                            onChange: this.sliderInputChange,
                        }),
                    ),
                ),
            );
        }
    }

    function mapStateToProps$2(state) {
        return {
            route: state.route,
        };
    }

    function getView(route) {
        const jobDetailMatch = route.match(new RegExp('^/job-detail/(\\w+)/$'));
        const editUserMatch = route.match(new RegExp('^/edit-user/(\\w+)/$'));
        const plotMatch = route.match(new RegExp('^/plots/(\\w+)/([\\w-]+)/$'));

        if (route === '/') {
            return React.createElement(NewJob, null);
        } else if (route === '/login/') {
            return React.createElement(Login, null);
        } else if (route === '/job-listing/') {
            return React.createElement(JobListing, null);
        } else if (route === '/user-listing/') {
            return React.createElement(UserListing, null);
        } else if (route === '/create-user/') {
            return React.createElement(CreateUser, null);
        } else if (editUserMatch) {
            return React.createElement(EditUser, {
                userId: editUserMatch[1],
            });
        } else if (jobDetailMatch) {
            return React.createElement(JobDetail, {
                jobId: jobDetailMatch[1],
            });
        } else if (plotMatch) {
            const jobId = plotMatch[1];

            if (plotMatch[2] === 'average-mutations') {
                return React.createElement(AverageMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'fitness-history') {
                return React.createElement(FitnessHistory, { jobId: jobId });
            } else if (plotMatch[2] === 'deleterious-mutations') {
                return React.createElement(DeleteriousMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'beneficial-mutations') {
                return React.createElement(BeneficialMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'snp-frequencies') {
                return React.createElement(SnpFrequencies, { jobId: jobId });
            } else if (plotMatch[2] === 'minor-allele-frequencies') {
                return React.createElement(MinorAlleleFrequencies, { jobId: jobId });
            }
        } else {
            return null;
        }
    }

    function Component$9(props) {
        return React.createElement('div', { className: 'page-content' },
            getView(props.route),
        );
    }

    const Content = ReactRedux.connect(mapStateToProps$2)(Component$9);

    function mapStateToProps$3(state) {
        return {
            route: state.route,
        };
    }

    function mapDispatchToProps$9(dispatch) {
        return {
            fetchCurrentUser: () => {
                fetchGetSmart(
                    '/api/get-current-user/',
                    dispatch,
                    response => {
                        dispatch({
                            type: 'USER',
                            value: response,
                        });
                    }
                );
            },
        };
    }

    class Component$a extends React.Component {
        componentDidMount() {
            this.props.fetchCurrentUser();
        }

        render() {
            return React.createElement('div', null,
                (this.props.route == '/login/' ? null : React.createElement('div', { className: 'page-header__spacer' })),
                (this.props.route == '/login/' ? null : React.createElement(Header, null)),
                React.createElement(Content, null),
            );
        }
    }

    const Root = ReactRedux.connect(mapStateToProps$3, mapDispatchToProps$9)(Component$a);

    function init() {
        const store = Redux.createStore(reducer);

        const root = React.createElement(ReactRedux.Provider, { store: store },
            React.createElement(Root, null),
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
