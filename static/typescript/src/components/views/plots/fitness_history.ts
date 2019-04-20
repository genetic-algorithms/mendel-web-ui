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

    componentDidMount() {
        this.fetchController = new AbortController();

        apiGet('/api/plot-fitness-history/', { jobId: this.props.jobId, tribe: this.props.tribe }, this.props.dispatch).then(response => {
            const data: Plotly.Data[] = [
                {
                    x: response.generations,
                    y: response.fitness,
                    type: 'scatter',
                    name: 'Fitness',
                    line: {
                        color: 'rgb(200, 0, 0)',
                    },
                },
                {
                    x: response.generations,
                    y: response.pop_size,
                    type: 'scatter',
                    name: 'Population Size',
                    line: {
                        color: 'rgb(0, 0, 200)',
                    },
                    yaxis: 'y2',
                },
            ];

            const layout: Partial<Plotly.Layout> = {
                title: 'Fitness history',
                xaxis: {
                    title: 'Generations',
                },
                yaxis: {
                    title: 'Fitness',
                },
                yaxis2: {
                    title: 'Population Size',
                    overlaying: 'y',
                    side: 'right',
                },
            };

            Plotly.newPlot(assertNotNull(this.plotElement.current), data, layout);
        });

        window.addEventListener('resize', this.resizePlot);
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

export const FitnessHistory = ReactRedux.connect()(Component);
