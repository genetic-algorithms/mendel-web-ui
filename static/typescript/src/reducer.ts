import * as immer from 'immer';
import { ReduxState } from './redux_state_types';
import { ReduxAction } from './redux_action_types';

// For the given (partial) redux state and the redux action, make the appropriate change to the state

export function reducer(state: ReduxState | undefined, action: ReduxAction) {
    if (state === undefined) {
        return {
            user: null,
            route: location.pathname,
            loading_indicator_count: 0,
            /*user_listing: {
                users: [],
            },*/
            plots: {
                files: [],
                tribes: [],
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
        /*case 'user_listing.USERS':
            return immer.default(state, draft => {
                draft.user_listing.users = action.value;
            });*/
        case 'plots.INFO':
            return immer.default(state, draft => {
                draft.plots = action.plots;
            });
        case 'plots.INFO_AND_ROUTE':
            return immer.default(state, draft => {
                draft.plots = action.plots;
                draft.route = action.route;
            });
        default:
            return state;
    }
}
