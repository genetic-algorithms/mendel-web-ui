import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import { assertNotNull } from '../../../util';
import * as Plotly from 'plotly.js';
import * as React from 'react';
import { apiGet } from '../../../api';
import { ReduxAction } from '../../../redux_action_types';

type Props = {
    jobId: string;
    tribe: string;
    dispatch: Redux.Dispatch<ReduxAction>;
};

class Component extends React.Component<Props> {
    fetchController: AbortController;
    plotElement: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.resizePlot = this.resizePlot.bind(this);

        this.fetchController = new AbortController();
        this.plotElement = React.createRef();
    }

    resizePlot() {
        Plotly.Plots.resize(assertNotNull(this.plotElement.current));
    }

    fetchPlot(jobId: string, tribe: string) {
        this.fetchController = new AbortController();

        apiGet('/api/plot-average-mutations/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(response => {
            const data: Plotly.Data[] = [
                {
                    x: response.generations,
                    y: response.deleterious,
                    type: 'scatter',
                    name: 'Deleterious',
                    line: {
                        color: 'rgb(200, 0, 0)',
                    },
                },
                {
                    x: response.generations,
                    y: response.neutral,
                    type: 'scatter',
                    name: 'Neutral',
                    line: {
                        color: 'rgb(0, 0, 200)',
                    },
                },
                {
                    x: response.generations,
                    y: response.favorable,
                    type: 'scatter',
                    name: 'Favorable',
                    line: {
                        color: 'rgb(0, 200, 0)',
                    },
                },
            ];

            const layout: Partial<Plotly.Layout> = {
                title: 'Average mutations/individual',
                xaxis: {
                    title: 'Generations',
                },
                yaxis: {
                    title: 'Mutations',
                },
            };

            Plotly.newPlot(assertNotNull(this.plotElement.current), data, layout);
        });
    }

    componentDidMount() {
        this.fetchPlot(this.props.jobId, this.props.tribe);
        window.addEventListener('resize', this.resizePlot);
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.tribe !== this.props.tribe) {
            this.fetchPlot(this.props.jobId, this.props.tribe);
        }
    }

    componentWillUnmount() {
        Plotly.purge(assertNotNull(this.plotElement.current));
        window.removeEventListener('resize', this.resizePlot);
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'plots-view__non-sidebar' },
            React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }),
        );
    }
}

export const AverageMutations = ReactRedux.connect()(Component);
