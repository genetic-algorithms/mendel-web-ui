export function reducer(state, action) {
    if (state === undefined) {
        return {
            page_loaded: false,
            page_data: {},
            authenticated: false,
            route: location.pathname,
            loading_indicator_count: 0,
            user_listing: {
                users: [],
            },
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
