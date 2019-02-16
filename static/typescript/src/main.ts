import { reducer } from './reducer';
import { Root } from './components/root';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactDOM from 'react-dom';
import * as ReactRedux from 'react-redux';

/*
Creates the component that is the root for the whole single page application.
 */

function init() {
    // Use Redux to store/manage global state (state across all components).
    // Each React component is wrapped in a Redux component, so it can react to Redux state changes
    const store = Redux.createStore(reducer);

    const root = React.createElement(ReactRedux.Provider, { store: store },
        React.createElement(Root, null),
    );

    ReactDOM.render(root, document.getElementById('react-root'));

    // Listen for route changes
    window.addEventListener('popstate', () => {
        store.dispatch({
            type: 'ROUTE',
            value: location.pathname,
        });
    });
}

init();
