import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../redux_action_types';
import { apiGet } from '../../api';
import { setRoute } from '../../util';

type OwnProps = {
    jobId: string;
};

type Props = OwnProps & {
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    output: string,
    done: boolean,
};

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

        this.onPlotsClick = this.onPlotsClick.bind(this);
        this.onConfigClick = this.onConfigClick.bind(this);
        this.onDownloadClick = this.onDownloadClick.bind(this);
    }

    onPlotsClick() {
        setRoute(this.props.dispatch, '/plots/' + this.props.jobId + '/average-mutations/');
    }

    onConfigClick() {
        setRoute(this.props.dispatch, '/job-config/' + this.props.jobId + '/');
    }

    onDownloadClick() {
        apiGet(
            '/api/export-job/',
            { jobId: this.props.jobId },
            this.props.dispatch,
        ).then(response => {
            const a = document.createElement('a');
            a.setAttribute('download', 'export.zip');
            a.setAttribute('href', 'data:text/plain;base64,' + response.contents);
            a.click();
        });
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

        apiGet(
            '/api/job-output/',
            { jobId: this.props.jobId, offset: this.outputOffset.toString() },
            this.props.dispatch,
            this.fetchController.signal,
        ).then(response => {
            this.outputOffset += response.output.length;

            this.setState((prevState, props) => ({
                output: prevState.output + response.output,
                done: response.done,
            }));

            if (!response.done) {
                this.fetchTimeout = setTimeout(this.fetchOutput, 1000);
            }
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
                            onClick: this.onPlotsClick,
                        },
                        'Plots',
                    ) :
                    null
                ),
                React.createElement('div',
                    {
                        className: 'job-detail-view__config-button button',
                        onClick: this.onConfigClick,
                    },
                    'Config',
                ),
                React.createElement('div',
                    {
                        className: 'job-detail-view__download-button button',
                        onClick: this.onDownloadClick,
                    },
                    'Download',
                ),
            ),
        );
    }
}

export const JobDetail = ReactRedux.connect()(Component);
