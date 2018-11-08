import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';

type OwnProps = {
    jobId: string;
};

type Props = OwnProps & {
    onShowLogin: () => void;
    onPlotsClick: () => void;
};

type State = {
    output: string,
    done: boolean,
};

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>, ownProps: OwnProps) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, '', '/login/');
        },
        onPlotsClick: () => {
            const url = '/plots/' + ownProps.jobId + '/average-mutations/';

            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, '', url);
        },
    };
}

class Component extends React.Component<Props, State> {
    fetchController: AbortController;
    fetchTimeout: number | undefined;
    outputOffset: number;

    constructor(props: Props) {
        super(props);

        this.fetchOutput = this.fetchOutput.bind(this);
        this.fetchController = new AbortController();
        this.fetchTimeout = undefined;
        this.outputOffset = 0;

        this.state = {
            output: '',
            done: false,
        };
    }

    componentDidMount() {
        this.fetchOutput();
    }

    componentWillUnmount() {
        this.fetchController.abort();
        window.clearTimeout(this.fetchTimeout);
    }

    fetchOutput() {
        this.fetchController = new AbortController();

        fetch('/api/job-output/?jobId=' + encodeURIComponent(this.props.jobId) + '&offset=' + encodeURIComponent(this.outputOffset.toString()), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            if (response.status === 401) {
                this.props.onShowLogin();
                return;
            }

            response.json().then(responseJson => {
                this.outputOffset += responseJson.output.length;

                this.setState((prevState, props) => ({
                    output: prevState.output + responseJson.output,
                    done: responseJson.done,
                }));

                if (!responseJson.done) {
                    this.fetchTimeout = setTimeout(this.fetchOutput, 1000);
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
