import { reducer } from './reducer';
import { Root } from './components/root';

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
