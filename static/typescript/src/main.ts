import { reducer } from './reducer';
import { Root } from './components/root';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactDOM from 'react-dom';
import * as ReactRedux from 'react-redux';

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
