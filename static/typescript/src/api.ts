import * as Redux from 'redux';
import { ReduxAction } from './redux_action_types';
import { fetchPost, setRoute, loadingIndicatorIncrement, loadingIndicatorDecrement } from './util';
import { User } from './user_types';

function paramsToString(params: { [key: string]: string }) {
    const paramStrings = [];

    for (let key of Object.keys(params)) {
        const value = params[key];
        paramStrings.push(key + '=' + encodeURIComponent(value));
    }

    return paramStrings.join('&');
}

// Defines an overloaded apiGet() function for each api method

export function apiGet(
    url: '/api/user-list/',
    params: {},
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    users: User[];
}>;

export function apiGet(
    url: '/api/get-current-user/',
    params: {},
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<User>;

export function apiGet(
    url: '/api/get-user/',
    params: {
        userId: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<User>;

export function apiGet(
    url: '/api/get-versions/',
    params: {},
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    mendelUiVersion: string;
    mendelGoVersion: string;
}>;

export function apiGet(
    url: '/api/job-output/',
    params: {
        jobId: string;
        offset: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    output: string;
    done: boolean;
    description: string;
    time: string;
}>;

export function apiGet(
    url: '/api/job-list/',
    params: {
        filter: 'all' | 'mine';
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    jobs: {
        id: string;
        description: string;
        time: string;
        status: string;
        username: string;
    }[];
}>;

export function apiGet(
    url: '/api/job-plot-files/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    files: string[];
    tribes: number[];
}>;

export function apiGet(
    url: '/api/plot-average-mutations/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generations: number[],
    deleterious: number[],
    neutral: number[],
    favorable: number[],
}>;

export function apiGet(
    url: '/api/plot-beneficial-mutations/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generation: number[];
    binmidpointfitness: number[];
    dominant: number[];
    recessive: number[];
}[]>;

export function apiGet(
    url: '/api/plot-deleterious-mutations/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generation: number[];
    binmidpointfitness: number[];
    dominant: number[];
    recessive: number[];
}[]>;

export function apiGet(
    url: '/api/plot-fitness-history/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generations: number[];
    pop_size: number[];
    fitness: number[];
}>;

export function apiGet(
    url: '/api/plot-minor-allele-frequencies/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generation: number;
    bins: number[];
    deleterious: number[];
    neutral: number[];
    favorable: number[];
    delInitialAlleles: number[];
    favInitialAlleles: number[];
}[]>;

export function apiGet(
    url: '/api/plot-snp-frequencies/',
    params: {
        jobId: string;
        tribe: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{
    generation: number;
    bins: number[];
    deleterious: number[];
    neutral: number[];
    favorable: number[];
    delInitialAlleles: number[];
    favInitialAlleles: number[];
}[]>;

export function apiGet(
    url: '/api/job-config/',
    params: {
        jobId: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{ config: string }>;

export function apiGet(
    url: '/api/export-job/',
    params: {
        jobId: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{ contents: string }>;

export function apiGet(
    url: '/api/default-config/',
    params: {},
    dispatch: Redux.Dispatch<ReduxAction>,
    signal?: AbortSignal,
): Promise<{ config: string }>;

export function apiGet(url: string, params: { [key: string]: string }, dispatch: Redux.Dispatch<ReduxAction>, signal?: AbortSignal) {
    loadingIndicatorIncrement(dispatch);

    return new Promise<any>((resolve, reject) => {
        fetch(url + '?' + paramsToString(params), {
            credentials: 'same-origin',
            signal: signal,
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

export function apiPost(
    url: '/api/create-edit-user/',
    body: {
        id?: string;
        username: string;
        password: string;
        is_admin: boolean;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{
    status: 'success' | 'username_exists';
}>;

export function apiPost(
    url: '/api/logout/',
    body: {},
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{}>;

export function apiPost(
    url: '/api/delete-user/',
    body: {
        id: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{}>;

export function apiPost(
    url: '/api/delete-job/',
    body: {
        id: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{}>;

export function apiPost(
    url: '/api/login/',
    body: {
        username: string;
        password: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{
    status: 'success' | 'wrong_credentials';
    user: User,
}>;

export function apiPost(
    url: '/api/import-job/',
    body: {
        contents: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{
    job_id: string;
}>;

export function apiPost(
    url: '/api/create-job/',
    body: {
        config: string;
    },
    dispatch: Redux.Dispatch<ReduxAction>
): Promise<{
    job_id: string;
}>;

export function apiPost(url: string, body: any, dispatch: Redux.Dispatch<ReduxAction>) {
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
