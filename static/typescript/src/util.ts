import * as Redux from 'redux';
import { ReduxAction } from './redux_action_types';

export function setRoute(dispatch: Redux.Dispatch<ReduxAction>, url: string) {
    dispatch({
        type: 'ROUTE',
        value: url,
    });
    history.pushState(null, '', url);
}

export function fetchPost(url: string, body: any) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
    });
}

export function assertNotNull<T>(obj: T | null) {
    if (obj === null) {
        throw new Error('Non-null assertion failed');
    } else {
        return obj;
    }
}

export function assertNotUndefined<T>(obj: T | undefined) {
    if (obj === undefined) {
        throw new Error('Non-undefined assertion failed');
    } else {
        return obj;
    }
}

export function loadingIndicatorIncrement(dispatch: Redux.Dispatch<ReduxAction>) {
    dispatch({
        type: 'LOADING_INDICATOR_INCREMENT',
    });
}

export function loadingIndicatorDecrement(dispatch: Redux.Dispatch<ReduxAction>) {
    dispatch({
        type: 'LOADING_INDICATOR_DECREMENT',
    });
}
