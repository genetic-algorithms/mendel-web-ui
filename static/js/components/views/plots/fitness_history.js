import { Sidebar } from './sidebar';

export class FitnessHistory extends React.Component {
    constructor(props) {
        super(props);

        this.resizePlot = this.resizePlot.bind(this);

        this.mounted = false;
        this.plotElement = null;
    }

    resizePlot() {
        Plotly.Plots.resize(this.plotElement);
    }

    componentDidMount() {
        fetch('/api/plot-fitness-history/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
        }).then(response => {
            response.json().then(responseJson => {
                if (!this.mounted) return;

                const data = [
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

                const layout = {
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

                Plotly.newPlot(this.plotElement, data, layout);
            });
        });

        window.addEventListener('resize', this.resizePlot);

        this.mounted = true;
    }

    componentWillUnmount() {
        Plotly.purge(this.plotElement);
        window.removeEventListener('resize', this.resizePlot);
        this.mounted = false;
    }

    render() {
        return React.createElement('div', { className: 'plots-view' },
            React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'fitness-history' }),
            React.createElement('div', { className: 'plots-view__non-sidebar' },
                React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
            ),
        );
    }
}
