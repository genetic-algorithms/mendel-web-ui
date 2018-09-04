function mapDispatchToProps(dispatch, ownProps) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
        onPlotsClick: () => {
            const url = '/jobs/' + ownProps.jobId + '/plots/average-mutations/';

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

        this.fetchOutput = this.fetchOutput.bind(this);

        this.state = {
            output: '',
            done: false,
        };

        this.mounted = false;
        this.outputOffset = 0;
    }

    componentDidMount() {
        this.mounted = true;
        this.fetchOutput();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    fetchOutput() {
        if (!this.mounted) return;

        fetch('/api/job-output/?jobId=' + encodeURIComponent(this.props.jobId) + '&offset=' + encodeURIComponent(this.outputOffset), {
            credentials: 'same-origin',
        }).then(response => {
            response.json().then(responseJson => {
                if (!this.mounted) return;

                this.outputOffset += responseJson.output.length;

                this.setState((prevState, props) => ({
                    output: prevState.output + responseJson.output,
                    done: responseJson.done,
                }));

                if (!responseJson.done) {
                    this.timeout = setTimeout(this.fetchOutput, 1000);
                }
            });
        });
    }

    render() {
        return React.createElement('div', { className: 'job-detail-view' },
            React.createElement('div', { className: 'job-detail-view__title' },
                'Job',
                React.createElement('span', { className: 'job-detail-view__job-id' }, this.props.jobId),
            ),
            React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output),
            React.createElement('div', { className: 'job-detail-view__bottom' },
                React.createElement('div', { className: 'job-detail-view__status' },
                    'Status: ' + (this.state.done ? 'Done' : 'Running')
                ),
                (this.state.done ?
                    React.createElement('div',
                        {
                            className: 'job-detail-view__plots-button button',
                            onClick: this.props.onPlotsClick,
                        },
                        'Plots',
                    ) :
                    null
                ),
            ),
        );
    }
}

export const JobDetail = ReactRedux.connect(null, mapDispatchToProps)(Component);
