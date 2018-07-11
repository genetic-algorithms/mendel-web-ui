import { reducer } from './reducer';
import { Header } from './components/header';
import { Content } from './components/content';

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
