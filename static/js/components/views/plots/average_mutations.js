function mapDispatchToProps(dispatch) {
    return {
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

    //     this.state = {
    //         output: '',
    //         done: false,
    //     };

        this.resizePlot = this.resizePlot.bind(this);

        this.mounted = false;
        this.plotElement = null;
    }

    resizePlot() {
        Plotly.Plots.resize(this.plotElement);
    }

    componentDidMount() {
        fetch('/api/plot-average-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
        }).then(response => {
            response.json().then(responseJson => {
                if (!this.mounted) return;

                console.log(responseJson);

                const trace1 = {
                    x: responseJson.generations,
                    y: responseJson.deleterious,
                    type: 'scatter',
                    name: 'Deleterious',
                    line: {
                        color: 'rgb(200, 0, 0)',
                    },
                };

                const trace2 = {
                    x: responseJson.generations,
                    y: responseJson.neutral,
                    type: 'scatter',
                    name: 'Neutral',
                    line: {
                        color: 'rgb(0, 0, 200)',
                    },
                };

                const trace3 = {
                    x: responseJson.generations,
                    y: responseJson.favorable,
                    type: 'scatter',
                    name: 'Favorable',
                    line: {
                        color: 'rgb(0, 200, 0)',
                    },
                };

                Plotly.newPlot(this.plotElement, [trace1, trace2, trace3], {
                    title: 'Average mutations/individual',
                    autosize: true,
                    xaxis: {
                        title: 'Generations',
                    },
                    yaxis: {
                        title: 'Mutations',
                    },
                });
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
            React.createElement('div', { className: 'plots-view__sidebar' },
                React.createElement('div', { className: 'plots-view__sidebar__item plots-view__sidebar--active' }, 'Average mutations/individual'),
                React.createElement('div', { className: 'plots-view__sidebar__item' }, 'Fitness history'),
                React.createElement('div', { className: 'plots-view__sidebar__item' }, 'Distribution of accumulated mutations (deleterious)'),
                React.createElement('div', { className: 'plots-view__sidebar__item' }, 'Distribution of accumulated mutations (beneficial)'),
                React.createElement('div', { className: 'plots-view__sidebar__item' }, 'SNP Frequencies'),
                React.createElement('div', { className: 'plots-view__sidebar__item' }, 'Minor Allele Frequencies'),
            ),
            React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
        );
    }
}

export const AverageMutations = ReactRedux.connect(null, mapDispatchToProps)(Component);
