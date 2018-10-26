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

export function fetchGetSmart(url, dispatch) {
    loadingIndicatorIncrement(dispatch);

    return new Promise((resolve, reject) => {
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
        }).catch(err => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
            reject(err);
        });
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

export function fetchPostSmart(url, body, dispatch) {
    loadingIndicatorIncrement(dispatch);

    return new Promise((resolve, reject) => {
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
        }).catch(err => {
            loadingIndicatorDecrement(dispatch);
            console.error(err);
            reject(err);
        });
    });
}
