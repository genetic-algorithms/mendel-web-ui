export function setRoute(dispatch, url) {
    dispatch({
        type: 'ROUTE',
        value: url,
    });
    history.pushState(null, null, url);
}


function loadingIndicatorIncrement(dispatch) {
    dispatch({
        type: 'LOADING_INDICATOR_INCREMENT',
    });
}

function loadingIndicatorDecrement(dispatch) {
    dispatch({
        type: 'LOADING_INDICATOR_DECREMENT',
    });
}

export function fetchGetSmart(url, dispatch, onSuccess) {
    loadingIndicatorIncrement(dispatch);

    fetch(url, {
        credentials: 'same-origin',
    }).then(response => {
        loadingIndicatorDecrement(dispatch);

        if (response.status === 401) {
            setRoute(dispatch, '/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicatorDecrement(dispatch);
        console.error(err);
    });
}

export function fetchPost(url, body) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
    });
}

export function fetchPostSmart(url, body, dispatch, onSuccess) {
    loadingIndicatorIncrement(dispatch);

    return fetchPost(url, body).then(response => {
        loadingIndicatorDecrement(dispatch);

        if (response.status === 401) {
            setRoute(dispatch, '/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicatorDecrement(dispatch);
        console.error(err);
    });
}
