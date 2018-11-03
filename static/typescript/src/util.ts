import * as Redux from 'redux';
import { ReduxAction } from './redux_action_types';

export function setRoute(dispatch: Redux.Dispatch<ReduxAction>, url: string) {
    dispatch({
        type: 'ROUTE',
        value: url,
    });
    history.pushState(null, '', url);
}


function loadingIndicatorIncrement(dispatch: Redux.Dispatch<ReduxAction>) {
    dispatch({
        type: 'LOADING_INDICATOR_INCREMENT',
    });
}

function loadingIndicatorDecrement(dispatch: Redux.Dispatch<ReduxAction>) {
    dispatch({
        type: 'LOADING_INDICATOR_DECREMENT',
    });
}

export function fetchGetSmart(url: string, dispatch: Redux.Dispatch<ReduxAction>) {
    loadingIndicatorIncrement(dispatch);

    return new Promise<any>((resolve, reject) => {
        fetch(url, {
            credentials: 'same-origin',
        }).then(response => {
            loadingIndicatorDecrement(dispatch);

            if (response.status === 401) {
                setRoute(dispatch, '/login/');
                reject();
                return;
            }

            response.json().then(responseJson => {
                resolve(responseJson);
            });
        }).catch((err: TypeError) => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
            reject(err);
        });
    });
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

export function fetchPostSmart(url: string, body: any, dispatch: Redux.Dispatch<ReduxAction>) {
    loadingIndicatorIncrement(dispatch);

    return new Promise<any>((resolve, reject) => {
        fetchPost(url, body).then(response => {
            loadingIndicatorDecrement(dispatch);

            if (response.status === 401) {
                setRoute(dispatch, '/login/');
                reject();
                return;
            }

            response.json().then(responseJson => {
                resolve(responseJson);
            });
        }).catch((err: TypeError) => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
            reject(err);
        });
    });
}

export function assertNotNull<T>(obj: T | null) {
    if (obj === null) {
        throw new Error('Non-null assertion failed');
    } else {
        return obj;
    }
}
