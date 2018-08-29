function mapDispatchToProps(dispatch) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fetchOutput = this.fetchOutput.bind(this);

        this.state = {
            output: '',
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
                    finished: responseJson.done,
                }));

                if (!responseJson.done) {
                    this.timeout = setTimeout(this.fetchOutput, 1000);
                }
            });
        });
    }

    render() {
        return React.createElement('div', { className: 'job-detail-view' },
            React.createElement('div', { className: 'job-detail-view__id' }, this.props.jobId),
            React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output),
        );
    }
}

export const JobDetail = ReactRedux.connect(null, mapDispatchToProps)(Component);
