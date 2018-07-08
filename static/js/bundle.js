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

    function init() {
        const store = Redux.createStore(reducer);

        const root = React.createElement(ReactRedux.Provider, { store: store },
            React.createElement('div', null,

                React.createElement(Header, {}),
                React.createElement('div', { className: 'page-content' }),
            ),
        );

        ReactDOM.render(root, document.getElementById('react-root'));

        window.addEventListener('popstate', () => {
            store.dispatch({
                type: 'ROUTE',
                value: location.pathname,
            });
        });

        (fetch('/api/new-job/')
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.status === 'login') {
                    store.dispatch({
                        type: 'PAGE_LOADED',
                        page_data: {},
                        authenticated: false,
                    });
                } else {
                    console.log('Loaded data:', responseJson);
                }
            })
        );
    }

    init();

}());
