import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';
import { assertNotNull } from '../../../util';
import * as Plotly from 'plotly.js';
import * as React from 'react';
import { ReduxAction } from '../../../redux_action_types';
import { apiGet } from '../../../api';

type ApiData = {
    generation: number;
    bins: number[];
    deleterious: number[];
    neutral: number[];
    favorable: number[];
    delInitialAlleles: number[];
    favInitialAlleles: number[];
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
                y: [
                    this.state.data[newIndex].deleterious,
                    this.state.data[newIndex].favorable,
                    this.state.data[newIndex].neutral,
                    this.state.data[newIndex].delInitialAlleles,
                    this.state.data[newIndex].favInitialAlleles,
                ],
            }, [0, 1, 2, 3, 4]);
        }

        this.setState({
            currentIndex: newIndex,
        });
    }

    fetchPlot(jobId: string, tribe: string) {
        this.fetchController = new AbortController();

        apiGet('/api/plot-minor-allele-frequencies/', { jobId: jobId, tribe: tribe }, this.props.dispatch).then(response => {
            const generationData = response[response.length - 1];

            const data: Plotly.Data[] = [
                {
                    x: generationData.bins,
                    y: generationData.deleterious,
                    type: 'scatter',
                    name: 'Deleterious',
                    line: {
                        color: 'rgb(200, 0, 0)',
                        shape: 'hvh',
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(200, 0, 0, 0.5)',
                },
                {
                    x: generationData.bins,
                    y: generationData.favorable,
                    type: 'scatter',
                    name: 'Favorable',
                    line: {
                        color: 'rgb(0, 200, 0)',
                        shape: 'hvh',
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(0, 200, 0, 0.5)',
                },
                {
                    x: generationData.bins,
                    y: generationData.neutral,
                    type: 'scatter',
                    name: 'Neutral',
                    line: {
                        color: 'rgb(0, 0, 200)',
                        shape: 'hvh',
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(0, 0, 200, 0.5)',
                },
                {
                    x: generationData.bins,
                    y: generationData.delInitialAlleles,
                    type: 'scatter',
                    name: 'Deleterious Initial',
                    line: {
                        color: 'rgb(237, 158, 0)',
                        shape: 'hvh',
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(237, 158, 0, 0.5)',
                },
                {
                    x: generationData.bins,
                    y: generationData.favInitialAlleles,
                    type: 'scatter',
                    name: 'Favorable Initial',
                    line: {
                        color: 'rgb(200, 0, 200)',
                        shape: 'hvh',
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(200, 0, 200, 0.5)',
                },
            ];

            const layout: Partial<Plotly.Layout> = {
                title: 'SNP Frequencies',
                xaxis: {
                    title: 'SNP Frequencies',
                },
                yaxis: {
                    title: 'Number of Alleles',
                    range: [0, 1],
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

export const MinorAlleleFrequencies = ReactRedux.connect()(Component);
