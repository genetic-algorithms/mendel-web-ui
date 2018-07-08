export function reducer(state, action) {
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
