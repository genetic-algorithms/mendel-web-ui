import { assertNotNull } from '../../../util';
import { Sidebar } from './sidebar';
import * as Plotly from 'plotly.js';
import * as React from 'react';

type Props = {
    jobId: string;
};

type ApiData = {
    generations: number[];
    pop_size: number[];
    fitness: number[];
};

export class FitnessHistory extends React.Component<Props> {
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

        fetch('/api/plot-fitness-history/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            response.json().then((responseJson: ApiData) => {
                const data: Plotly.Data[] = [
                    {
                        x: responseJson.generations,
                        y: responseJson.fitness,
                        type: 'scatter',
                        name: 'Fitness',
                        line: {
                            color: 'rgb(200, 0, 0)',
                        },
                    },
                    {
                        x: responseJson.generations,
                        y: responseJson.pop_size,
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
        });

        window.addEventListener('resize', this.resizePlot);
    }

    componentWillUnmount() {
        Plotly.purge(assertNotNull(this.plotElement.current));
        window.removeEventListener('resize', this.resizePlot);
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'plots-view' },
            React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'fitness-history' }),
            React.createElement('div', { className: 'plots-view__non-sidebar' },
                React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }),
            ),
        );
    }
}
