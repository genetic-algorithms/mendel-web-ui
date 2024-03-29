import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import { assertNotNull } from '../../../util';
import * as Plotly from 'plotly.js';
import * as React from 'react';
import { ReduxAction } from '../../../redux_action_types';
import { apiGet } from '../../../api';

type ApiData = {
    generation: number[];
    binmidpointfitness: number[];
    dominant: number[];
    recessive: number[];
}[];

type Props = {
    jobId: string;
    tribe: string;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    data: ApiData;
    currentIndex: number;
};

class Component extends React.Component<Props, State> {
    fetchController: AbortController;
    plotElement: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.resizePlot = this.resizePlot.bind(this);
        this.sliderInputChange = this.sliderInputChange.bind(this);

        this.fetchController = new AbortController();
        this.plotElement = React.createRef();

        this.state = {
            data: [],
            currentIndex : 0,
        };
    }

    resizePlot() {
        Plotly.Plots.resize(assertNotNull(this.plotElement.current));
    }

    sliderInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newIndex = parseInt(e.target.value);

        if (newIndex < this.state.data.length) {
            Plotly.restyle(assertNotNull(this.plotElement.current), {
                y: [this.state.data[newIndex].dominant, this.state.data[newIndex].recessive],
            }, [0, 1]);
        }

        this.setState({
            currentIndex: newIndex,
        });
    }

    fetchPlot(jobId: string, tribe: string) {
        this.fetchController = new AbortController();

        apiGet('/api/plot-beneficial-mutations/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(response => {
            let maxY = 0;
            for (let generation of response) {
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

            const generationData = response[response.length - 1];

            const data: Plotly.Data[] = [
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

            const layout: Partial<Plotly.Layout> = {
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

            Plotly.newPlot(assertNotNull(this.plotElement.current), data, layout);

            this.setState({
                data: response,
                currentIndex: response.length - 1,
            });
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
        return React.createElement('div', { className: 'plots-view__non-sidebar plots-view--has-slider' },
            React.createElement('div', { className: 'plots-view__plot', ref: this.plotElement }),
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
        );
    }
}

export const BeneficialMutations = ReactRedux.connect()(Component);
