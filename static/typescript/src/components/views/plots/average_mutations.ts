import { assertNotNull } from '../../../util';
import { Sidebar } from './sidebar';
import * as Plotly from 'plotly.js';
import * as React from 'react';

type Props = {
    jobId: string;
};

type ApiData = {
    generations: number[],
    deleterious: number[],
    neutral: number[],
    favorable: number[],
};

export class AverageMutations extends React.Component<Props> {
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

        fetch('/api/plot-average-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            response.json().then((responseJson: ApiData) => {
                const data: Plotly.Data[] = [
                    {
                        x: responseJson.generations,
                        y: responseJson.deleterious,
                        type: 'scatter',
                        name: 'Deleterious',
                        line: {
                            color: 'rgb(200, 0, 0)',
                        },
                    },
                    {
                        x: responseJson.generations,
                        y: responseJson.neutral,
                        type: 'scatter',
                        name: 'Neutral',
                        line: {
                            color: 'rgb(0, 0, 200)',
                        },
                    },
                    {
                        x: responseJson.generations,
                        y: responseJson.favorable,
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
            React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'average-mutations' }),
            React.createElement('div', { className: 'plots-view__non-sidebar' },
                React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }),
            ),
        );
    }
}
