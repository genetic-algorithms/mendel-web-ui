import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import moment from 'moment';
import { ReduxAction } from '../../redux_action_types';
import { apiGet, apiPost } from '../../api';
import { setRoute, assertNotNull } from '../../util';
//import * as confirmationDialog from '../../confirmation_dialog';
import { DeleteIcon } from '../icons/delete';

type Job = {
    id: string;
    description: string;
    time: string;
    status: string;
    username: string;
};

type Props = {
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    jobs: Job[],
    all: boolean,
};

class Component extends React.Component<Props, State> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);

        this.onFilterChanged = this.onFilterChanged.bind(this);
        this.fetchController = new AbortController();

        this.state = {
            jobs: [],
            all: false,
        };

        this.onImportClick = this.onImportClick.bind(this);
    }

    onJobClick(jobId: string) {
        setRoute(this.props.dispatch, '/job-detail/' + jobId + '/');
    }

    onImportClick() {
        chooseFileContentsBase64(contents => {
            apiPost(
                '/api/import-job/',
                {
                    contents: contents,
                },
                this.props.dispatch,
            ).then(() => {
                this.fetchJobs(this.state.all);
            });
        });
    }

    onFilterChanged(e: React.ChangeEvent<HTMLSelectElement>) {
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

        apiGet(
            '/api/job-list/',
            { filter: all ? 'all' : 'mine' },
            this.props.dispatch,
            this.fetchController.signal,
        ).then(response => {
            this.setState({
                jobs: response.jobs,
            });
        });
    }

    onDeleteClick(userId: string) {
        /*
        confirmationDialog.open(
            'Delete job?',
            ['The job output and data will also be deleted. This can not be undone.'],
            () => {
                apiPost(
                    '/api/delete-job/',
                    {
                        id: userId,
                    },
                    this.props.dispatch,
                ).then(this.fetchJobs(this.state.all));
            },
        );
        */
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
            React.createElement('div', { className: 'job-listing-view__import button button--text', onClick: this.onImportClick }, 'Import'),
            React.createElement('div', { className: 'job-listing-view__jobs' },
                React.createElement('div', { className: 'job-listing-view__labels' },
                    React.createElement('div', { className: 'job-listing-view__labels__id' }, 'Job ID'),
                    React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'),
                    React.createElement('div', { className: 'job-listing-view__labels__description' }, 'Description'),
                    React.createElement('div', { className: 'job-listing-view__labels__username' }, 'User'),
                    React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'),
                    React.createElement('div', { className: 'job-listing-view__labels__delete-button' }, ''),
                ),

                this.state.jobs.map(job => (
                    React.createElement('div',
                        {
                            className: 'job-listing-view__job',
                            key: job.id,
                            onClick: () => this.onJobClick(job.id),
                        },
                        React.createElement('div', { className: 'job-listing-view__job__id' }, job.id),
                        React.createElement('div', { className: 'job-listing-view__job__time' }, moment(job.time).fromNow()),
                        React.createElement('div', { className: 'job-listing-view__job__description' }, job.description),
                        React.createElement('div', { className: 'job-listing-view__job__username' }, job.username),
                        React.createElement('div', { className: 'job-listing-view__job__status' },
                            capitalizeFirstLetter(job.status),
                        ),
                        React.createElement('div',
                            {
                                className: 'job-listing-view__job__delete-button',
                                onClick: () => this.onDeleteClick(job.id),
                            },
                            React.createElement(DeleteIcon, { width: 24, height: 24 }),
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

function chooseFileContentsBase64(callback: (content: string) => void) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();

    const onChange = () => {
        const f = assertNotNull(input.files)[0];
        const reader = new FileReader();
        reader.onload = () => {
            const contents = (assertNotNull(reader.result) as string).split(',')[1];
            callback(contents);
        };
        reader.readAsDataURL(f);
    };

    input.addEventListener('change', onChange, { once: true });
}

export const JobListing = ReactRedux.connect()(Component);
