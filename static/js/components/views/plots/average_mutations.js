import { Sidebar } from './sidebar';

export class AverageMutations extends React.Component {
    constructor(props) {
        super(props);

        this.resizePlot = this.resizePlot.bind(this);

        this.fetchController = new AbortController();
        this.plotElement = null;
    }

    resizePlot() {
        Plotly.Plots.resize(this.plotElement);
    }

    componentDidMount() {
        this.fetchController = new AbortController();

        fetch('/api/plot-average-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            response.json().then(responseJson => {
                const data = [
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

                const layout = {
                    title: 'Average mutations/individual',
                    xaxis: {
                        title: 'Generations',
                    },
                    yaxis: {
                        title: 'Mutations',
                    },
                };

                Plotly.newPlot(this.plotElement, data, layout);
            });
        });

        window.addEventListener('resize', this.resizePlot);
    }

    componentWillUnmount() {
        Plotly.purge(this.plotElement);
        window.removeEventListener('resize', this.resizePlot);
        this.fetchController.abort();
    }

    render() {
        return React.createElement('div', { className: 'plots-view' },
            React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'average-mutations' }),
            React.createElement('div', { className: 'plots-view__non-sidebar' },
                React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
            ),
        );
    }
}
