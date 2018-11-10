(function (immer,React,ReactRedux,moment,Plotly,Redux,ReactDOM) {
    'use strict';

    var immer__default = 'default' in immer ? immer['default'] : immer;
    moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;

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
                return immer__default(state, function (draft) {
                    draft.user = action.value;
                });
            case 'LOGIN':
                return immer__default(state, function (draft) {
                    draft.route = '/';
                    draft.user = action.user;
                });
            case 'LOGOUT':
                return immer__default(state, function (draft) {
                    draft.route = '/login/';
                    draft.user = null;
                });
            case 'ROUTE':
                return immer__default(state, function (draft) {
                    draft.route = action.value;
                });
            case 'LOADING_INDICATOR_INCREMENT':
                return immer__default(state, function (draft) {
                    draft.loading_indicator_count += 1;
                });
            case 'LOADING_INDICATOR_DECREMENT':
                return immer__default(state, function (draft) {
                    draft.loading_indicator_count = Math.max(draft.loading_indicator_count - 1, 0);
                });
            case 'user_listing.USERS':
                return immer__default(state, function (draft) {
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
        history.pushState(null, '', url);
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
    function assertNotNull(obj) {
        if (obj === null) {
            throw new Error('Non-null assertion failed');
        }
        else {
            return obj;
        }
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

    function paramsToString(params) {
        var paramStrings = [];
        for (var _i = 0, _a = Object.keys(params); _i < _a.length; _i++) {
            var key = _a[_i];
            var value = params[key];
            paramStrings.push(key + '=' + encodeURIComponent(value));
        }
        return paramStrings.join('&');
    }
    function apiGet(url, params, dispatch, signal) {
        loadingIndicatorIncrement(dispatch);
        return new Promise(function (resolve, reject) {
            fetch(url + '?' + paramsToString(params), {
                credentials: 'same-origin',
                signal: signal,
            }).then(function (response) {
                loadingIndicatorDecrement(dispatch);
                if (response.status === 401) {
                    setRoute(dispatch, '/login/');
                    reject();
                    return;
                }
                response.json().then(function (responseJson) {
                    resolve(responseJson);
                });
            }).catch(function (err) {
                loadingIndicatorDecrement(dispatch);
                console.error(err);
                reject(err);
            });
        });
    }
    function apiPost(url, body, dispatch) {
        loadingIndicatorIncrement(dispatch);
        return new Promise(function (resolve, reject) {
            fetchPost(url, body).then(function (response) {
                loadingIndicatorDecrement(dispatch);
                if (response.status === 401) {
                    setRoute(dispatch, '/login/');
                    reject();
                    return;
                }
                response.json().then(function (responseJson) {
                    resolve(responseJson);
                });
            }).catch(function (err) {
                loadingIndicatorDecrement(dispatch);
                console.error(err);
                reject(err);
            });
        });
    }

    var __extends = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component = (function (_super) {
        __extends(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.state = {
                username: '',
                password: '',
                submitting: false,
                wrongCredentials: false,
            };
            _this.onPasswordChange = _this.onPasswordChange.bind(_this);
            _this.onUsernameChange = _this.onUsernameChange.bind(_this);
            _this.onSubmit = _this.onSubmit.bind(_this);
            return _this;
        }
        Component.prototype.onPasswordChange = function (e) {
            var value = e.currentTarget.value;
            this.setState(function (prevState) { return (Object.assign({}, prevState, {
                password: value,
            })); });
        };
        Component.prototype.onUsernameChange = function (e) {
            var value = e.currentTarget.value;
            this.setState(function (prevState) { return (Object.assign({}, prevState, {
                username: value,
            })); });
        };
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            if (this.state.submitting)
                return;
            this.setState({
                submitting: true,
            });
            apiPost('/api/login/', {
                username: this.state.username,
                password: this.state.password,
            }, this.props.dispatch).then(function (response) {
                if (response.status === 'success') {
                    _this.props.dispatch({
                        type: 'LOGIN',
                        user: response.user,
                    });
                    history.pushState(null, '', '/');
                }
                else if (response.status === 'wrong_credentials') {
                    _this.setState({
                        username: '',
                        password: '',
                        submitting: false,
                        wrongCredentials: true,
                    });
                }
            });
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'login-view' }, React.createElement('div', { className: 'login-view__title' }, 'Login'), React.createElement('form', { className: 'login-view__form', onSubmit: this.onSubmit }, React.createElement('input', {
                className: 'login-view__input',
                type: 'text',
                placeholder: 'Username',
                value: this.state.username,
                required: true,
                onChange: this.onUsernameChange,
            }), React.createElement('input', {
                className: 'login-view__password login-view__input',
                type: 'password',
                placeholder: 'Password',
                value: this.state.password,
                required: true,
                onChange: this.onPasswordChange,
            }), (this.state.wrongCredentials ?
                React.createElement('div', { className: 'login-view__form-error' }, 'Incorrect credentials') :
                null), React.createElement('button', {
                className: 'login-view__submit button' + (this.state.submitting ? ' login-view--submitting' : ''),
                type: 'submit',
            }, React.createElement('span', { className: 'login-view__submit-text' }, 'Login'))));
        };
        return Component;
    }(React.Component));
    var Login = ReactRedux.connect()(Component);

    var __extends$1 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var AccountIcon = (function (_super) {
        __extends$1(AccountIcon, _super);
        function AccountIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AccountIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' }));
        };
        return AccountIcon;
    }(React.PureComponent));

    var __extends$2 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function mapStateToProps(state) {
        return {
            user: state.user,
            route: state.route,
            loading: state.loading_indicator_count !== 0,
        };
    }
    function mapDispatchToProps(dispatch) {
        return {
            onNewJobTabClick: function () { return setRoute(dispatch, '/'); },
            onJobsTabClick: function () { return setRoute(dispatch, '/job-listing/'); },
            onUsersTabClick: function () { return setRoute(dispatch, '/user-listing/'); },
            onMyAccountClick: function () { return setRoute(dispatch, '/my-account/'); },
            onLogoutClick: function () {
                apiPost('/api/logout/', {}, dispatch).then(function () {
                    dispatch({
                        type: 'LOGOUT',
                    });
                    history.pushState(null, '', '/login/');
                });
            },
        };
    }
    var Component$1 = (function (_super) {
        __extends$2(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.menuButtonElement = React.createRef();
            _this.state = {
                menuOpen: false,
            };
            _this.onDocumentClick = _this.onDocumentClick.bind(_this);
            return _this;
        }
        Component.prototype.onDocumentClick = function (e) {
            if (this.state.menuOpen) {
                this.setState({
                    menuOpen: false,
                });
            }
            else {
                var target = e.target;
                if (this.menuButtonElement.current && this.menuButtonElement.current.contains(target)) {
                    this.setState({
                        menuOpen: true,
                    });
                }
            }
        };
        Component.prototype.componentDidMount = function () {
            document.addEventListener('click', this.onDocumentClick);
        };
        Component.prototype.componentWillUnmount = function () {
            document.removeEventListener('click', this.onDocumentClick);
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'page-header' }, React.createElement('div', { className: 'page-header__tabs' }, React.createElement('div', {
                className: 'page-header__tab ' + (this.props.route === '/' ? 'page-header--active-tab' : ''),
                onClick: this.props.onNewJobTabClick,
            }, 'New Job'), React.createElement('div', {
                className: 'page-header__tab ' + (this.props.route === '/job-listing/' ? 'page-header--active-tab' : ''),
                onClick: this.props.onJobsTabClick,
            }, 'Jobs'), (this.props.user && this.props.user.is_admin ?
                React.createElement('div', {
                    className: 'page-header__tab ' + (this.props.route === '/user-listing/' ? 'page-header--active-tab' : ''),
                    onClick: this.props.onUsersTabClick,
                }, 'Users') :
                null)), (this.props.loading ?
                React.createElement('div', { className: 'page-header__loading-indicator' }) :
                null), (this.props.user ?
                React.createElement('div', {
                    className: 'page-header__account-menu-button',
                    ref: this.menuButtonElement,
                }, React.createElement(AccountIcon, { width: 24, height: 24 })) :
                null), (this.props.user ?
                React.createElement('div', {
                    className: 'page-header__account-menu ' + (this.state.menuOpen ? 'page-header--account-menu-open' : ''),
                }, React.createElement('div', {
                    className: 'page-header__account-menu-item',
                    onClick: this.props.onMyAccountClick,
                }, 'My Account'), React.createElement('div', {
                    className: 'page-header__account-menu-item',
                    onClick: this.props.onLogoutClick,
                }, 'Logout')) :
                null));
        };
        return Component;
    }(React.Component));
    var Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component$1);

    var __extends$3 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var CheckboxCheckedIcon = (function (_super) {
        __extends$3(CheckboxCheckedIcon, _super);
        function CheckboxCheckedIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CheckboxCheckedIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }));
        };
        return CheckboxCheckedIcon;
    }(React.PureComponent));

    var __extends$4 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var CheckboxUncheckedIcon = (function (_super) {
        __extends$4(CheckboxUncheckedIcon, _super);
        function CheckboxUncheckedIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CheckboxUncheckedIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' }));
        };
        return CheckboxUncheckedIcon;
    }(React.PureComponent));

    var __extends$5 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Checkbox = (function (_super) {
        __extends$5(Checkbox, _super);
        function Checkbox(props) {
            var _this = _super.call(this, props) || this;
            _this.onClick = _this.onClick.bind(_this);
            return _this;
        }
        Checkbox.prototype.onClick = function () {
            this.props.onChange(!this.props.checked);
        };
        Checkbox.prototype.render = function () {
            return React.createElement('div', {
                className: 'checkbox ' + (this.props.checked ? 'checkbox--checked' : ''),
                onClick: this.onClick,
            }, (this.props.checked ?
                React.createElement(CheckboxCheckedIcon, { width: 24, height: 24 }) :
                React.createElement(CheckboxUncheckedIcon, { width: 24, height: 24 })));
        };
        return Checkbox;
    }(React.PureComponent));

    var __extends$6 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$2 = (function (_super) {
        __extends$6(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.fieldChangeHandlers = {
                title: function (e) { return _this.simpleFieldChanged('title', e); },
                pop_size: function (e) { return _this.simpleFieldChanged('pop_size', e); },
                num_generations: function (e) { return _this.simpleFieldChanged('num_generations', e); },
                mutn_rate: function (e) { return _this.simpleFieldChanged('mutn_rate', e); },
                fitness_effect_model: function (e) { return _this.simpleFieldChanged('fitness_effect_model', e); },
                uniform_fitness_effect_del: function (e) { return _this.simpleFieldChanged('uniform_fitness_effect_del', e); },
                uniform_fitness_effect_fav: function (e) { return _this.simpleFieldChanged('uniform_fitness_effect_fav', e); },
                files_to_output_fit: function (checked) { return _this.checkboxFieldChanged('files_to_output_fit', checked); },
                files_to_output_hst: function (checked) { return _this.checkboxFieldChanged('files_to_output_hst', checked); },
                files_to_output_allele_bins: function (checked) { return _this.checkboxFieldChanged('files_to_output_allele_bins', checked); },
            };
            _this.onSubmit = _this.onSubmit.bind(_this);
            _this.state = {
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
            return _this;
        }
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            var data = {
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
                    'files_to_output = ' + tomlString(filesToOutputString(this.state.fieldValues.files_to_output_fit, this.state.fieldValues.files_to_output_hst, this.state.fieldValues.files_to_output_allele_bins)),
                ].join('\n'),
            };
            apiPost('/api/create-job/', data, this.props.dispatch).then(function (response) {
                setRoute(_this.props.dispatch, '/job-detail/' + response.job_id + '/');
            });
        };
        Component.prototype.simpleFieldChanged = function (id, e) {
            var value = e.currentTarget.value;
            this.setState(function (prevState) {
                var newFieldValues = Object.assign({}, prevState.fieldValues);
                newFieldValues[id] = value;
                return Object.assign({}, prevState, {
                    fieldValues: newFieldValues,
                });
            });
        };
        Component.prototype.checkboxFieldChanged = function (id, checked) {
            this.setState(function (prevState) {
                var newFieldValues = Object.assign({}, prevState.fieldValues);
                newFieldValues[id] = checked;
                return Object.assign({}, prevState, {
                    fieldValues: newFieldValues,
                });
            });
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'new-job-view' }, React.createElement('div', { className: 'new-job-view__loading' }), React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit }, React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Metadata'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Job title'), React.createElement('input', {
                type: 'text',
                value: this.state.fieldValues.title,
                onChange: this.fieldChangeHandlers.title,
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Basic'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Population size (initial or fixed)'), React.createElement('input', {
                type: 'number',
                min: '2',
                max: '1000000',
                step: '1',
                value: this.state.fieldValues.pop_size,
                onChange: this.fieldChangeHandlers.pop_size,
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Generations'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1000000',
                step: '1',
                value: this.state.fieldValues.num_generations,
                onChange: this.fieldChangeHandlers.num_generations,
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Mutations'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Total mutation rate (per individual per generation)'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1000',
                step: 'any',
                value: this.state.fieldValues.mutn_rate,
                onChange: this.fieldChangeHandlers.mutn_rate,
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Fitness effect model'), React.createElement('select', {
                value: this.state.fieldValues.fitness_effect_model,
                onChange: this.fieldChangeHandlers.fitness_effect_model,
            }, React.createElement('option', { value: 'fixed' }, 'Fixed'), React.createElement('option', { value: 'uniform' }, 'Uniform'), React.createElement('option', { value: 'weibull' }, 'Weibull (default)'))), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For fixed: effect for each deleterious mutation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '0.1',
                step: 'any',
                disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                value: this.state.fieldValues.uniform_fitness_effect_del,
                onChange: this.fieldChangeHandlers.uniform_fitness_effect_del,
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For fixed: effect for each beneficial mutation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '0.1',
                step: 'any',
                disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                value: this.state.fieldValues.uniform_fitness_effect_fav,
                onChange: this.fieldChangeHandlers.uniform_fitness_effect_fav,
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Output Files'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'mendel.fit'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_fit,
                onChange: this.fieldChangeHandlers.files_to_output_fit,
            }))), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'mendel.hst'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_hst,
                onChange: this.fieldChangeHandlers.files_to_output_hst,
            }))), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Allele bin and distribution files'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_allele_bins,
                onChange: this.fieldChangeHandlers.files_to_output_allele_bins,
            }))), React.createElement('input', { className: 'button', type: 'submit', value: 'Submit' })));
        };
        return Component;
    }(React.Component));
    function filesToOutputString(fit, hst, alleles) {
        if (fit && hst && alleles) {
            return '*';
        }
        else {
            var outputFiles = [];
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
    function tomlInt(s) {
        return parseInt(s).toString();
    }
    function tomlFloat(s) {
        if (s.includes('.')) {
            return s;
        }
        else {
            return s + '.0';
        }
    }
    function tomlString(s) {
        return '"' + s + '"';
    }
    var NewJob = ReactRedux.connect()(Component$2);

    var __extends$7 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$3 = (function (_super) {
        __extends$7(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.onFilterChanged = _this.onFilterChanged.bind(_this);
            _this.fetchController = new AbortController();
            _this.state = {
                jobs: [],
                all: false,
            };
            return _this;
        }
        Component.prototype.onClick = function (jobId) {
            setRoute(this.props.dispatch, '/job-detail/' + jobId + '/');
        };
        Component.prototype.onFilterChanged = function (e) {
            var value = e.currentTarget.value;
            var all = value === 'all';
            this.fetchJobs(all);
            this.setState({
                all: all,
            });
        };
        Component.prototype.fetchJobs = function (all) {
            var _this = this;
            this.fetchController.abort();
            this.fetchController = new AbortController();
            apiGet('/api/job-list/', { filter: all ? 'all' : 'mine' }, this.props.dispatch, this.fetchController.signal).then(function (response) {
                _this.setState({
                    jobs: response.jobs,
                });
            });
        };
        Component.prototype.componentDidMount = function () {
            this.fetchJobs(this.state.all);
        };
        Component.prototype.componentWillUnmount = function () {
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            var _this = this;
            return React.createElement('div', { className: 'job-listing-view' }, React.createElement('div', { className: 'job-listing-view__title' }, 'Jobs'), React.createElement('select', {
                className: 'job-listing-view__filter',
                value: this.state.all ? 'all' : 'mine',
                onChange: this.onFilterChanged,
            }, React.createElement('option', { value: 'mine' }, 'My Jobs'), React.createElement('option', { value: 'all' }, 'All Jobs')), React.createElement('div', { className: 'job-listing-view__jobs' }, React.createElement('div', { className: 'job-listing-view__labels' }, React.createElement('div', { className: 'job-listing-view__labels__title' }, 'Title'), React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'), React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status')), this.state.jobs.map(function (job) { return (React.createElement('div', {
                className: 'job-listing-view__job',
                key: job.id,
                onClick: function () { return _this.onClick(job.id); },
            }, React.createElement('div', { className: 'job-listing-view__job__title' }, job.title), React.createElement('div', { className: 'job-listing-view__job__time' }, moment(job.time).fromNow()), React.createElement('div', { className: 'job-listing-view__job__status' }, capitalizeFirstLetter(job.status)))); })));
        };
        return Component;
    }(React.Component));
    function capitalizeFirstLetter(s) {
        return s[0].toUpperCase() + s.substring(1);
    }
    var JobListing = ReactRedux.connect()(Component$3);

    var __extends$8 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var DeleteIcon = (function (_super) {
        __extends$8(DeleteIcon, _super);
        function DeleteIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DeleteIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' }));
        };
        return DeleteIcon;
    }(React.PureComponent));

    var rootElement = null;
    function open(title, description, actionCallback) {
        if (rootElement !== null) {
            close();
        }
        var cancelButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Cancel')]);
        var actionButton = createElement('div', 'confirmation-dialog__button', [document.createTextNode('Ok')]);
        var overlay = createElement('div', 'confirmation-dialog__overlay', []);
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
        actionButton.addEventListener('click', function () {
            close();
            actionCallback();
        });
        document.body.appendChild(assertNotNull(rootElement));
    }
    function close() {
        if (rootElement === null)
            return;
        assertNotNull(rootElement.parentNode).removeChild(rootElement);
        rootElement = null;
    }
    function createElement(tagName, className, children) {
        var element = document.createElement(tagName);
        element.className = className;
        for (var i = 0; i < children.length; ++i) {
            element.appendChild(children[i]);
        }
        return element;
    }

    var __extends$9 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function mapStateToProps$1(state) {
        return {
            users: state.user_listing.users,
        };
    }
    function mapDispatchToProps$1(dispatch) {
        function fetchUsers() {
            apiGet('/api/user-list/', {}, dispatch).then(function (response) {
                dispatch({
                    type: 'user_listing.USERS',
                    value: response.users,
                });
            });
        }
        return {
            setRoute: function (url) { return setRoute(dispatch, url); },
            onCreateClick: function () { return setRoute(dispatch, '/create-user/'); },
            fetchUsers: fetchUsers,
            onDeleteClick: function (userId) {
                open('Delete user?', 'The user will be deleted, but jobs run by the user will be kept.', function () {
                    apiPost('/api/delete-user/', {
                        id: userId,
                    }, dispatch).then(fetchUsers);
                });
            },
        };
    }
    var Component$4 = (function (_super) {
        __extends$9(Component, _super);
        function Component() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Component.prototype.componentDidMount = function () {
            this.props.fetchUsers();
        };
        Component.prototype.render = function () {
            var _this = this;
            return React.createElement('div', { className: 'user-listing-view' }, React.createElement('div', { className: 'user-listing-view__title' }, 'Users'), React.createElement('div', {
                className: 'user-listing-view__create-button button',
                onClick: this.props.onCreateClick,
            }, 'Create User'), React.createElement('div', { className: 'user-listing-view__users' }, this.props.users.map(function (user) { return (React.createElement('div', { className: 'user-listing-view__user', key: user.id }, React.createElement('div', {
                className: 'user-listing-view__user__title',
                onClick: function () { return _this.props.setRoute('/edit-user/' + user.id + '/'); },
            }, React.createElement('div', { className: 'user-listing-view__user__username' }, user.username), (user.is_admin ? React.createElement('div', { className: 'user-listing-view__user__admin' }, 'Admin') : null)), React.createElement('div', {
                className: 'user-listing-view__user__delete-button',
                onClick: function () { return _this.props.onDeleteClick(user.id); },
            }, React.createElement(DeleteIcon, { width: 24, height: 24 })))); })));
        };
        return Component;
    }(React.Component));
    var UserListing = ReactRedux.connect(mapStateToProps$1, mapDispatchToProps$1)(Component$4);

    var __extends$a = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$5 = (function (_super) {
        __extends$a(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.mounted = false;
            _this.submitting = false;
            _this.onUsernameChange = _this.onUsernameChange.bind(_this);
            _this.onPasswordChange = _this.onPasswordChange.bind(_this);
            _this.onConfirmPasswordChange = _this.onConfirmPasswordChange.bind(_this);
            _this.onIsAdminChange = _this.onIsAdminChange.bind(_this);
            _this.onSubmit = _this.onSubmit.bind(_this);
            _this.state = {
                username: '',
                password: '',
                confirmPassword: '',
                isAdmin: false,
                usernameExists: false,
            };
            return _this;
        }
        Component.prototype.setRoute = function (url) {
            setRoute(this.props.dispatch, url);
        };
        Component.prototype.onUsernameChange = function (e) {
            this.setState({
                username: e.currentTarget.value,
                usernameExists: false,
            });
        };
        Component.prototype.onPasswordChange = function (e) {
            this.setState({
                password: e.currentTarget.value,
            });
        };
        Component.prototype.onConfirmPasswordChange = function (e) {
            this.setState({
                confirmPassword: e.currentTarget.value,
            });
        };
        Component.prototype.onIsAdminChange = function () {
            this.setState(function (prevState) { return ({
                isAdmin: !prevState.isAdmin,
            }); });
        };
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            if (this.submitting)
                return;
            if (this.state.confirmPassword !== this.state.password)
                return;
            this.submitting = true;
            apiPost('/api/create-edit-user/', {
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            }, this.props.dispatch).then(function (response) {
                if (!_this.mounted)
                    return;
                if (response.status === 'username_exists') {
                    _this.submitting = false;
                    _this.setState({
                        usernameExists: true,
                    });
                }
                else {
                    _this.setRoute('/user-listing/');
                }
            });
        };
        Component.prototype.componentDidMount = function () {
            this.mounted = true;
        };
        Component.prototype.componentWillUnmount = function () {
            this.mounted = false;
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'create-edit-user-view' }, React.createElement('div', { className: 'create-edit-user-view__title' }, 'Create User'), React.createElement('form', { className: 'create-edit-user-view__form', onSubmit: this.onSubmit }, React.createElement('label', null, 'Username'), React.createElement('input', {
                type: 'text',
                required: true,
                value: this.state.username,
                onChange: this.onUsernameChange,
            }), (this.state.usernameExists ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Username is already taken') :
                null), React.createElement('label', null, 'Password'), React.createElement('input', {
                type: 'password',
                required: true,
                value: this.state.password,
                onChange: this.onPasswordChange,
            }), React.createElement('label', null, 'Confirm Password'), React.createElement('input', {
                type: 'password',
                required: true,
                value: this.state.confirmPassword,
                onChange: this.onConfirmPasswordChange,
            }), (this.state.confirmPassword !== this.state.password ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Does not match password') :
                null), React.createElement('div', { className: 'create-edit-user-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.isAdmin,
                onChange: this.onIsAdminChange,
            }), React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin')), React.createElement('input', {
                className: 'button',
                type: 'submit',
                value: 'Create',
            })));
        };
        return Component;
    }(React.Component));
    var CreateUser = ReactRedux.connect(null, null)(Component$5);

    var __extends$b = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$6 = (function (_super) {
        __extends$b(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.fetchController = new AbortController();
            _this.onUsernameChange = _this.onUsernameChange.bind(_this);
            _this.onPasswordChange = _this.onPasswordChange.bind(_this);
            _this.onConfirmPasswordChange = _this.onConfirmPasswordChange.bind(_this);
            _this.onIsAdminChange = _this.onIsAdminChange.bind(_this);
            _this.onSubmit = _this.onSubmit.bind(_this);
            _this.state = {
                username: '',
                password: '',
                confirmPassword: '',
                isAdmin: false,
                submitting: false,
                usernameExists: false,
            };
            return _this;
        }
        Component.prototype.onUsernameChange = function (e) {
            this.setState({
                username: e.currentTarget.value,
                usernameExists: false,
            });
        };
        Component.prototype.onPasswordChange = function (e) {
            this.setState({
                password: e.currentTarget.value,
            });
        };
        Component.prototype.onConfirmPasswordChange = function (e) {
            this.setState({
                confirmPassword: e.currentTarget.value,
            });
        };
        Component.prototype.onIsAdminChange = function () {
            this.setState(function (prevState) { return ({
                isAdmin: !prevState.isAdmin,
            }); });
        };
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            if (this.state.submitting)
                return;
            if (this.state.confirmPassword !== this.state.password)
                return;
            this.setState({
                submitting: true,
            });
            apiPost('/api/create-edit-user/', {
                id: this.props.userId,
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            }, this.props.dispatch).then(function (response) {
                if (response.status === 'username_exists') {
                    _this.setState({
                        usernameExists: true,
                        submitting: false,
                    });
                }
                else {
                    setRoute(_this.props.dispatch, '/user-listing/');
                }
            });
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController.abort();
            this.fetchController = new AbortController();
            apiGet('/api/get-user/', { userId: this.props.userId }, this.props.dispatch, this.fetchController.signal).then(function (response) {
                _this.setState({
                    username: response.username,
                    isAdmin: response.is_admin,
                });
            });
        };
        Component.prototype.componentWillUnmount = function () {
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'create-edit-user-view' }, React.createElement('div', { className: 'create-edit-user-view__title' }, 'Edit User'), React.createElement('form', { className: 'create-edit-user-view__form', onSubmit: this.onSubmit }, React.createElement('label', null, 'Username'), React.createElement('input', {
                type: 'text',
                required: true,
                value: this.state.username,
                onChange: this.onUsernameChange,
            }), (this.state.usernameExists ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Username is already taken') :
                null), React.createElement('label', null, 'Password'), React.createElement('input', {
                type: 'password',
                value: this.state.password,
                onChange: this.onPasswordChange,
            }), React.createElement('label', null, 'Confirm Password'), React.createElement('input', {
                type: 'password',
                value: this.state.confirmPassword,
                onChange: this.onConfirmPasswordChange,
            }), (this.state.confirmPassword !== this.state.password ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Does not match password') :
                null), React.createElement('div', { className: 'create-edit-user-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.isAdmin,
                onChange: this.onIsAdminChange,
            }), React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin')), React.createElement('input', {
                className: 'button',
                type: 'submit',
                value: this.state.submitting ? 'Processing…' : 'Save',
            })));
        };
        return Component;
    }(React.Component));
    var EditUser = ReactRedux.connect()(Component$6);

    var rootElement$1 = null;
    var timeout = 0;
    function show(message) {
        if (rootElement$1 === null) {
            rootElement$1 = document.createElement('div');
            rootElement$1.className = 'snackbar';
            document.body.appendChild(rootElement$1);
        }
        clearTimeout(timeout);
        rootElement$1.offsetWidth;
        rootElement$1.textContent = message;
        rootElement$1.classList.add('snackbar--show');
        timeout = setTimeout(function () {
            assertNotNull(rootElement$1).classList.remove('snackbar--show');
        }, 5000);
    }

    var __extends$c = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function mapStateToProps$2(state) {
        return {
            user: state.user,
        };
    }
    var Component$7 = (function (_super) {
        __extends$c(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.mounted = false;
            _this.submitting = false;
            _this.onUsernameChange = _this.onUsernameChange.bind(_this);
            _this.onPasswordChange = _this.onPasswordChange.bind(_this);
            _this.onConfirmPasswordChange = _this.onConfirmPasswordChange.bind(_this);
            _this.onIsAdminChange = _this.onIsAdminChange.bind(_this);
            _this.onSubmit = _this.onSubmit.bind(_this);
            _this.state = {
                username: assertNotNull(_this.props.user).username,
                password: '',
                confirmPassword: '',
                isAdmin: assertNotNull(_this.props.user).is_admin,
                usernameExists: false,
            };
            return _this;
        }
        Component.prototype.onUsernameChange = function (e) {
            this.setState({
                username: e.currentTarget.value,
                usernameExists: false,
            });
        };
        Component.prototype.onPasswordChange = function (e) {
            this.setState({
                password: e.currentTarget.value,
            });
        };
        Component.prototype.onConfirmPasswordChange = function (e) {
            this.setState({
                confirmPassword: e.currentTarget.value,
            });
        };
        Component.prototype.onIsAdminChange = function () {
            this.setState(function (prevState) { return ({
                isAdmin: !prevState.isAdmin,
            }); });
        };
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            if (this.submitting)
                return;
            if (this.state.confirmPassword !== this.state.password)
                return;
            this.submitting = true;
            apiPost('/api/create-edit-user/', {
                id: assertNotNull(this.props.user).id,
                username: this.state.username,
                password: this.state.password,
                is_admin: this.state.isAdmin,
            }, this.props.dispatch).then(function (response) {
                _this.submitting = false;
                if (!_this.mounted)
                    return;
                if (response.status === 'username_exists') {
                    _this.setState({
                        usernameExists: true,
                    });
                }
                else {
                    _this.props.dispatch({
                        type: 'USER',
                        value: {
                            id: assertNotNull(_this.props.user).id,
                            username: _this.state.username,
                            is_admin: _this.state.isAdmin,
                        },
                    });
                    show('Saved');
                }
            });
        };
        Component.prototype.componentDidMount = function () {
            this.mounted = true;
        };
        Component.prototype.componentWillUnmount = function () {
            this.mounted = false;
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'create-edit-user-view' }, React.createElement('div', { className: 'create-edit-user-view__title' }, 'My Account'), React.createElement('form', { className: 'create-edit-user-view__form', onSubmit: this.onSubmit }, React.createElement('label', null, 'Username'), React.createElement('input', {
                type: 'text',
                required: true,
                value: this.state.username,
                onChange: this.onUsernameChange,
            }), (this.state.usernameExists ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Username is already taken') :
                null), React.createElement('label', null, 'Password'), React.createElement('input', {
                type: 'password',
                value: this.state.password,
                onChange: this.onPasswordChange,
            }), React.createElement('label', null, 'Confirm Password'), React.createElement('input', {
                type: 'password',
                value: this.state.confirmPassword,
                onChange: this.onConfirmPasswordChange,
            }), (this.state.confirmPassword !== this.state.password ?
                React.createElement('div', { className: 'create-edit-user-view__error' }, 'Does not match password') :
                null), (assertNotNull(this.props.user).is_admin ?
                React.createElement('div', { className: 'create-edit-user-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                    checked: this.state.isAdmin,
                    onChange: this.onIsAdminChange,
                }), React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin')) : null), React.createElement('input', {
                className: 'button',
                type: 'submit',
                value: 'Save',
            })));
        };
        return Component;
    }(React.Component));
    var MyAccount = ReactRedux.connect(mapStateToProps$2, null)(Component$7);

    var __extends$d = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$8 = (function (_super) {
        __extends$d(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.fetchOutput = _this.fetchOutput.bind(_this);
            _this.fetchController = new AbortController();
            _this.fetchTimeout = undefined;
            _this.outputOffset = 0;
            _this.state = {
                output: '',
                done: false,
            };
            _this.onPlotsClick = _this.onPlotsClick.bind(_this);
            return _this;
        }
        Component.prototype.onPlotsClick = function () {
            setRoute(this.props.dispatch, '/plots/' + this.props.jobId + '/average-mutations/');
        };
        Component.prototype.componentDidMount = function () {
            this.fetchOutput();
        };
        Component.prototype.componentWillUnmount = function () {
            this.fetchController.abort();
            window.clearTimeout(this.fetchTimeout);
        };
        Component.prototype.fetchOutput = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/job-output/', { jobId: this.props.jobId, offset: this.outputOffset.toString() }, this.props.dispatch, this.fetchController.signal).then(function (response) {
                _this.outputOffset += response.output.length;
                _this.setState(function (prevState, props) { return ({
                    output: prevState.output + response.output,
                    done: response.done,
                }); });
                if (!response.done) {
                    _this.fetchTimeout = setTimeout(_this.fetchOutput, 1000);
                }
            });
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'job-detail-view' }, React.createElement('div', { className: 'job-detail-view__title' }, 'Job', React.createElement('span', { className: 'job-detail-view__job-id' }, this.props.jobId)), React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output), React.createElement('div', { className: 'job-detail-view__bottom' }, React.createElement('div', { className: 'job-detail-view__status' }, 'Status: ' + (this.state.done ? 'Done' : 'Running')), (this.state.done ?
                React.createElement('div', {
                    className: 'job-detail-view__plots-button button',
                    onClick: this.onPlotsClick,
                }, 'Plots') :
                null)));
        };
        return Component;
    }(React.Component));
    var JobDetail = ReactRedux.connect()(Component$8);

    var __extends$e = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var LINKS = [
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
    function mapDispatchToProps$2(dispatch, ownProps) {
        return {
            onClick: function (slug) {
                var url = '/plots/' + ownProps.jobId + '/' + slug + '/';
                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, '', url);
            },
        };
    }
    var Component$9 = (function (_super) {
        __extends$e(Component, _super);
        function Component() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Component.prototype.render = function () {
            var _this = this;
            return React.createElement('div', { className: 'plots-view__sidebar' }, LINKS.map(function (link) { return (React.createElement('div', {
                className: 'plots-view__sidebar__item ' + (_this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                onClick: function () { return _this.props.onClick(link.slug); },
                key: link.slug,
            }, link.title)); }));
        };
        return Component;
    }(React.Component));
    var Sidebar = ReactRedux.connect(null, mapDispatchToProps$2)(Component$9);

    var __extends$f = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$a = (function (_super) {
        __extends$f(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-average-mutations/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var data = [
                    {
                        x: response.generations,
                        y: response.deleterious,
                        type: 'scatter',
                        name: 'Deleterious',
                        line: {
                            color: 'rgb(200, 0, 0)',
                        },
                    },
                    {
                        x: response.generations,
                        y: response.neutral,
                        type: 'scatter',
                        name: 'Neutral',
                        line: {
                            color: 'rgb(0, 0, 200)',
                        },
                    },
                    {
                        x: response.generations,
                        y: response.favorable,
                        type: 'scatter',
                        name: 'Favorable',
                        line: {
                            color: 'rgb(0, 200, 0)',
                        },
                    },
                ];
                var layout = {
                    title: 'Average mutations/individual',
                    xaxis: {
                        title: 'Generations',
                    },
                    yaxis: {
                        title: 'Mutations',
                    },
                };
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'average-mutations' }), React.createElement('div', { className: 'plots-view__non-sidebar' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement })));
        };
        return Component;
    }(React.Component));
    var AverageMutations = ReactRedux.connect()(Component$a);

    var __extends$g = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$b = (function (_super) {
        __extends$g(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-fitness-history/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var data = [
                    {
                        x: response.generations,
                        y: response.fitness,
                        type: 'scatter',
                        name: 'Fitness',
                        line: {
                            color: 'rgb(200, 0, 0)',
                        },
                    },
                    {
                        x: response.generations,
                        y: response.pop_size,
                        type: 'scatter',
                        name: 'Population Size',
                        line: {
                            color: 'rgb(0, 0, 200)',
                        },
                        yaxis: 'y2',
                    },
                ];
                var layout = {
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
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'fitness-history' }), React.createElement('div', { className: 'plots-view__non-sidebar' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement })));
        };
        return Component;
    }(React.Component));
    var FitnessHistory = ReactRedux.connect()(Component$b);

    var __extends$h = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$c = (function (_super) {
        __extends$h(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.sliderInputChange = _this.sliderInputChange.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            _this.state = {
                data: [],
                currentIndex: 0,
            };
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.sliderInputChange = function (e) {
            var newIndex = parseInt(e.target.value);
            if (newIndex < this.state.data.length) {
                Plotly.restyle(assertNotNull(this.plotElement.current), {
                    y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
                }, [0, 1]);
            }
            this.setState({
                currentIndex: newIndex,
            });
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-beneficial-mutations/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var maxY = 0;
                for (var _i = 0, response_1 = response; _i < response_1.length; _i++) {
                    var generation = response_1[_i];
                    for (var _a = 0, _b = generation.dominant; _a < _b.length; _a++) {
                        var n = _b[_a];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _c = 0, _d = generation.recessive; _c < _d.length; _c++) {
                        var n = _d[_c];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                }
                var generationData = response[response.length - 1];
                var data = [
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
                var layout = {
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
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
                _this.setState({
                    data: response,
                    currentIndex: response.length - 1,
                });
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'deleterious-mutations' }), React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            }))));
        };
        return Component;
    }(React.Component));
    var DeleteriousMutations = ReactRedux.connect()(Component$c);

    var __extends$i = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$d = (function (_super) {
        __extends$i(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.sliderInputChange = _this.sliderInputChange.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            _this.state = {
                data: [],
                currentIndex: 0,
            };
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.sliderInputChange = function (e) {
            var newIndex = parseInt(e.target.value);
            if (newIndex < this.state.data.length) {
                Plotly.restyle(assertNotNull(this.plotElement.current), {
                    y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
                }, [0, 1]);
            }
            this.setState({
                currentIndex: newIndex,
            });
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-beneficial-mutations/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var maxY = 0;
                for (var _i = 0, response_1 = response; _i < response_1.length; _i++) {
                    var generation = response_1[_i];
                    for (var _a = 0, _b = generation.dominant; _a < _b.length; _a++) {
                        var n = _b[_a];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _c = 0, _d = generation.recessive; _c < _d.length; _c++) {
                        var n = _d[_c];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                }
                var generationData = response[response.length - 1];
                var data = [
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
                var layout = {
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
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
                _this.setState({
                    data: response,
                    currentIndex: response.length - 1,
                });
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'beneficial-mutations' }), React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            }))));
        };
        return Component;
    }(React.Component));
    var BeneficialMutations = ReactRedux.connect()(Component$d);

    var __extends$j = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$e = (function (_super) {
        __extends$j(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.sliderInputChange = _this.sliderInputChange.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            _this.state = {
                data: [],
                currentIndex: 0,
            };
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.sliderInputChange = function (e) {
            var newIndex = parseInt(e.target.value);
            if (newIndex < this.state.data.length) {
                Plotly.restyle(assertNotNull(this.plotElement.current), {
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
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-snp-frequencies/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var maxY = 0;
                for (var _i = 0, response_1 = response; _i < response_1.length; _i++) {
                    var generation = response_1[_i];
                    for (var _a = 0, _b = generation.deleterious; _a < _b.length; _a++) {
                        var n = _b[_a];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _c = 0, _d = generation.favorable; _c < _d.length; _c++) {
                        var n = _d[_c];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _e = 0, _f = generation.neutral; _e < _f.length; _e++) {
                        var n = _f[_e];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _g = 0, _h = generation.delInitialAlleles; _g < _h.length; _g++) {
                        var n = _h[_g];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                    for (var _j = 0, _k = generation.favInitialAlleles; _j < _k.length; _j++) {
                        var n = _k[_j];
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                }
                var generationData = response[response.length - 1];
                var data = [
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
                var layout = {
                    title: 'SNP Frequencies',
                    xaxis: {
                        title: 'SNP Frequencies',
                    },
                    yaxis: {
                        title: 'Number of Alleles',
                        range: [0, maxY],
                    },
                };
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
                _this.setState({
                    data: response,
                    currentIndex: response.length - 1,
                });
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'snp-frequencies' }), React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            }))));
        };
        return Component;
    }(React.Component));
    var SnpFrequencies = ReactRedux.connect()(Component$e);

    var __extends$k = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Component$f = (function (_super) {
        __extends$k(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.resizePlot = _this.resizePlot.bind(_this);
            _this.sliderInputChange = _this.sliderInputChange.bind(_this);
            _this.fetchController = new AbortController();
            _this.plotElement = React.createRef();
            _this.state = {
                data: [],
                currentIndex: 0,
            };
            return _this;
        }
        Component.prototype.resizePlot = function () {
            Plotly.Plots.resize(assertNotNull(this.plotElement.current));
        };
        Component.prototype.sliderInputChange = function (e) {
            var newIndex = parseInt(e.target.value);
            if (newIndex < this.state.data.length) {
                Plotly.restyle(assertNotNull(this.plotElement.current), {
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
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-minor-allele-frequencies/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var generationData = response[response.length - 1];
                var data = [
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
                var layout = {
                    title: 'SNP Frequencies',
                    xaxis: {
                        title: 'SNP Frequencies',
                    },
                    yaxis: {
                        title: 'Number of Alleles',
                        range: [0, 1],
                    },
                };
                Plotly.newPlot(assertNotNull(_this.plotElement.current), data, layout);
                _this.setState({
                    data: response,
                    currentIndex: response.length - 1,
                });
            });
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view' }, React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'minor-allele-frequencies' }), React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            }))));
        };
        return Component;
    }(React.Component));
    var MinorAlleleFrequencies = ReactRedux.connect()(Component$f);

    function mapStateToProps$3(state) {
        return {
            route: state.route,
        };
    }
    function getView(route) {
        var jobDetailMatch = route.match(new RegExp('^/job-detail/(\\w+)/$'));
        var editUserMatch = route.match(new RegExp('^/edit-user/(\\w+)/$'));
        var plotMatch = route.match(new RegExp('^/plots/(\\w+)/([\\w-]+)/$'));
        if (route === '/') {
            return React.createElement(NewJob, null);
        }
        else if (route === '/login/') {
            return React.createElement(Login, null);
        }
        else if (route === '/job-listing/') {
            return React.createElement(JobListing, null);
        }
        else if (route === '/user-listing/') {
            return React.createElement(UserListing, null);
        }
        else if (route === '/create-user/') {
            return React.createElement(CreateUser, null);
        }
        else if (editUserMatch) {
            return React.createElement(EditUser, {
                userId: editUserMatch[1],
            });
        }
        else if (route === '/my-account/') {
            return React.createElement(MyAccount, null);
        }
        else if (jobDetailMatch) {
            return React.createElement(JobDetail, {
                jobId: jobDetailMatch[1],
            });
        }
        else if (plotMatch) {
            var jobId = plotMatch[1];
            if (plotMatch[2] === 'average-mutations') {
                return React.createElement(AverageMutations, { jobId: jobId });
            }
            else if (plotMatch[2] === 'fitness-history') {
                return React.createElement(FitnessHistory, { jobId: jobId });
            }
            else if (plotMatch[2] === 'deleterious-mutations') {
                return React.createElement(DeleteriousMutations, { jobId: jobId });
            }
            else if (plotMatch[2] === 'beneficial-mutations') {
                return React.createElement(BeneficialMutations, { jobId: jobId });
            }
            else if (plotMatch[2] === 'snp-frequencies') {
                return React.createElement(SnpFrequencies, { jobId: jobId });
            }
            else if (plotMatch[2] === 'minor-allele-frequencies') {
                return React.createElement(MinorAlleleFrequencies, { jobId: jobId });
            }
        }
        return null;
    }
    function Component$g(props) {
        return React.createElement('div', { className: 'page-content' }, getView(props.route));
    }
    var Content = ReactRedux.connect(mapStateToProps$3)(Component$g);

    var __extends$l = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function mapStateToProps$4(state) {
        return {
            route: state.route,
        };
    }
    var Component$h = (function (_super) {
        __extends$l(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.state = {
                loaded: false,
            };
            return _this;
        }
        Component.prototype.componentDidMount = function () {
            var _this = this;
            apiGet('/api/get-current-user/', {}, this.props.dispatch).then(function (user) {
                _this.props.dispatch({
                    type: 'USER',
                    value: user,
                });
                _this.setState({
                    loaded: true,
                });
            });
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'non-login' + (!this.state.loaded ? ' non-login--loading' : '') }, (this.state.loaded ?
                React.createElement(React.Fragment, null, React.createElement('div', { className: 'page-header__spacer' }), React.createElement(Header, null), React.createElement(Content, null)) : null));
        };
        return Component;
    }(React.Component));
    var NonLogin = ReactRedux.connect(mapStateToProps$4)(Component$h);

    var __extends$m = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function mapStateToProps$5(state) {
        return {
            route: state.route,
        };
    }
    var Component$i = (function (_super) {
        __extends$m(Component, _super);
        function Component() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Component.prototype.render = function () {
            return React.createElement('div', null, (this.props.route === '/login/' ?
                React.createElement(Login, null) :
                React.createElement(NonLogin, null)));
        };
        return Component;
    }(React.Component));
    var Root = ReactRedux.connect(mapStateToProps$5)(Component$i);

    function init() {
        var store = Redux.createStore(reducer);
        var root = React.createElement(ReactRedux.Provider, { store: store }, React.createElement(Root, null));
        ReactDOM.render(root, document.getElementById('react-root'));
        window.addEventListener('popstate', function () {
            store.dispatch({
                type: 'ROUTE',
                value: location.pathname,
            });
        });
    }
    init();

}(immer,React,ReactRedux,moment,Plotly,Redux,ReactDOM));
