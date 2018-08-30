function mapDispatchToProps(dispatch) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
        onClick: (jobId) => {
            const url = '/jobs/' + jobId + '/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            jobs: [],
        };

        this.mounted = false;
    }

    componentDidMount() {
        this.mounted = true;

        fetch('/api/job-list/', {
            credentials: 'same-origin',
        }).then(response => {
            response.json().then(responseJson => {
                if (!this.mounted) return;

                this.setState({
                    jobs: responseJson.jobs,
                });
            });
        });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        return React.createElement('div', { className: 'job-listing-view' },
            React.createElement('div', { className: 'job-listing-view__title' }, 'Jobs'),
            React.createElement('div', { className: 'job-listing-view__jobs' },
                React.createElement('div', { className: 'job-listing-view__labels' },
                    React.createElement('div', { className: 'job-listing-view__labels__id' }, 'Job ID'),
                    React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'),
                    React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'),
                ),

                this.state.jobs.map(job => (
                    React.createElement('div',
                        {
                            className: 'job-listing-view__job',
                            key: job.job_id,
                            onClick: () => this.props.onClick(job.job_id),
                        },
                        React.createElement('div', { className: 'job-listing-view__job__id' }, job.job_id),
                        React.createElement('div', { className: 'job-listing-view__job__time' }, job.time),
                        React.createElement('div', { className: 'job-listing-view__job__status' },
                            (job.done ? 'Done' : 'Running'),
                        ),
                    )
                )),
            ),
        );
    }
}

export const JobListing = ReactRedux.connect(null, mapDispatchToProps)(Component);
