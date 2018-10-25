export function setRoute(dispatch, url) {
    dispatch({
        type: 'ROUTE',
        value: url,
    });
    history.pushState(null, null, url);
}

export function fetchGetSmart(url, setRoute, loadingIndicatorIncrement, loadingIndicatorDecrement, onSuccess) {
    loadingIndicatorIncrement();

    fetch(url, {
        credentials: 'same-origin',
    }).then(response => {
        loadingIndicatorDecrement();

        if (response.status === 401) {
            setRoute('/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicatorDecrement();
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

export function fetchPostSmart(url, body, setRoute, loadingIndicatorIncrement, loadingIndicatorDecrement, onSuccess) {
    loadingIndicatorIncrement();

    return fetchPost(url, body).then(response => {
        loadingIndicatorDecrement();

        if (response.status === 401) {
            setRoute('/login/');
            return;
        }

        response.json().then(responseJson => {
            onSuccess(responseJson);
        });
    }).catch(err => {
        loadingIndicatorDecrement();
        console.error(err);
    });
}
