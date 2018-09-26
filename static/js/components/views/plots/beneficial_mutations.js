import { Sidebar } from './sidebar';

export class BeneficialMutations extends React.Component {
    constructor(props) {
        super(props);

        this.resizePlot = this.resizePlot.bind(this);
        this.sliderInputChange = this.sliderInputChange.bind(this);

        this.fetchController = new AbortController();
        this.plotElement = null;

        this.state = {
            data: [],
            currentIndex : 0,
        };
    }

    resizePlot() {
        Plotly.Plots.resize(this.plotElement);
    }

    sliderInputChange(e) {
        const newIndex = parseInt(e.target.value);

        if (newIndex < this.state.data.length) {
            Plotly.restyle(this.plotElement, {
                y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
            }, [0, 1]);
        }

        this.setState({
            currentIndex: newIndex,
        });
    }

    componentDidMount() {
        this.fetchController = new AbortController();

        fetch('/api/plot-beneficial-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
            credentials: 'same-origin',
            signal: this.fetchController.signal,
        }).then(response => {
            response.json().then(responseJson => {
                let maxY = 0;
                for (let generation of responseJson) {
                    for (let n of generation.dominant) {
                        if (n > maxY) {
                            maxY = n;
                        }
                    }

                    for (let n of generation.recessive) {
                        if (n > maxY) {
                            maxY = n;
                        }
                    }
                }

                const generationData = responseJson[responseJson.length - 1];

                const data = [
                    {
                        x: generationData.binmidpointfitness,
                        y: generationData.dominant,
                        type: 'scatter',
                        name: 'Dominant',
                        line: {
                            color: 'rgb(0, 200, 0)',
                            shape: 'hvh',
                        },
                        fill: 'tozeroy',
                        fillcolor: 'rgba(0, 200, 0, 0.5)',
                    },
                    {
                        x: generationData.binmidpointfitness,
                        y: generationData.recessive,
                        type: 'scatter',
                        name: 'Recessive',
                        line: {
                            color: 'rgb(200, 0, 0)',
                            shape: 'hvh',
                        },
                        fill: 'tozeroy',
                        fillcolor: 'rgba(200, 0, 0, 0.5)',
                    },
                ];

                const layout = {
                    title: 'Distribution of accumulated mutations (beneficial)',
                    xaxis: {
                        title: 'Mutational Fitness Enhancement',
                        type: 'log',
                        exponentformat: 'e',
                    },
                    yaxis: {
                        title: 'Fraction of Mutations Retained in Genome',
                        range: [0, maxY],
                    },
                };

                Plotly.newPlot(this.plotElement, data, layout);

                this.setState({
                    data: responseJson,
                    currentIndex: responseJson.length - 1,
                });
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
            React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'beneficial-mutations' }),
            React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
                React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                React.createElement('div', { className: 'plots-view__slider' },
                    React.createElement('div', { className: 'plots-view__slider-label' }, 'Generation:'),
                    React.createElement('div', { className: 'plots-view__slider-number' },
                        this.state.data.length === 0 ? '' : this.state.data[this.state.currentIndex].generation
                    ),
                    React.createElement('input', {
                        className: 'plots-view__slider-input',
                        type: 'range',
                        max: this.state.data.length - 1,
                        value: this.state.currentIndex,
                        onChange: this.sliderInputChange,
                    }),
                ),
            ),
        );
    }
}
