import { reducer } from './reducer';
import { Header } from './components/header';

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
