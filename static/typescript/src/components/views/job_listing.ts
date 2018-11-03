import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import moment from 'moment';
import { ReduxAction } from '../../redux_action_types';

type Job = {
    id: string;
    title: string;
    time: string;
    status: string;
};

type Props = {
    onShowLogin: () => void;
    onClick: (jobId: string) => void;
};

type State = {
    jobs: Job[],
    all: boolean,
};

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, '', '/login/');
        },
        onClick: (jobId: string) => {
            const url = '/job-detail/' + jobId + '/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, '', url);
        },
    };
}

export class Component extends React.Component<Props, State> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);

        this.onFilterChanged = this.onFilterChanged.bind(this);
        this.fetchController = new AbortController();

        this.state = {
            jobs: [],
            all: false,
        };
    }

    onFilterChanged(e: React.FormEvent<HTMLSelectElement>) {
        const value = e.currentTarget.value;
        const all = value === 'all';

        this.fetchJobs(all);

        this.setState({
            all: all,
        });
    }

    fetchJobs(all: boolean) {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        fetch('/api/job-list/?filter=' + (all ? 'all' : 'mine'), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.onShowLogin();
                return;
            }

            response.json().then(responseJson => {
                this.setState({
                    jobs: responseJson.jobs,
                });
            });
        });
    }

    componentDidMount() {
        this.fetchJobs(this.state.all);
    }

    componentWillUnmount() {
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'job-listing-view' },
            React.createElement('div', { className: 'job-listing-view__title' }, 'Jobs'),
            React.createElement('select',
                {
                    className: 'job-listing-view__filter',
                    value: this.state.all ? 'all' : 'mine',
                    onChange: this.onFilterChanged,
                },
                React.createElement('option', { value: 'mine' }, 'My Jobs'),
                React.createElement('option', { value: 'all' }, 'All Jobs'),
            ),
            React.createElement('div', { className: 'job-listing-view__jobs' },
                React.createElement('div', { className: 'job-listing-view__labels' },
                    React.createElement('div', { className: 'job-listing-view__labels__title' }, 'Title'),
                    React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'),
                    React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'),
                ),

                this.state.jobs.map(job => (
                    React.createElement('div',
                        {
                            className: 'job-listing-view__job',
                            key: job.id,
                            onClick: () => this.props.onClick(job.id),
                        },
                        React.createElement('div', { className: 'job-listing-view__job__title' }, job.title),
                        React.createElement('div', { className: 'job-listing-view__job__time' }, moment(job.time).fromNow()),
                        React.createElement('div', { className: 'job-listing-view__job__status' },
                            capitalizeFirstLetter(job.status),
                        ),
                    )
                )),
            ),
        );
    }
}

function capitalizeFirstLetter(s: string) {
    return s[0].toUpperCase() + s.substring(1);
}

export const JobListing = ReactRedux.connect(null, mapDispatchToProps)(Component);
