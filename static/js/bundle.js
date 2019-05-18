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
                plots: {
                    files: [],
                    tribes: [],
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
            case 'plots.INFO':
                return immer__default(state, function (draft) {
                    draft.plots = action.plots;
                });
            case 'plots.INFO_AND_ROUTE':
                return immer__default(state, function (draft) {
                    draft.plots = action.plots;
                    draft.route = action.route;
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
    function assertNotUndefined(obj) {
        if (obj === undefined) {
            throw new Error('Non-undefined assertion failed');
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
    var MsgDialog = (function (_super) {
        __extends$2(MsgDialog, _super);
        function MsgDialog() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MsgDialog.prototype.render = function () {
            return React.createElement('div', { className: 'msg-dialog' }, React.createElement('div', { className: 'msg-dialog__overlay', onClick: this.props.onClose }), React.createElement('div', { className: 'msg-dialog__content' }, React.createElement('div', { className: 'msg-dialog__title' }, this.props.title), this.props.descriptions.map(function (desc) { return React.createElement('div', { className: 'msg-dialog__description' }, desc); }), React.createElement('div', { className: 'msg-dialog__buttons' }, React.createElement('div', { className: 'msg-dialog__button', onClick: this.props.onClose }, 'Close'))));
        };
        return MsgDialog;
    }(React.Component));

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
    function mapStateToProps(state) {
        return {
            user: state.user,
            route: state.route,
            loading: state.loading_indicator_count !== 0,
        };
    }
    function mapDispatchToProps(dispatch) {
        return {
            dispatch: dispatch,
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
        __extends$3(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.menuButtonElement = React.createRef();
            _this.state = {
                menuOpen: false,
                aboutOpen: false,
                mendelUiVersion: "",
                mendelGoVersion: "",
            };
            _this.onDocumentClick = _this.onDocumentClick.bind(_this);
            _this.onAboutOpen = _this.onAboutOpen.bind(_this);
            _this.onAboutClose = _this.onAboutClose.bind(_this);
            return _this;
        }
        Component.prototype.onAboutOpen = function () {
            var _this = this;
            apiGet('/api/get-versions/', {}, this.props.dispatch).then(function (resp) {
                _this.setState({
                    aboutOpen: true,
                    mendelUiVersion: resp.mendelUiVersion,
                    mendelGoVersion: resp.mendelGoVersion,
                });
            });
        };
        Component.prototype.onAboutClose = function () {
            this.setState({
                aboutOpen: false,
            });
        };
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
                    onClick: this.onAboutOpen,
                }, 'About'), React.createElement('div', {
                    className: 'page-header__account-menu-item',
                    onClick: this.props.onLogoutClick,
                }, 'Logout')) :
                null), (this.state.aboutOpen ?
                React.createElement(MsgDialog, {
                    title: "About Mendel's Accountant",
                    descriptions: [
                        "Mendel's Accountant is a genetic mutation tracking program used to simulate and study macroevolution in a biologically realistic way. It models genetic change over time by tracking each mutation that enters the simulated population from generation to generation to the end of the simulation. The software models each individual in the population, including their chromosomes, linkage blocks, and deleterious, favorable, and neutral mutations.",
                        'Mendel Web UI Version: ' + this.state.mendelUiVersion,
                        'Mendel Go Version: ' + this.state.mendelGoVersion,
                    ],
                    onClose: this.onAboutClose,
                })
                : null));
        };
        return Component;
    }(React.Component));
    var Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component$1);

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
    var CheckboxCheckedIcon = (function (_super) {
        __extends$4(CheckboxCheckedIcon, _super);
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
    var CheckboxUncheckedIcon = (function (_super) {
        __extends$5(CheckboxUncheckedIcon, _super);
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
    var Checkbox = (function (_super) {
        __extends$6(Checkbox, _super);
        function Checkbox(props) {
            var _this = _super.call(this, props) || this;
            _this.onClick = _this.onClick.bind(_this);
            return _this;
        }
        Checkbox.prototype.onClick = function () {
            if (!this.props.disabled) {
                this.props.onChange(!this.props.checked);
            }
        };
        Checkbox.prototype.render = function () {
            return React.createElement('div', {
                className: [
                    'checkbox',
                    this.props.checked ? 'checkbox--checked' : '',
                    this.props.disabled ? 'checkbox--disabled' : '',
                ].join(' '),
                onClick: this.onClick,
            }, (this.props.checked ?
                React.createElement(CheckboxCheckedIcon, { width: 24, height: 24 }) :
                React.createElement(CheckboxUncheckedIcon, { width: 24, height: 24 })));
        };
        return Checkbox;
    }(React.PureComponent));

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
    var HelpIcon = (function (_super) {
        __extends$7(HelpIcon, _super);
        function HelpIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HelpIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' }));
        };
        return HelpIcon;
    }(React.PureComponent));

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
    var Help = (function (_super) {
        __extends$8(Help, _super);
        function Help(props) {
            var _this = _super.call(this, props) || this;
            _this.buttonRef = React.createRef();
            _this.menuRef = React.createRef();
            _this.state = {
                open: false,
            };
            _this.onButtonClick = _this.onButtonClick.bind(_this);
            _this.onDocumentClick = _this.onDocumentClick.bind(_this);
            return _this;
        }
        Help.prototype.onButtonClick = function (e) {
            this.setState(function (prevState) { return ({
                open: !prevState.open,
            }); });
        };
        Help.prototype.onDocumentClick = function (e) {
            var target = e.target;
            if (this.state.open &&
                !assertNotNull(this.buttonRef.current).contains(target) &&
                !assertNotNull(this.menuRef.current).contains(target)) {
                this.setState({
                    open: false,
                });
            }
        };
        Help.prototype.componentDidMount = function () {
            document.addEventListener('click', this.onDocumentClick);
        };
        Help.prototype.componentWillUnmount = function () {
            document.removeEventListener('click', this.onDocumentClick);
        };
        Help.prototype.render = function () {
            return React.createElement('div', { className: 'new-job-view__help' }, React.createElement('div', { className: 'new-job-view__help-button', ref: this.buttonRef, onClick: this.onButtonClick }, React.createElement(HelpIcon, { width: 24, height: 24 })), (this.state.open ?
                React.createElement('div', { className: 'new-job-view__help-menu', ref: this.menuRef }, React.createElement('div', { className: 'new-job-view__help-menu-title' }, this.props.title), React.createElement('div', { className: 'new-job-view__help-menu-content' }, this.props.content), (this.props.url ?
                    React.createElement('a', { className: 'new-job-view__help-menu-link', href: this.props.url, target: '_blank' }, 'Read More') :
                    null)) :
                null));
        };
        return Help;
    }(React.PureComponent));

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
    var HELP_URL_PREFIX = 'http://ec2-52-43-51-28.us-west-2.compute.amazonaws.com:8580/static/apps/mendel/help.html#';
    var Component$2 = (function (_super) {
        __extends$9(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.fieldChangeHandlers = {
                description: function (e) { return _this.simpleFieldChanged('description', e); },
                pop_size: function (e) { return _this.simpleFieldChanged('pop_size', e); },
                num_generations: function (e) { return _this.simpleFieldChanged('num_generations', e); },
                mutn_rate: function (e) { return _this.simpleFieldChanged('mutn_rate', e); },
                genome_size: function (e) { return _this.simpleFieldChanged('genome_size', e); },
                mutn_rate_model: function (e) { return _this.simpleFieldChanged('mutn_rate_model', e); },
                frac_fav_mutn: function (e) { return _this.simpleFieldChanged('frac_fav_mutn', e); },
                fraction_neutral: function (e) { return _this.simpleFieldChanged('fraction_neutral', e); },
                fitness_effect_model: function (e) { return _this.simpleFieldChanged('fitness_effect_model', e); },
                uniform_fitness_effect_del: function (e) { return _this.simpleFieldChanged('uniform_fitness_effect_del', e); },
                uniform_fitness_effect_fav: function (e) { return _this.simpleFieldChanged('uniform_fitness_effect_fav', e); },
                high_impact_mutn_fraction: function (e) { return _this.simpleFieldChanged('high_impact_mutn_fraction', e); },
                high_impact_mutn_threshold: function (e) { return _this.simpleFieldChanged('high_impact_mutn_threshold', e); },
                max_fav_fitness_gain: function (e) { return _this.simpleFieldChanged('max_fav_fitness_gain', e); },
                fraction_recessive: function (e) { return _this.simpleFieldChanged('fraction_recessive', e); },
                recessive_hetero_expression: function (e) { return _this.simpleFieldChanged('recessive_hetero_expression', e); },
                dominant_hetero_expression: function (e) { return _this.simpleFieldChanged('dominant_hetero_expression', e); },
                selection_model: function (e) { return _this.simpleFieldChanged('selection_model', e); },
                heritability: function (e) { return _this.simpleFieldChanged('heritability', e); },
                non_scaling_noise: function (e) { return _this.simpleFieldChanged('non_scaling_noise', e); },
                partial_truncation_value: function (e) { return _this.simpleFieldChanged('partial_truncation_value', e); },
                reproductive_rate: function (e) { return _this.simpleFieldChanged('reproductive_rate', e); },
                num_offspring_model: function (e) { return _this.simpleFieldChanged('num_offspring_model', e); },
                crossover_model: function (e) { return _this.simpleFieldChanged('crossover_model', e); },
                mean_num_crossovers: function (e) { return _this.simpleFieldChanged('mean_num_crossovers', e); },
                haploid_chromosome_number: function (e) { return _this.simpleFieldChanged('haploid_chromosome_number', e); },
                num_linkage_subunits: function (e) { return _this.simpleFieldChanged('num_linkage_subunits', e); },
                num_contrasting_alleles: function (e) { return _this.simpleFieldChanged('num_contrasting_alleles', e); },
                max_total_fitness_increase: function (e) { return _this.simpleFieldChanged('max_total_fitness_increase', e); },
                initial_allele_fitness_model: function (e) { return _this.simpleFieldChanged('initial_allele_fitness_model', e); },
                initial_alleles_pop_frac: function (e) { return _this.simpleFieldChanged('initial_alleles_pop_frac', e); },
                initial_alleles_frequencies: function (e) { return _this.simpleFieldChanged('initial_alleles_frequencies', e); },
                pop_growth_model: function (e) { return _this.simpleFieldChanged('pop_growth_model', e); },
                pop_growth_rate: function (e) { return _this.simpleFieldChanged('pop_growth_rate', e); },
                pop_growth_rate2: function (e) { return _this.simpleFieldChanged('pop_growth_rate2', e); },
                max_pop_size: function (e) { return _this.simpleFieldChanged('max_pop_size', e); },
                carrying_capacity: function (e) { return _this.simpleFieldChanged('carrying_capacity', e); },
                bottleneck_generation: function (e) { return _this.simpleFieldChanged('bottleneck_generation', e); },
                bottleneck_pop_size: function (e) { return _this.simpleFieldChanged('bottleneck_pop_size', e); },
                num_bottleneck_generations: function (e) { return _this.simpleFieldChanged('num_bottleneck_generations', e); },
                multiple_bottlenecks: function (e) { return _this.simpleFieldChanged('multiple_bottlenecks', e); },
                num_tribes: function (e) { return _this.simpleFieldChanged('num_tribes', e); },
                files_to_output_fit: function (checked) { return _this.checkboxFieldChanged('files_to_output_fit', checked); },
                files_to_output_hst: function (checked) { return _this.checkboxFieldChanged('files_to_output_hst', checked); },
                files_to_output_allele_bins: function (checked) { return _this.checkboxFieldChanged('files_to_output_allele_bins', checked); },
                tracking_threshold: function (e) { return _this.simpleFieldChanged('tracking_threshold', e); },
                track_neutrals: function (checked) { return _this.checkboxFieldChanged('track_neutrals', checked); },
                extinction_threshold: function (e) { return _this.simpleFieldChanged('extinction_threshold', e); },
                plot_allele_gens: function (e) { return _this.simpleFieldChanged('plot_allele_gens', e); },
                omit_first_allele_bin: function (checked) { return _this.checkboxFieldChanged('omit_first_allele_bin', checked); },
                verbosity: function (e) { return _this.simpleFieldChanged('verbosity', e); },
                random_number_seed: function (e) { return _this.simpleFieldChanged('random_number_seed', e); },
                num_threads: function (e) { return _this.simpleFieldChanged('num_threads', e); },
                force_gc: function (checked) { return _this.checkboxFieldChanged('force_gc', checked); },
                allele_count_gc_interval: function (e) { return _this.simpleFieldChanged('allele_count_gc_interval', e); },
            };
            _this.onSubmit = _this.onSubmit.bind(_this);
            _this.onImportClick = _this.onImportClick.bind(_this);
            _this.onExportClick = _this.onExportClick.bind(_this);
            var emptyStateConfig = {
                description: '',
                pop_size: '',
                num_generations: '',
                mutn_rate: '',
                genome_size: '',
                mutn_rate_model: 'poisson',
                frac_fav_mutn: '',
                fraction_neutral: '',
                fitness_effect_model: 'weibull',
                uniform_fitness_effect_del: '',
                uniform_fitness_effect_fav: '',
                high_impact_mutn_fraction: '',
                high_impact_mutn_threshold: '',
                max_fav_fitness_gain: '',
                fraction_recessive: '',
                recessive_hetero_expression: '',
                dominant_hetero_expression: '',
                selection_model: 'spps',
                heritability: '',
                non_scaling_noise: '',
                partial_truncation_value: '',
                reproductive_rate: '',
                num_offspring_model: 'fixed',
                crossover_model: 'partial',
                mean_num_crossovers: '',
                haploid_chromosome_number: '',
                num_linkage_subunits: '',
                num_contrasting_alleles: '',
                max_total_fitness_increase: '',
                initial_allele_fitness_model: 'variablefreq',
                initial_alleles_pop_frac: '',
                initial_alleles_frequencies: '',
                pop_growth_model: 'none',
                pop_growth_rate: '',
                pop_growth_rate2: '',
                max_pop_size: '',
                carrying_capacity: '',
                bottleneck_generation: '',
                bottleneck_pop_size: '',
                num_bottleneck_generations: '',
                multiple_bottlenecks: '',
                num_tribes: '',
                files_to_output_fit: true,
                files_to_output_hst: true,
                files_to_output_allele_bins: true,
                tracking_threshold: '',
                track_neutrals: false,
                extinction_threshold: '',
                plot_allele_gens: '',
                omit_first_allele_bin: false,
                verbosity: '',
                random_number_seed: '',
                num_threads: '',
                force_gc: false,
                allele_count_gc_interval: '',
            };
            _this.state = {
                defaultValues: Object.assign({}, emptyStateConfig),
                fieldValues: Object.assign({}, emptyStateConfig),
            };
            return _this;
        }
        Component.prototype.onImportClick = function () {
            var _this = this;
            chooseFileContents(function (contents) {
                var config = toml.parse(contents);
                var values = configToState(config);
                _this.setState({
                    fieldValues: values,
                });
            });
        };
        Component.prototype.onExportClick = function () {
            var output = stateToConfig(this.state.fieldValues);
            var a = document.createElement('a');
            a.setAttribute('download', 'export.toml');
            a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
            a.click();
        };
        Component.prototype.onSubmit = function (e) {
            var _this = this;
            e.preventDefault();
            var data = {
                config: stateToConfig(this.state.fieldValues),
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
        Component.prototype.componentDidMount = function () {
            var _this = this;
            if (this.props.jobId === null) {
                apiGet('/api/default-config/', {}, this.props.dispatch).then(function (response) {
                    var config = toml.parse(response.config);
                    var values = configToState(config);
                    _this.setState({
                        defaultValues: values,
                        fieldValues: values,
                    });
                });
            }
            else {
                apiGet('/api/default-config/', {}, this.props.dispatch).then(function (response) {
                    var config = toml.parse(response.config);
                    _this.setState({
                        defaultValues: configToState(config),
                    });
                });
                apiGet('/api/job-config/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                    var config = toml.parse(response.config);
                    var fieldVals = configToState(config);
                    _this.setState({
                        fieldValues: fieldVals,
                    });
                });
            }
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'new-job-view' }, React.createElement('div', { className: 'new-job-view__loading' }), React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit }, React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Basic'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Job description'), React.createElement('input', {
                type: 'text',
                value: this.state.fieldValues.description,
                onChange: this.fieldChangeHandlers.description,
            }), (this.state.fieldValues.description !== this.state.defaultValues.description ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null)), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Population size (initial or fixed)'), React.createElement('input', {
                type: 'number',
                min: '2',
                max: '1000000',
                step: '1',
                value: this.state.fieldValues.pop_size,
                onChange: this.fieldChangeHandlers.pop_size,
            }), (parseInt(this.state.fieldValues.pop_size) !== parseInt(this.state.defaultValues.pop_size) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'pop_size',
                content: 'This is the number of reproducing adults, after selection. This number is normally kept constant, except when fertility is insufficient to allow replacement, or when population growth is specified below. For smaller computer systems such as PCs, population size must remain small (100-5000) or the program will run out of memory. Population sizes smaller than 1000 can be strongly affected by inbreeding and drift.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Generations'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1000000',
                step: '1',
                value: this.state.fieldValues.num_generations,
                onChange: this.fieldChangeHandlers.num_generations,
            }), (parseInt(this.state.fieldValues.num_generations) !== parseInt(this.state.defaultValues.num_generations) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_generations',
                content: 'The number of generations the program should run. If there are too many generations specified, smaller computers will run out of memory because of the accumulation of large numbers of mutations, and the experiment will terminate prematurely. This problem can be mitigated by tracking only the larger-effect mutations (see computation parameters).  The program also terminates prematurely if fitness reaches a specified extinction threshold (default = 0.0) or if the population size shrinks to just one individual. In the special case of pop_growth_model==exponential, this value can be 0 which indicates the run should continue until max_pop_size is reached.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Mutations'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Total mutation rate (per individual per generation)'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1000',
                step: 'any',
                value: this.state.fieldValues.mutn_rate,
                onChange: this.fieldChangeHandlers.mutn_rate,
            }), (parseFloat(this.state.fieldValues.mutn_rate) !== parseFloat(this.state.defaultValues.mutn_rate) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'mutn_rate',
                content: 'This is the average number of new mutations per individual per generation. In humans, this number is believed to be approximately 100. The mutation rate can be adjusted to be proportional to the size of the functional genome. Thus if only 10% of the human genome actually functions (assuming the rest to be biologically inert), or if only 10% of the genome is modeled (as is the default), then the biologically relevant human mutation rate would be just 10. Rates of less than 1 new mutation per individual are allowed, including zero.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Functional genome size'), React.createElement('input', {
                type: 'number',
                min: '100',
                max: '10000000000000',
                step: '1',
                value: this.state.fieldValues.genome_size,
                onChange: this.fieldChangeHandlers.genome_size,
            }), (parseFloat(this.state.fieldValues.genome_size) !== parseFloat(this.state.defaultValues.genome_size) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'genome_size',
                content: 'The distribution of deleterious mutational effects must in some way be adjusted to account for genome size. An approximate yet reasonable means for doing this is to define the minimal mutational effect as being 1 divided by the functional haploid genome size. The result of this adjustment is that smaller genomes have “flatter” distributions of deleterious mutations, while larger genomes have “steeper” distribution curves. Because we consider all entirely neutral mutations separately, we only consider the size of the functional genome, so we choose the default genome size to be 300 million (10% of the actual human genome size).',
                url: HELP_URL_PREFIX + 'hgs',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Mutation rate model'), React.createElement('select', {
                value: this.state.fieldValues.mutn_rate_model,
                onChange: this.fieldChangeHandlers.mutn_rate_model,
            }, React.createElement('option', { value: 'fixed' }, 'Fixed'), React.createElement('option', { value: 'poisson' }, 'Poisson (default)')), (this.state.fieldValues.mutn_rate_model !== this.state.defaultValues.mutn_rate_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'mutn_rate_model',
                content: 'Choices: "poisson" - mutn_rate is determined by a poisson distribution, or "fixed" - mutn_rate is rounded to the nearest int',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Beneficial/deleterious ratio within non-neutral mutations'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.frac_fav_mutn,
                onChange: this.fieldChangeHandlers.frac_fav_mutn,
            }), (parseFloat(this.state.fieldValues.frac_fav_mutn) !== parseFloat(this.state.defaultValues.frac_fav_mutn) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'frac_fav_mutn',
                content: 'While some sources suggest this number might be as high as 1:1000, most sources suggest it is more realistically about 1:1,000,000. For studying the accumulation of only deleterious or only beneficial mutations, the fraction of beneficials can be set to zero or 1.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Fraction of the total number of mutations that are perfectly neutral'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.fraction_neutral,
                onChange: this.fieldChangeHandlers.fraction_neutral,
            }), (parseFloat(this.state.fieldValues.fraction_neutral) !== parseFloat(this.state.defaultValues.fraction_neutral) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'frac_fav_mutn',
                content: 'It is not clear that any mutations are perfectly neutral, but in the past it has often been claimed that most of the human genome is non-function “junk DNA”, and that mutations in these regions are truly neutral. For the human default, we allow (but do not believe) that 90% of the genome is junk DNA, and so 90% of all human mutations have absolutely no biological effect. Because of the computational cost of tracking so many neutral mutations we specify zero neutrals be simulated, and discount the genome size so it only reflects non-neutral mutations.',
                url: HELP_URL_PREFIX + 'fmun',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Fitness effect model'), React.createElement('select', {
                value: this.state.fieldValues.fitness_effect_model,
                onChange: this.fieldChangeHandlers.fitness_effect_model,
            }, React.createElement('option', { value: 'fixed' }, 'Fixed'), React.createElement('option', { value: 'uniform' }, 'Uniform'), React.createElement('option', { value: 'weibull' }, 'Weibull (default)')), (this.state.fieldValues.fitness_effect_model !== this.state.defaultValues.fitness_effect_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'fitness_effect_model',
                content: 'Choices: "weibull" - the fitness effect of each mutation is determined by the Weibull distribution, "fixed" - use fixed values for mutation fitness effect as set in uniform_fitness_effect_*, or "uniform" - even distribution between 0 and uniform_fitness_effect_* as max.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For fixed: effect for each deleterious mutation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '0.1',
                step: 'any',
                disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                value: this.state.fieldValues.uniform_fitness_effect_del,
                onChange: this.fieldChangeHandlers.uniform_fitness_effect_del,
            }), (parseFloat(this.state.fieldValues.uniform_fitness_effect_del) !== parseFloat(this.state.defaultValues.uniform_fitness_effect_del) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'uniform_fitness_effect_del',
                content: 'Used for fitness_effect_model=fixed. Each deleterious mutation should have this fitness effect.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For fixed: effect for each beneficial mutation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '0.1',
                step: 'any',
                disabled: (this.state.fieldValues.fitness_effect_model !== 'fixed' ||
                    parseFloat(this.state.fieldValues.frac_fav_mutn) === 0),
                value: this.state.fieldValues.uniform_fitness_effect_fav,
                onChange: this.fieldChangeHandlers.uniform_fitness_effect_fav,
            }), (parseFloat(this.state.fieldValues.uniform_fitness_effect_fav) !== parseFloat(this.state.defaultValues.uniform_fitness_effect_fav) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'uniform_fitness_effect_fav',
                content: 'Used for fitness_effect_model=fixed. Each beneficial mutation should have this fitness effect.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Fraction of deleterious mutations with “major effect”'), React.createElement('input', {
                type: 'number',
                min: '0.000000001',
                max: '0.9',
                step: 'any',
                value: this.state.fieldValues.high_impact_mutn_fraction,
                onChange: this.fieldChangeHandlers.high_impact_mutn_fraction,
            }), (parseFloat(this.state.fieldValues.high_impact_mutn_fraction) !== parseFloat(this.state.defaultValues.high_impact_mutn_fraction) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'high_impact_mutn_fraction',
                content: 'Most mutations have an effect on fitness that is too small to measure directly. However, mutations will have measurable effects in the far “tail” of the mutation distribution curve. By utilizing the frequency and distribution of “measurable” mutation effects, one can constrain the most significant portion of the distribution curve as it relates to the selection process. For most species, there may not yet be enough data, even for the major mutations, to accurately model the exact distribution of mutations. When such data is not yet available, we are forced to simply estimate, to the best of our ability and based on data from other organisms, the fraction of “major mutations”.  The human default is 0.001.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Minimum deleterious effect defined as “major”'), React.createElement('input', {
                type: 'number',
                min: '0.0001',
                max: '0.9',
                step: 'any',
                value: this.state.fieldValues.high_impact_mutn_threshold,
                onChange: this.fieldChangeHandlers.high_impact_mutn_threshold,
            }), (parseFloat(this.state.fieldValues.high_impact_mutn_threshold) !== parseFloat(this.state.defaultValues.high_impact_mutn_threshold) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'high_impact_mutn_threshold',
                content: 'A somewhat arbitrary level must be selected for defining what constitutes a “measurable”, or “major”, mutation effect. MENDEL uses a default value for this cut-off of 0.10. This is because under realistic clinical conditions, it is questionable that we can reliably measure a single mutation’s fitness effect when it changes fitness by less than 10%.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Maximum beneficial fitness effect'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                disabled: parseFloat(this.state.fieldValues.frac_fav_mutn) === 0,
                value: this.state.fieldValues.max_fav_fitness_gain,
                onChange: this.fieldChangeHandlers.max_fav_fitness_gain,
            }), (parseFloat(this.state.fieldValues.max_fav_fitness_gain) !== parseFloat(this.state.defaultValues.max_fav_fitness_gain) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'max_fav_fitness_gain',
                content: 'A realistic upper limit must be placed upon beneficial mutations. This is because a single nucleotide change can expand total biological functionality of an organism only to a limited degree. The larger the genome and the greater the total genomic information, the less a single nucleotide is likely to increase the total. Researchers must make a judgment for themselves of what is a reasonable maximal value for a single base change. The MENDEL default value for this limit is 0.01. This limit implies that a single point mutation can increase total biological functionality by as much as 1%.',
                url: HELP_URL_PREFIX + 'rdbm',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Fraction recessive (rest dominant)'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.fraction_recessive,
                onChange: this.fieldChangeHandlers.fraction_recessive,
            }), (parseFloat(this.state.fieldValues.fraction_recessive) !== parseFloat(this.state.defaultValues.fraction_recessive) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'fraction_recessive',
                content: 'This parameter simply specifies the percentage of mutations that are recessive. If set to 0.8, then 80% of mutations are recessive, so the remaining 20% will automatically be made dominant.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Expression of recessive mutations (in heterozygote)'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '0.5',
                step: 'any',
                value: this.state.fieldValues.recessive_hetero_expression,
                onChange: this.fieldChangeHandlers.recessive_hetero_expression,
            }), (parseFloat(this.state.fieldValues.recessive_hetero_expression) !== parseFloat(this.state.defaultValues.recessive_hetero_expression) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'recessive_hetero_expression',
                content: 'It is widely believed that recessive mutations are not completely silent in the heterozygous condition, but are still expressed at some low level. Although the co-dominance value is 0.5 expression, a reasonable setting would be 0.05.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Expression of dominant mutations (in heterozygote)'), React.createElement('input', {
                type: 'number',
                min: '0.5',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.dominant_hetero_expression,
                onChange: this.fieldChangeHandlers.dominant_hetero_expression,
            }), (parseFloat(this.state.fieldValues.dominant_hetero_expression) !== parseFloat(this.state.defaultValues.dominant_hetero_expression) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'dominant_hetero_expression',
                content: 'It is widely believed that dominant mutations are not completely dominant in the heterozygous condition, but are only expressed only at some very high level. Although the co-dominance value is 0.5, a reasonable setting would be 0.95.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Selection'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Selection model'), React.createElement('select', {
                value: this.state.fieldValues.selection_model,
                onChange: this.fieldChangeHandlers.selection_model,
            }, React.createElement('option', { value: 'fulltrunc' }, 'Full truncation'), React.createElement('option', { value: 'ups' }, 'Unrestricted probability selection'), React.createElement('option', { value: 'spps' }, 'Strict proportionality probability selection (default)'), React.createElement('option', { value: 'partialtrunc' }, 'Partial truncation')), (this.state.fieldValues.selection_model !== this.state.defaultValues.selection_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null)), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Heritability'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.heritability,
                onChange: this.fieldChangeHandlers.heritability,
            }), (parseFloat(this.state.fieldValues.heritability) !== parseFloat(this.state.defaultValues.heritability) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'heritability',
                content: 'Because a large part of phenotypic performance is affected by an individual’s circumstances (the “environment”), selection in nature is less effective than would be predicted simply from genotypic fitness values. Non-heritable environmental effects on phenotypic performance must be modeled realistically. A heritability value of 0.2 implies that on average, only 20% of an individual’s phenotypic performance is passed on to the next generation, with the rest being due to non-heritable factors. For a very general character such as reproductive fitness, 0.2 is an extremely generous heritability value. In most field contexts, it is in fact usually lower than this, typically being below the limit of detection.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Non-scaling noise'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.non_scaling_noise,
                onChange: this.fieldChangeHandlers.non_scaling_noise,
            }), (parseFloat(this.state.fieldValues.non_scaling_noise) !== parseFloat(this.state.defaultValues.non_scaling_noise) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'non_scaling_noise',
                content: 'If a population’s fitness is increasing or declining, heritability (as calculated in the normal way), tends to scale with fitness, and so the implied “environmental noise” diminishes or increases as fitness diminishes or increases. This seems counter-intuitive. Also, with truncation selection, phenotypic variance becomes un-naturally small. For these reasons, it is desirable to model a component of environmental noise that does not scale with fitness variation. The units for this non-scaling noise parameter are based upon standard deviations from the initial fitness of 1.0. For simplicity, a reasonable value is 0.05, but reasonable values probably exceed 0.01 and might exceed 0.1.',
                url: HELP_URL_PREFIX + 'nsn',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'For Partial Truncation: partial truncation value'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                disabled: this.state.fieldValues.selection_model !== 'partialtrunc',
                value: this.state.fieldValues.partial_truncation_value,
                onChange: this.fieldChangeHandlers.partial_truncation_value,
            }), (parseFloat(this.state.fieldValues.partial_truncation_value) !== parseFloat(this.state.defaultValues.partial_truncation_value) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'partial_truncation_value',
                content: 'Used in Parial Truncation selection, an individuals fitness is divided by: partial_truncation_value + (1. - partial_truncation_value)*randomnum(1).',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Population'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Reproductive rate'), React.createElement('input', {
                type: 'number',
                min: '1',
                max: '25',
                step: 'any',
                value: this.state.fieldValues.reproductive_rate,
                onChange: this.fieldChangeHandlers.reproductive_rate,
            }), (parseFloat(this.state.fieldValues.reproductive_rate) !== parseFloat(this.state.defaultValues.reproductive_rate) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'reproductive_rate',
                content: 'This is the number of offspring per reproducing individual. When population size is constant, this variable defines the maximum amount of selection. There must be an average of at least one offspring per individual (after the selection process) for the population to maintain its size and avoid rapid extinction. Except where random death is considered, the entire surplus population is removed based upon phenotypic selection. The typical value for humans is two offspring per selected individual (or four offspring per reproducing female).',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Num offspring model'), React.createElement('select', {
                value: this.state.fieldValues.num_offspring_model,
                onChange: this.fieldChangeHandlers.num_offspring_model,
            }, React.createElement('option', { value: 'uniform' }, 'Uniform'), React.createElement('option', { value: 'fixed' }, 'Fixed (default)')), (this.state.fieldValues.num_offspring_model !== this.state.defaultValues.num_offspring_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_offspring_model',
                content: 'Choices: "fixed" - reproductive_rate rounded to the nearest integer, or "uniform" - an even distribution such that the mean is reproductive_rate',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Crossover model'), React.createElement('select', {
                value: this.state.fieldValues.crossover_model,
                onChange: this.fieldChangeHandlers.crossover_model,
            }, React.createElement('option', { value: 'none' }, 'None'), React.createElement('option', { value: 'partial' }, 'Partial (default)'), React.createElement('option', { value: 'full' }, 'Full')), (this.state.fieldValues.crossover_model !== this.state.defaultValues.crossover_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'crossover_model',
                content: 'Choices: "partial" - mean_num_crossovers per chromosome pair, "none" - no crossover, or "full" - each LB has a 50/50 chance of coming from dad or mom',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For Partial: Mean crossovers per chromosome pair'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100',
                step: '1',
                disabled: this.state.fieldValues.crossover_model !== 'partial',
                value: this.state.fieldValues.mean_num_crossovers,
                onChange: this.fieldChangeHandlers.mean_num_crossovers,
            }), (parseInt(this.state.fieldValues.mean_num_crossovers) !== parseInt(this.state.defaultValues.mean_num_crossovers) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'mean_num_crossovers',
                content: 'Used only for crossover_model=partial. The average number of crossovers per chromosome PAIR during Meiosis 1 Metaphase.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Haploid chromosome number'), React.createElement('input', {
                type: 'number',
                min: '1',
                max: '100',
                step: '1',
                value: this.state.fieldValues.haploid_chromosome_number,
                onChange: this.fieldChangeHandlers.haploid_chromosome_number,
            }), (parseInt(this.state.fieldValues.haploid_chromosome_number) !== parseInt(this.state.defaultValues.haploid_chromosome_number) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'haploid_chromosome_number',
                content: 'The number of linkage blocks is evenly distributed over a user-specified haploid number of chromosomes (default=23).',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Number of linkage subunits per individual'), React.createElement('input', {
                type: 'number',
                min: '1',
                max: '100000',
                step: '1',
                value: this.state.fieldValues.num_linkage_subunits,
                onChange: this.fieldChangeHandlers.num_linkage_subunits,
            }), (parseInt(this.state.fieldValues.num_linkage_subunits) !== parseInt(this.state.defaultValues.num_linkage_subunits) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_linkage_subunits',
                content: 'The number of linkage blocks. The number of linkage blocks should be an integer multiple of the number of chromosome (e.g. the default value of 989 is 43 times the default 23 chromosomes).',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Number of initial contrasting alleles per individual'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1000000000',
                step: '1',
                value: this.state.fieldValues.num_contrasting_alleles,
                onChange: this.fieldChangeHandlers.num_contrasting_alleles,
            }), (parseInt(this.state.fieldValues.num_contrasting_alleles) !== parseInt(this.state.defaultValues.num_contrasting_alleles) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_contrasting_alleles',
                content: 'Number of initial contrasting alleles (pairs) given to each individual. Used to start the population with pre-existing diversity.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'The total fitness effect of all of the favorable initial alleles in an individual'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: 'any',
                disabled: parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0,
                value: this.state.fieldValues.max_total_fitness_increase,
                onChange: this.fieldChangeHandlers.max_total_fitness_increase,
            }), (parseFloat(this.state.fieldValues.max_total_fitness_increase) !== parseFloat(this.state.defaultValues.max_total_fitness_increase) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'max_total_fitness_increase',
                content: 'Used along with num_contrasting_alleles to set the total fitness effect of all of the favorable initial alleles in an individual.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'Initial Alleles model'), React.createElement('select', {
                disabled: parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0,
                value: this.state.fieldValues.initial_allele_fitness_model,
                onChange: this.fieldChangeHandlers.initial_allele_fitness_model,
            }, React.createElement('option', { value: 'variablefreq' }, 'Variable Frequencies (default)'), React.createElement('option', { value: 'allunique' }, 'All Unique Alleles')), (this.state.fieldValues.initial_allele_fitness_model !== this.state.defaultValues.initial_allele_fitness_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'initial_allele_fitness_model',
                content: 'Choices: "variablefreq" - different frequenceis for different fraction of the alleles like 0.25:0.1, 0.5:0.25, 0.25:0.5, "allunique" - unique allele pairs in every indiv',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For All Unique: Fraction of the population with initial alleles'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                disabled: (parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0 ||
                    this.state.fieldValues.initial_allele_fitness_model === 'variablefreq'),
                value: this.state.fieldValues.initial_alleles_pop_frac,
                onChange: this.fieldChangeHandlers.initial_alleles_pop_frac,
            }), (parseFloat(this.state.fieldValues.initial_alleles_pop_frac) !== parseFloat(this.state.defaultValues.initial_alleles_pop_frac) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'initial_alleles_pop_frac',
                content: 'Used for All Unique model along with num_contrasting_alleles to set the fraction of the initial population that should have num_contrasting_alleles alleles',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For Variable Frequencies: alleleFraction1:frequency1, alleleFraction2:frequency2, ...'), React.createElement('input', {
                type: 'text',
                disabled: (parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0 ||
                    this.state.fieldValues.initial_allele_fitness_model === 'allunique'),
                value: this.state.fieldValues.initial_alleles_frequencies,
                onChange: this.fieldChangeHandlers.initial_alleles_frequencies,
            }), (this.state.fieldValues.initial_alleles_frequencies !== this.state.defaultValues.initial_alleles_frequencies ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'initial_alleles_frequencies',
                content: 'Used for Variable Frequencies model along with num_contrasting_alleles to define portions of the total num_contrasting_alleles alleles and what frequency each should have',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Population growth model'), React.createElement('select', {
                value: this.state.fieldValues.pop_growth_model,
                onChange: this.fieldChangeHandlers.pop_growth_model,
            }, React.createElement('option', { value: 'none' }, 'None (default)'), React.createElement('option', { value: 'exponential' }, 'Exponential'), React.createElement('option', { value: 'capacity' }, 'Carrying capacity'), React.createElement('option', { value: 'founders' }, 'Founders effect'), React.createElement('option', { value: 'multi-bottleneck' }, 'Multiple bottlenecks')), (this.state.fieldValues.pop_growth_model !== this.state.defaultValues.pop_growth_model ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'pop_growth_model',
                content: 'Choices: "none" - no population growth, "exponential" - exponential growth model until max pop or number of generations, "capacity" - pop growth to asymptotically approach the pop carrying capacity, "founders" - exponential growth until bottleneck generations, a 2nd exponential growth rate after bottleneck until the carrying capacity or number of generations is reached, "multi-bottleneck" - like founders except an arbitrary number of comma-separated 5-tuples growth-rate:max-pop:bottle-start:bottle-size:bottle-gens',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'Population growth rate each generation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '10',
                step: 'any',
                disabled: (this.state.fieldValues.pop_growth_model === 'none' ||
                    this.state.fieldValues.pop_growth_model === 'multi-bottleneck'),
                value: this.state.fieldValues.pop_growth_rate,
                onChange: this.fieldChangeHandlers.pop_growth_rate,
            }), (parseFloat(this.state.fieldValues.pop_growth_rate) !== parseFloat(this.state.defaultValues.pop_growth_rate) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'pop_growth_rate',
                content: 'Population growth rate each generation (e.g. 1.05 is 5% increase). Used for pop_growth_model==Exponential, Carrying capacity, and Founders effect.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For Founders: Population growth rate after the bottleneck'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '10',
                step: 'any',
                disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                value: this.state.fieldValues.pop_growth_rate2,
                onChange: this.fieldChangeHandlers.pop_growth_rate2,
            }), (parseFloat(this.state.fieldValues.pop_growth_rate2) !== parseFloat(this.state.defaultValues.pop_growth_rate2) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'pop_growth_rate2',
                content: 'Population growth rate after the population bottleneck. Used for pop_growth_model==Founders effect.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For Exponential: Maximum population size'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                disabled: this.state.fieldValues.pop_growth_model !== 'exponential',
                value: this.state.fieldValues.max_pop_size,
                onChange: this.fieldChangeHandlers.max_pop_size,
            }), (parseInt(this.state.fieldValues.max_pop_size) !== parseInt(this.state.defaultValues.max_pop_size) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'max_pop_size',
                content: 'The run will stop when this population size is reached or num_generations is reached, whichever comes first. Set to 0 for no max. Used for pop_growth_model==exponential.',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'Population carrying capacity'), React.createElement('input', {
                type: 'number',
                min: '10',
                max: '100000',
                step: '1',
                disabled: (this.state.fieldValues.pop_growth_model === 'none' ||
                    this.state.fieldValues.pop_growth_model === 'exponential' ||
                    this.state.fieldValues.pop_growth_model === 'multi-bottleneck'),
                value: this.state.fieldValues.carrying_capacity,
                onChange: this.fieldChangeHandlers.carrying_capacity,
            }), (parseInt(this.state.fieldValues.carrying_capacity) !== parseInt(this.state.defaultValues.carrying_capacity) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'carrying_capacity',
                content: 'The limit that the population size should approach. Used for pop_growth_model==Carrying capacity and Founders effect.',
                url: 'https://en.wikipedia.org/wiki/Carrying_capacity',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'Generation number of a population bottleneck'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                value: this.state.fieldValues.bottleneck_generation,
                onChange: this.fieldChangeHandlers.bottleneck_generation,
            }), (parseInt(this.state.fieldValues.bottleneck_generation) !== parseInt(this.state.defaultValues.bottleneck_generation) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'bottleneck_generation',
                content: 'The generation number at which the population size bottleneck should start. Use 0 for no bottleneck. Currently only used for pop_growth_model==founders',
            })), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'The population size during the bottleneck'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                value: this.state.fieldValues.bottleneck_pop_size,
                onChange: this.fieldChangeHandlers.bottleneck_pop_size,
            }), (parseInt(this.state.fieldValues.bottleneck_pop_size) !== parseInt(this.state.defaultValues.bottleneck_pop_size) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null)), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'The number of generations the bottleneck should last'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                value: this.state.fieldValues.num_bottleneck_generations,
                onChange: this.fieldChangeHandlers.num_bottleneck_generations,
            }), (parseInt(this.state.fieldValues.num_bottleneck_generations) !== parseInt(this.state.defaultValues.num_bottleneck_generations) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null)), React.createElement('div', { className: 'new-job-view__field new-job-view--indented' }, React.createElement('label', {}, 'For Multiple Bottlenecks: growth-rate:max-pop:bottle-start:bottle-size:bottle-gens, …'), React.createElement('input', {
                type: 'text',
                disabled: this.state.fieldValues.pop_growth_model !== 'multi-bottleneck',
                value: this.state.fieldValues.multiple_bottlenecks,
                onChange: this.fieldChangeHandlers.multiple_bottlenecks,
            }), (this.state.fieldValues.multiple_bottlenecks !== this.state.defaultValues.multiple_bottlenecks ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'multiple_bottlenecks',
                content: 'Used for Multiple Bottlenecks population growth model, instead of any of the other population growth and bottleneck parameters.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Tribes'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'The number of tribes (separate populations)'), React.createElement('input', {
                type: 'number',
                min: '1',
                max: '100000',
                step: '1',
                value: this.state.fieldValues.num_tribes,
                onChange: this.fieldChangeHandlers.num_tribes,
            }), (parseInt(this.state.fieldValues.num_tribes) !== parseInt(this.state.defaultValues.num_tribes) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_tribes',
                content: 'Tribes mate and evolve separately. Many tribes can exhaust system resources quickly.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Output Files'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'mendel.fit'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_fit,
                onChange: this.fieldChangeHandlers.files_to_output_fit,
            })), (this.state.fieldValues.files_to_output_fit !== this.state.defaultValues.files_to_output_fit ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'files_to_output',
                content: 'This contains data needed for the "Fitness History" plot.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'mendel.hst'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_hst,
                onChange: this.fieldChangeHandlers.files_to_output_hst,
            })), (this.state.fieldValues.files_to_output_hst !== this.state.defaultValues.files_to_output_hst ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'files_to_output',
                content: 'This contains data needed for the "Average Mutations/Individual" plot.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Allele bin and distribution files'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.files_to_output_allele_bins,
                onChange: this.fieldChangeHandlers.files_to_output_allele_bins,
            })), (this.state.fieldValues.files_to_output_allele_bins !== this.state.defaultValues.files_to_output_allele_bins ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'files_to_output',
                content: 'This contains data needed for the "SNP Frequencies", "Minor Allele Frequencies", and allele distribution plots.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Computation'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Do not track mutations below this fitness effect'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '10',
                step: 'any',
                disabled: !this.state.fieldValues.files_to_output_allele_bins,
                value: this.state.fieldValues.tracking_threshold,
                onChange: this.fieldChangeHandlers.tracking_threshold,
            }), (parseFloat(this.state.fieldValues.tracking_threshold) !== parseFloat(this.state.defaultValues.tracking_threshold) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'tracking_threshold',
                content: 'Below this fitness effect value, near neutral mutations will be pooled into the cumulative fitness of the LB, instead of tracked individually. This saves on memory and computation time, but some stats will not be available. This value is automatically set to a high value if allele output is not requested, because there is no benefit to tracking in that case.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Track neutral mutations'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.track_neutrals,
                onChange: this.fieldChangeHandlers.track_neutrals,
            })), (this.state.fieldValues.track_neutrals !== this.state.defaultValues.track_neutrals ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'track_neutrals',
                content: 'Checking this box will cause Mendel to track neutral mutations as long as tracking_threshold is also set to 0.0. This button must be checked if neutral mutations are to be simulated.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'End simulation if population fitness falls to this'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '1',
                step: 'any',
                value: this.state.fieldValues.extinction_threshold,
                onChange: this.fieldChangeHandlers.extinction_threshold,
            }), (parseFloat(this.state.fieldValues.extinction_threshold) !== parseFloat(this.state.defaultValues.extinction_threshold) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'extinction_threshold',
                content: 'If the mean fitness of the population falls to this value or below, it is considered mutational meltdown and the simulation is stopped.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Plot alleles every n generations'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                disabled: !this.state.fieldValues.files_to_output_allele_bins,
                value: this.state.fieldValues.plot_allele_gens,
                onChange: this.fieldChangeHandlers.plot_allele_gens,
            }), (parseInt(this.state.fieldValues.plot_allele_gens) !== parseInt(this.state.defaultValues.plot_allele_gens) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'plot_allele_gens',
                content: 'A value of 0 means only plot alleles for the last generation.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Omit the 1st allele bin'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                disabled: !this.state.fieldValues.files_to_output_allele_bins,
                checked: this.state.fieldValues.omit_first_allele_bin,
                onChange: this.fieldChangeHandlers.omit_first_allele_bin,
            })), (this.state.fieldValues.omit_first_allele_bin !== this.state.defaultValues.omit_first_allele_bin ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'omit_first_allele_bin',
                content: 'If checked, do not output the 0-1% allele bin for allele plots. This is consistent with the way most geneticists plot this data.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'The verbosity of the output'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                value: this.state.fieldValues.verbosity,
                onChange: this.fieldChangeHandlers.verbosity,
            }), (parseInt(this.state.fieldValues.verbosity) !== parseInt(this.state.defaultValues.verbosity) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'verbosity',
                content: 'A value of 1 is recommended. Higher values will output more information, but will also take longer to gather.',
            })), React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Advanced Options'), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Random number generator (RNG) seed'), React.createElement('input', {
                type: 'number',
                min: '-9223372036854775808',
                max: '9223372036854775807',
                step: '1',
                value: this.state.fieldValues.random_number_seed,
                onChange: this.fieldChangeHandlers.random_number_seed,
            }), (parseInt(this.state.fieldValues.random_number_seed) !== parseInt(this.state.defaultValues.random_number_seed) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'random_number_seed',
                content: 'At several stages within the MENDEL program, a random number generator is required. When an experiment needs to be independently replicated, the “random number seed” must be changed. If this is not done, the second experiment will be an exact duplicate of the earlier run. Or you can set this value to 0 and get a unique seed every time.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Number of CPUs to use for the simulation'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                value: this.state.fieldValues.num_threads,
                onChange: this.fieldChangeHandlers.num_threads,
            }), (parseInt(this.state.fieldValues.num_threads) !== parseInt(this.state.defaultValues.num_threads) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'num_threads',
                content: 'The number of concurrent CPU threads that should be used in the simulation. If this is set to 0 (recommended) it will automatically use all available CPUs.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Force system garbage collection each generation'), React.createElement('div', { className: 'new-job-view__checkbox-wrapper' }, React.createElement(Checkbox, {
                checked: this.state.fieldValues.force_gc,
                onChange: this.fieldChangeHandlers.force_gc,
            })), (this.state.fieldValues.force_gc !== this.state.defaultValues.force_gc ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'force_gc',
                content: 'Check this box to explicitly run Go garbage collection after mating each generation. (Otherwise Go decides when to run gargage collection.) Setting this can cut memory usage, sometimes as much as 40%, but it also increases the run time.',
            })), React.createElement('div', { className: 'new-job-view__field' }, React.createElement('label', {}, 'Run Go garbage collection during allele counting after this %'), React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100000',
                step: '1',
                value: this.state.fieldValues.allele_count_gc_interval,
                onChange: this.fieldChangeHandlers.allele_count_gc_interval,
            }), (parseInt(this.state.fieldValues.allele_count_gc_interval) !== parseInt(this.state.defaultValues.allele_count_gc_interval) ?
                React.createElement('div', { className: 'new-job-view__not-default' }) :
                null), React.createElement(Help, {
                title: 'allele_count_gc_interval',
                content: 'if 0 < n < 100 explicitly call Go garbage collection after counting this percent of individuals (with a min bound of 100 individuals and max bound of 500), or if n >= 100 call GC after counting alleles from this many individuals. This helps memory not balloon right at the end of a long run, but will take a little longer.',
            })), React.createElement('div', { className: 'new-job-view__actions' }, React.createElement('input', { className: 'new-job-view__action button', type: 'submit', value: 'Start' }), React.createElement('div', { className: 'new-job-view__action button button--text', onClick: this.onImportClick }, 'Import'), React.createElement('div', { className: 'new-job-view__action button button--text', onClick: this.onExportClick }, 'Export'))));
        };
        return Component;
    }(React.Component));
    function stateToConfig(state) {
        return [
            '[basic]',
            'description = ' + tomlString(state.description),
            'pop_size = ' + tomlInt(state.pop_size),
            'num_generations = ' + tomlInt(state.num_generations),
            '[mutations]',
            'mutn_rate = ' + tomlFloat(state.mutn_rate),
            'genome_size = ' + tomlFloat(state.genome_size),
            'mutn_rate_model = ' + tomlString(state.mutn_rate_model),
            'frac_fav_mutn = ' + tomlFloat(state.frac_fav_mutn),
            'fraction_neutral = ' + tomlFloat(state.fraction_neutral),
            'fitness_effect_model = ' + tomlString(state.fitness_effect_model),
            'uniform_fitness_effect_del = ' + tomlFloat(state.uniform_fitness_effect_del),
            'uniform_fitness_effect_fav = ' + tomlFloat(state.uniform_fitness_effect_fav),
            'high_impact_mutn_fraction = ' + tomlFloat(state.high_impact_mutn_fraction),
            'high_impact_mutn_threshold = ' + tomlFloat(state.high_impact_mutn_threshold),
            'max_fav_fitness_gain = ' + tomlFloat(state.max_fav_fitness_gain),
            'fraction_recessive = ' + tomlFloat(state.fraction_recessive),
            'recessive_hetero_expression = ' + tomlFloat(state.recessive_hetero_expression),
            'dominant_hetero_expression = ' + tomlFloat(state.dominant_hetero_expression),
            '[selection]',
            'selection_model = ' + tomlString(state.selection_model),
            'heritability = ' + tomlFloat(state.heritability),
            'non_scaling_noise = ' + tomlFloat(state.non_scaling_noise),
            'partial_truncation_value = ' + tomlFloat(state.partial_truncation_value),
            '[population]',
            'reproductive_rate = ' + tomlFloat(state.reproductive_rate),
            'num_offspring_model = ' + tomlString(state.num_offspring_model),
            'crossover_model = ' + tomlString(state.crossover_model),
            'mean_num_crossovers = ' + tomlInt(state.mean_num_crossovers),
            'haploid_chromosome_number = ' + tomlInt(state.haploid_chromosome_number),
            'num_linkage_subunits = ' + tomlInt(state.num_linkage_subunits),
            'num_contrasting_alleles = ' + tomlInt(state.num_contrasting_alleles),
            'max_total_fitness_increase = ' + tomlFloat(state.max_total_fitness_increase),
            'initial_allele_fitness_model = ' + tomlString(state.initial_allele_fitness_model),
            'initial_alleles_pop_frac = ' + tomlFloat(state.initial_alleles_pop_frac),
            'initial_alleles_frequencies = ' + tomlString(state.initial_alleles_frequencies),
            'pop_growth_model = ' + tomlString(state.pop_growth_model),
            'pop_growth_rate = ' + tomlFloat(state.pop_growth_rate),
            'pop_growth_rate2 = ' + tomlFloat(state.pop_growth_rate2),
            'max_pop_size = ' + tomlInt(state.max_pop_size),
            'carrying_capacity = ' + tomlInt(state.carrying_capacity),
            'bottleneck_generation = ' + tomlInt(state.bottleneck_generation),
            'bottleneck_pop_size = ' + tomlInt(state.bottleneck_pop_size),
            'num_bottleneck_generations = ' + tomlInt(state.num_bottleneck_generations),
            'multiple_bottlenecks = ' + tomlString(state.multiple_bottlenecks),
            '[tribes]',
            'num_tribes = ' + tomlInt(state.num_tribes),
            '[computation]',
            'files_to_output = ' + tomlString(filesToOutputString(state.files_to_output_fit, state.files_to_output_hst, state.files_to_output_allele_bins)),
            'tracking_threshold = ' + tomlFloat(state.tracking_threshold),
            'track_neutrals = ' + tomlBoolean(state.track_neutrals),
            'extinction_threshold = ' + tomlFloat(state.extinction_threshold),
            'plot_allele_gens = ' + tomlInt(state.plot_allele_gens),
            'omit_first_allele_bin = ' + tomlBoolean(state.omit_first_allele_bin),
            'verbosity = ' + tomlInt(state.verbosity),
            'random_number_seed = ' + tomlInt(state.random_number_seed),
            'num_threads = ' + tomlInt(state.num_threads),
            'force_gc = ' + tomlBoolean(state.force_gc),
            'allele_count_gc_interval = ' + tomlInt(state.allele_count_gc_interval),
        ].join('\n');
    }
    function configToState(config) {
        var filesToOutput = filesToOutputBooleans(config.computation.files_to_output);
        return {
            description: config.basic.description.toString(),
            pop_size: config.basic.pop_size.toString(),
            num_generations: config.basic.num_generations.toString(),
            mutn_rate: config.mutations.mutn_rate.toString(),
            genome_size: config.mutations.genome_size.toString(),
            mutn_rate_model: config.mutations.mutn_rate_model,
            frac_fav_mutn: config.mutations.frac_fav_mutn.toString(),
            fraction_neutral: config.mutations.fraction_neutral.toString(),
            fitness_effect_model: config.mutations.fitness_effect_model,
            uniform_fitness_effect_del: config.mutations.uniform_fitness_effect_del.toString(),
            uniform_fitness_effect_fav: config.mutations.uniform_fitness_effect_fav.toString(),
            high_impact_mutn_fraction: config.mutations.high_impact_mutn_fraction.toString(),
            high_impact_mutn_threshold: config.mutations.high_impact_mutn_threshold.toString(),
            max_fav_fitness_gain: config.mutations.max_fav_fitness_gain.toString(),
            fraction_recessive: config.mutations.fraction_recessive.toString(),
            recessive_hetero_expression: config.mutations.recessive_hetero_expression.toString(),
            dominant_hetero_expression: config.mutations.dominant_hetero_expression.toString(),
            selection_model: config.selection.selection_model,
            heritability: config.selection.heritability.toString(),
            non_scaling_noise: config.selection.non_scaling_noise.toString(),
            partial_truncation_value: config.selection.partial_truncation_value.toString(),
            reproductive_rate: config.population.reproductive_rate.toString(),
            num_offspring_model: config.population.num_offspring_model,
            crossover_model: config.population.crossover_model,
            mean_num_crossovers: config.population.mean_num_crossovers.toString(),
            haploid_chromosome_number: config.population.haploid_chromosome_number.toString(),
            num_linkage_subunits: config.population.num_linkage_subunits.toString(),
            num_contrasting_alleles: config.population.num_contrasting_alleles.toString(),
            max_total_fitness_increase: config.population.max_total_fitness_increase.toString(),
            initial_allele_fitness_model: config.population.initial_allele_fitness_model,
            initial_alleles_pop_frac: config.population.initial_alleles_pop_frac.toString(),
            initial_alleles_frequencies: config.population.initial_alleles_frequencies,
            pop_growth_model: config.population.pop_growth_model,
            pop_growth_rate: config.population.pop_growth_rate.toString(),
            pop_growth_rate2: config.population.pop_growth_rate2.toString(),
            max_pop_size: config.population.max_pop_size.toString(),
            carrying_capacity: config.population.carrying_capacity.toString(),
            bottleneck_generation: config.population.bottleneck_generation.toString(),
            bottleneck_pop_size: config.population.bottleneck_pop_size.toString(),
            num_bottleneck_generations: config.population.num_bottleneck_generations.toString(),
            multiple_bottlenecks: config.population.multiple_bottlenecks,
            num_tribes: config.tribes.num_tribes.toString(),
            files_to_output_fit: filesToOutput.fit,
            files_to_output_hst: filesToOutput.hst,
            files_to_output_allele_bins: filesToOutput.alleles,
            tracking_threshold: config.computation.tracking_threshold.toString(),
            track_neutrals: config.computation.track_neutrals,
            extinction_threshold: config.computation.extinction_threshold.toString(),
            plot_allele_gens: config.computation.plot_allele_gens.toString(),
            omit_first_allele_bin: config.computation.omit_first_allele_bin,
            verbosity: config.computation.verbosity.toString(),
            random_number_seed: config.computation.random_number_seed.toString(),
            num_threads: config.computation.num_threads.toString(),
            force_gc: config.computation.force_gc,
            allele_count_gc_interval: config.computation.allele_count_gc_interval.toString(),
        };
    }
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
    function filesToOutputBooleans(s) {
        if (s === '*') {
            return {
                fit: true,
                hst: true,
                alleles: true,
            };
        }
        var parts = s.split(',').map(function (x) { return x.trim(); });
        return {
            fit: parts.indexOf('mendel.fit') >= 0,
            hst: parts.indexOf('mendel.hst') >= 0,
            alleles: (parts.indexOf('allele-bins/') >= 0 &&
                parts.indexOf('normalized-allele-bins/') >= 0 &&
                parts.indexOf('allele-distribution-del/') >= 0 &&
                parts.indexOf('allele-distribution-fav/') >= 0),
        };
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
    function tomlBoolean(b) {
        return b ? 'true' : 'false';
    }
    function chooseFileContents(callback) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.click();
        var onChange = function () {
            var f = assertNotNull(input.files)[0];
            var reader = new FileReader();
            reader.onload = function () {
                callback(reader.result);
            };
            reader.readAsText(f);
        };
        input.addEventListener('change', onChange, { once: true });
    }
    var NewJob = ReactRedux.connect()(Component$2);

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
    var ConfirmationDialog = (function (_super) {
        __extends$a(ConfirmationDialog, _super);
        function ConfirmationDialog() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ConfirmationDialog.prototype.render = function () {
            return React.createElement('div', { className: 'confirmation-dialog' }, React.createElement('div', { className: 'confirmation-dialog__overlay', onClick: this.props.onCancel }), React.createElement('div', { className: 'confirmation-dialog__content' }, React.createElement('div', { className: 'confirmation-dialog__title' }, this.props.title), this.props.descriptions.map(function (desc) { return React.createElement('div', { className: 'confirmation-dialog__description' }, desc); }), React.createElement('div', { className: 'confirmation-dialog__buttons' }, React.createElement('div', { className: 'confirmation-dialog__button', onClick: this.props.onCancel }, 'Close'), React.createElement('div', { className: 'confirmation-dialog__button', onClick: this.props.onOk }, 'Ok'))));
        };
        return ConfirmationDialog;
    }(React.Component));

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
    var DeleteIcon = (function (_super) {
        __extends$b(DeleteIcon, _super);
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
    var Component$3 = (function (_super) {
        __extends$c(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.onFilterChanged = _this.onFilterChanged.bind(_this);
            _this.fetchController = new AbortController();
            _this.state = {
                jobs: [],
                all: false,
                confirmationOpen: false,
                jobIdToDelete: "",
            };
            _this.onImportClick = _this.onImportClick.bind(_this);
            _this.onConfirmationOpen = _this.onConfirmationOpen.bind(_this);
            _this.onConfirmationCancel = _this.onConfirmationCancel.bind(_this);
            _this.onConfirmationOk = _this.onConfirmationOk.bind(_this);
            return _this;
        }
        Component.prototype.onJobClick = function (jobId) {
            setRoute(this.props.dispatch, '/job-detail/' + jobId + '/');
        };
        Component.prototype.onImportClick = function () {
            var _this = this;
            chooseFileContentsBase64(function (contents) {
                apiPost('/api/import-job/', {
                    contents: contents,
                }, _this.props.dispatch).then(function () {
                    _this.fetchJobs(_this.state.all);
                });
            });
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
            this.fetchController.abort();
            this.fetchController = new AbortController();
            return apiGet('/api/job-list/', { filter: all ? 'all' : 'mine' }, this.props.dispatch, this.fetchController.signal);
        };
        Component.prototype.deleteJob = function (jobId) {
            this.fetchController.abort();
            this.fetchController = new AbortController();
            return apiPost('/api/delete-job/', { id: jobId }, this.props.dispatch);
        };
        Component.prototype.onConfirmationOpen = function (jobId) {
            this.setState({
                confirmationOpen: true,
                jobIdToDelete: jobId,
            });
        };
        Component.prototype.onConfirmationCancel = function () {
            this.setState({
                confirmationOpen: false,
                jobIdToDelete: "",
            });
        };
        Component.prototype.onConfirmationOk = function () {
            var _this = this;
            this.deleteJob(this.state.jobIdToDelete).then(function () {
                _this.fetchJobs(_this.state.all).then(function (response) {
                    _this.setState({
                        jobs: response.jobs,
                        confirmationOpen: false,
                        jobIdToDelete: "",
                    });
                });
            });
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchJobs(this.state.all).then(function (response) {
                _this.setState({
                    jobs: response.jobs,
                });
            });
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
            }, React.createElement('option', { value: 'mine' }, 'My Jobs'), React.createElement('option', { value: 'all' }, 'All Jobs')), React.createElement('div', { className: 'job-listing-view__import button button--text', onClick: this.onImportClick }, 'Import'), React.createElement('div', { className: 'job-listing-view__jobs' }, React.createElement('div', { className: 'job-listing-view__labels' }, React.createElement('div', { className: 'job-listing-view__labels__id' }, 'Job ID'), React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'), React.createElement('div', { className: 'job-listing-view__labels__description' }, 'Description'), React.createElement('div', { className: 'job-listing-view__labels__username' }, 'User'), React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'), React.createElement('div', { className: 'job-listing-view__labels__delete-button' }, '')), this.state.jobs.map(function (job) { return (React.createElement('div', { className: 'job-listing-view__job', key: job.id }, React.createElement('div', { className: 'job-listing-view__job2', onClick: function () { return _this.onJobClick(job.id); } }, React.createElement('div', { className: 'job-listing-view__job__id' }, job.id), React.createElement('div', { className: 'job-listing-view__job__time' }, moment(job.time).fromNow()), React.createElement('div', { className: 'job-listing-view__job__description' }, job.description), React.createElement('div', { className: 'job-listing-view__job__username' }, job.username), React.createElement('div', { className: 'job-listing-view__job__status' }, capitalizeFirstLetter(job.status))), React.createElement('div', {
                className: 'job-listing-view__job__delete-button',
                onClick: function () { return _this.onConfirmationOpen(job.id); },
            }, React.createElement(DeleteIcon, { width: 24, height: 24 })))); })), (this.state.confirmationOpen ?
                React.createElement(ConfirmationDialog, {
                    title: 'Delete job?',
                    descriptions: ['The job output and data will also be deleted. This can not be undone.'],
                    onCancel: this.onConfirmationCancel,
                    onOk: this.onConfirmationOk,
                })
                : null));
        };
        return Component;
    }(React.Component));
    function capitalizeFirstLetter(s) {
        return s[0].toUpperCase() + s.substring(1);
    }
    function chooseFileContentsBase64(callback) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.click();
        var onChange = function () {
            var f = assertNotNull(input.files)[0];
            var reader = new FileReader();
            reader.onload = function () {
                var contents = assertNotNull(reader.result).split(',')[1];
                callback(contents);
            };
            reader.readAsDataURL(f);
        };
        input.addEventListener('change', onChange, { once: true });
    }
    var JobListing = ReactRedux.connect()(Component$3);

    var rootElement = null;
    function open(title, descriptions, actionCallback) {
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
                createElement('div', 'confirmation-dialog__description', descriptions.map(function (desc) { return document.createTextNode(desc); })),
                createElement('div', 'confirmation-dialog__buttons', (actionCallback !== undefined ? [cancelButton, actionButton] : [actionButton])),
            ]),
        ]);
        if (actionCallback !== undefined) {
            cancelButton.addEventListener('click', close);
        }
        overlay.addEventListener('click', close);
        actionButton.addEventListener('click', function () {
            close();
            if (actionCallback !== undefined) {
                actionCallback();
            }
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
                open('Delete user?', ['The user will be deleted, but jobs run by the user will be kept.'], function () {
                    apiPost('/api/delete-user/', {
                        id: userId,
                    }, dispatch).then(fetchUsers);
                });
            },
        };
    }
    var Component$4 = (function (_super) {
        __extends$d(Component, _super);
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
    var Component$5 = (function (_super) {
        __extends$e(Component, _super);
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
    function mapStateToProps$2(state) {
        return {
            sessionUserId: assertNotNull(state.user).id,
        };
    }
    var Component$6 = (function (_super) {
        __extends$f(Component, _super);
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
                    if (_this.props.userId === _this.props.sessionUserId) {
                        _this.props.dispatch({
                            type: 'USER',
                            value: {
                                id: _this.props.userId,
                                username: _this.state.username,
                                is_admin: _this.state.isAdmin,
                            },
                        });
                    }
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
            }), React.createElement('label', { onClick: this.onIsAdminChange }, 'Admin')), React.createElement('input', { className: 'button', type: 'submit', value: 'Save' })));
        };
        return Component;
    }(React.Component));
    var EditUser = ReactRedux.connect(mapStateToProps$2)(Component$6);

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
    function mapStateToProps$3(state) {
        return {
            user: state.user,
        };
    }
    var Component$7 = (function (_super) {
        __extends$g(Component, _super);
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
    var MyAccount = ReactRedux.connect(mapStateToProps$3, null)(Component$7);

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
    var Component$8 = (function (_super) {
        __extends$h(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.fetchOutput = _this.fetchOutput.bind(_this);
            _this.fetchController = new AbortController();
            _this.fetchTimeout = undefined;
            _this.outputOffset = 0;
            _this.state = {
                output: '',
                done: false,
                description: '',
                time: '',
            };
            _this.onPlotsClick = _this.onPlotsClick.bind(_this);
            _this.onConfigClick = _this.onConfigClick.bind(_this);
            _this.onDownloadClick = _this.onDownloadClick.bind(_this);
            return _this;
        }
        Component.prototype.onPlotsClick = function () {
            setRoute(this.props.dispatch, '/plots/' + this.props.jobId + '/0/average-mutations/');
        };
        Component.prototype.onConfigClick = function () {
            setRoute(this.props.dispatch, '/job-config/' + this.props.jobId + '/');
        };
        Component.prototype.onDownloadClick = function () {
            apiGet('/api/export-job/', { jobId: this.props.jobId }, this.props.dispatch).then(function (response) {
                var a = document.createElement('a');
                a.setAttribute('download', 'export.zip');
                a.setAttribute('href', 'data:text/plain;base64,' + response.contents);
                a.click();
            });
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
                    description: response.description,
                    time: response.time,
                }); });
                if (!response.done) {
                    _this.fetchTimeout = setTimeout(_this.fetchOutput, 1000);
                }
            });
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'job-detail-view' }, React.createElement('div', { className: 'job-detail-view__title' }, 'Job', React.createElement('span', { className: 'job-detail-view__job-info' }, this.props.jobId), React.createElement('span', { className: 'job-detail-view__job-info' }, this.state.description), React.createElement('span', { className: 'job-detail-view__job-info' }, moment(this.state.time).fromNow())), React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output), React.createElement('div', { className: 'job-detail-view__bottom' }, React.createElement('div', { className: 'job-detail-view__status' }, 'Status: ' + (this.state.done ? 'Done' : 'Running')), (this.state.done ?
                React.createElement('div', {
                    className: 'job-detail-view__plots-button button',
                    onClick: this.onPlotsClick,
                }, 'Plots') :
                null), React.createElement('div', {
                className: 'job-detail-view__config-button button',
                onClick: this.onConfigClick,
            }, 'Config'), React.createElement('div', {
                className: 'job-detail-view__download-button button',
                onClick: this.onDownloadClick,
            }, 'Download')));
        };
        return Component;
    }(React.Component));
    var JobDetail = ReactRedux.connect()(Component$8);

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
    var BackIcon = (function (_super) {
        __extends$i(BackIcon, _super);
        function BackIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BackIcon.prototype.render = function () {
            return React.createElement('svg', {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            }, React.createElement('path', { d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' }));
        };
        return BackIcon;
    }(React.PureComponent));

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
    var Component$9 = (function (_super) {
        __extends$j(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-average-mutations/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }));
        };
        return Component;
    }(React.Component));
    var AverageMutations = ReactRedux.connect()(Component$9);

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
    var Component$a = (function (_super) {
        __extends$k(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-fitness-history/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }));
        };
        return Component;
    }(React.Component));
    var FitnessHistory = ReactRedux.connect()(Component$a);

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
    var Component$b = (function (_super) {
        __extends$l(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-beneficial-mutations/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            })));
        };
        return Component;
    }(React.Component));
    var DeleteriousMutations = ReactRedux.connect()(Component$b);

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
    var Component$c = (function (_super) {
        __extends$m(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-beneficial-mutations/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            })));
        };
        return Component;
    }(React.Component));
    var BeneficialMutations = ReactRedux.connect()(Component$c);

    var __extends$n = (undefined && undefined.__extends) || (function () {
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
        __extends$n(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-snp-frequencies/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            console.log('snp componentDidMount');
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            console.log('snp componentDidUpdate');
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            console.log('snp componentWillUnmount');
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            })));
        };
        return Component;
    }(React.Component));
    var SnpFrequencies = ReactRedux.connect()(Component$d);

    var __extends$o = (undefined && undefined.__extends) || (function () {
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
        __extends$o(Component, _super);
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
        Component.prototype.fetchPlot = function (jobId, tribe) {
            var _this = this;
            this.fetchController = new AbortController();
            apiGet('/api/plot-minor-allele-frequencies/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(function (response) {
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
        };
        Component.prototype.componentDidMount = function () {
            this.fetchPlot(this.props.jobId, this.props.tribe);
            window.addEventListener('resize', this.resizePlot);
        };
        Component.prototype.componentDidUpdate = function (prevProps) {
            if (prevProps.tribe !== this.props.tribe) {
                this.fetchPlot(this.props.jobId, this.props.tribe);
            }
        };
        Component.prototype.componentWillUnmount = function () {
            Plotly.purge(assertNotNull(this.plotElement.current));
            window.removeEventListener('resize', this.resizePlot);
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            return React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' }, React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }), React.createElement('div', { className: 'plots-view__slider' }, React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'), React.createElement('div', { className: 'plots-view__slider-number' }, this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation), React.createElement('input', {
                className: 'plots-view__slider-input',
                type: 'range',
                max: this.state.data.length - 1,
                value: this.state.currentIndex,
                onChange: this.sliderInputChange,
            })));
        };
        return Component;
    }(React.Component));
    var MinorAlleleFrequencies = ReactRedux.connect()(Component$e);

    var __extends$p = (undefined && undefined.__extends) || (function () {
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
    var NoPlot = (function (_super) {
        __extends$p(NoPlot, _super);
        function NoPlot(props) {
            return _super.call(this, props) || this;
        }
        NoPlot.prototype.render = function () {
            var tribeStr = this.props.tribe === '0' ? 'the summary' : 'tribe ' + this.props.tribe;
            return React.createElement('div', { className: 'plots-view__non-sidebar' }, React.createElement('div', { className: 'plots-view__no-plot' }, 'The ' + this.props.plotName + ' plot does not exist for ' + tribeStr));
        };
        return NoPlot;
    }(React.PureComponent));

    var __extends$q = (undefined && undefined.__extends) || (function () {
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
            title: 'Fitness history',
            slug: 'fitness-history',
            filename: 'mendel.fit',
        },
        {
            title: 'Average mutations/individual',
            slug: 'average-mutations',
            filename: 'mendel.hst',
        },
        {
            title: 'SNP (Single Nucleotide Polymorphism) Frequencies',
            slug: 'snp-frequencies',
            filename: 'allele-bins',
        },
        {
            title: 'Minor Allele Frequencies',
            slug: 'minor-allele-frequencies',
            filename: 'normalized-allele-bins',
        },
        {
            title: 'Distribution of accumulated deleterious mutations (experimental)',
            slug: 'deleterious-mutations',
            filename: 'allele-distribution-del',
        },
        {
            title: 'Distribution of accumulated beneficial mutations (experimental)',
            slug: 'beneficial-mutations',
            filename: 'allele-distribution-fav',
        },
    ];
    function mapStateToProps$4(state) {
        return {
            plots: state.plots,
        };
    }
    function mapDispatchToProps$2(dispatch, ownProps) {
        return {
            dispatch: dispatch,
            onLinkClick: function (slug) {
                setRoute(dispatch, '/plots/' + ownProps.jobId + '/' + ownProps.tribe + '/' + slug + '/');
            },
            onBackClick: function () {
                setRoute(dispatch, '/job-detail/' + ownProps.jobId + '/');
            },
        };
    }
    var Component$f = (function (_super) {
        __extends$q(Component, _super);
        function Component(props) {
            var _this = _super.call(this, props) || this;
            _this.onSelectChanged = _this.onSelectChanged.bind(_this);
            _this.fetchController = new AbortController();
            return _this;
        }
        Component.prototype.onSelectChanged = function (e) {
            var _this = this;
            var tribe = e.currentTarget.value;
            this.fetchFiles(this.props.jobId, tribe).then(function (response) {
                var url = '/plots/' + _this.props.jobId + '/' + tribe + '/' + _this.props.activeSlug + '/';
                _this.props.dispatch({
                    type: 'plots.INFO_AND_ROUTE',
                    plots: { files: response.files, tribes: response.tribes },
                    route: url,
                });
                history.pushState(null, '', url);
            });
        };
        Component.prototype.fetchFiles = function (jobId, tribe) {
            this.fetchController.abort();
            this.fetchController = new AbortController();
            return apiGet('/api/job-plot-files/', { jobId: jobId, tribe: tribe }, this.props.dispatch, this.fetchController.signal);
        };
        Component.prototype.fileExists = function (slug) {
            var theLink = LINKS.find(function (link) { return link.slug === slug; });
            if (theLink === undefined)
                return false;
            return this.props.plots.files.indexOf(theLink.filename) > -1;
        };
        Component.prototype.getPlotTitle = function (slug) {
            return assertNotUndefined(LINKS.find(function (link) { return link.slug === slug; })).title;
        };
        Component.prototype.getPlot = function () {
            if (this.props.activeSlug === 'average-mutations') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(AverageMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else if (this.props.activeSlug === 'fitness-history') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(FitnessHistory, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else if (this.props.activeSlug === 'deleterious-mutations') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(DeleteriousMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else if (this.props.activeSlug === 'beneficial-mutations') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(BeneficialMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else if (this.props.activeSlug === 'snp-frequencies') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(SnpFrequencies, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else if (this.props.activeSlug === 'minor-allele-frequencies') {
                return (this.fileExists(this.props.activeSlug) ?
                    React.createElement(MinorAlleleFrequencies, { jobId: this.props.jobId, tribe: this.props.tribe })
                    : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe }));
            }
            else {
                return null;
            }
        };
        Component.prototype.componentDidMount = function () {
            var _this = this;
            this.fetchFiles(this.props.jobId, this.props.tribe).then(function (response) {
                _this.props.dispatch({
                    type: 'plots.INFO',
                    plots: { files: response.files, tribes: response.tribes },
                });
            });
        };
        Component.prototype.componentWillUnmount = function () {
            this.fetchController.abort();
        };
        Component.prototype.render = function () {
            var _this = this;
            return React.createElement('div', { className: 'plots-view' }, React.createElement('div', { className: 'plots-view__sidebar' }, React.createElement('div', { className: 'plots-view__sidebar__title-area' }, React.createElement('div', { className: 'plots-view__sidebar__back', onClick: this.props.onBackClick }, React.createElement(BackIcon, { width: 24, height: 24 })), React.createElement('div', { className: 'plots-view__sidebar__title' }, 'Plots'), (this.props.plots.tribes.length > 0 ?
                React.createElement('select', { className: 'plots-view__sidebar__select', value: this.props.tribe, onChange: this.onSelectChanged, }, React.createElement('option', { value: 0 }, 'Summary'), this.props.plots.tribes.map(function (tribe) {
                    return React.createElement('option', { value: tribe }, 'Tribe ' + tribe);
                }))
                : null)), React.createElement('div', { className: 'plots-view__sidebar__items' }, LINKS.filter(function (link) { return _this.props.plots.files.indexOf(link.filename) > -1; }).map(function (link) { return (React.createElement('div', {
                className: 'plots-view__sidebar__item ' + (_this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                onClick: function () { return _this.props.onLinkClick(link.slug); },
                key: link.slug,
            }, link.title)); }))), this.getPlot());
        };
        return Component;
    }(React.Component));
    var Plots = ReactRedux.connect(mapStateToProps$4, mapDispatchToProps$2)(Component$f);

    function mapStateToProps$5(state) {
        return {
            route: state.route,
        };
    }
    function getView(route) {
        var jobDetailMatch = route.match(new RegExp('^/job-detail/(\\w+)/$'));
        var jobConfigMatch = route.match(new RegExp('^/job-config/(\\w+)/$'));
        var editUserMatch = route.match(new RegExp('^/edit-user/(\\w+)/$'));
        var plotMatch = route.match(new RegExp('^/plots/(\\w+)/(\\w+)/([\\w-]+)/$'));
        if (route === '/') {
            return React.createElement(NewJob, {
                jobId: null,
                key: 'new_job',
            });
        }
        else if (jobConfigMatch) {
            return React.createElement(NewJob, {
                jobId: jobConfigMatch[1],
                key: 'job_config:' + jobConfigMatch[1],
            });
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
            var tribe = plotMatch[2];
            return React.createElement(Plots, { jobId: jobId, tribe: tribe, activeSlug: plotMatch[3] });
        }
        return null;
    }
    function Component$g(props) {
        return React.createElement('div', { className: 'page-content' }, getView(props.route));
    }
    var Content = ReactRedux.connect(mapStateToProps$5)(Component$g);

    var __extends$r = (undefined && undefined.__extends) || (function () {
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
    function mapStateToProps$6(state) {
        return {
            route: state.route,
        };
    }
    var Component$h = (function (_super) {
        __extends$r(Component, _super);
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
    var NonLogin = ReactRedux.connect(mapStateToProps$6)(Component$h);

    var __extends$s = (undefined && undefined.__extends) || (function () {
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
    function mapStateToProps$7(state) {
        return {
            route: state.route,
        };
    }
    var Component$i = (function (_super) {
        __extends$s(Component, _super);
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
    var Root = ReactRedux.connect(mapStateToProps$7)(Component$i);

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
