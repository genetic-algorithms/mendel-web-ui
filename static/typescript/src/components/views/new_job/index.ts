import { Checkbox } from '../../checkbox';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { apiPost, apiGet } from '../../../api';
import { setRoute, assertNotNull } from '../../../util';
import { Help } from './help';

type Props = {
    jobId: string | null;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type StateConfig = {
    pop_size: string;
    num_generations: string;
    mutn_rate: string;
    genome_size: string;
    mutn_rate_model: 'fixed' | 'poisson';
    frac_fav_mutn: string;
    fraction_neutral: string;
    fitness_effect_model: 'fixed' | 'uniform' | 'weibull';
    uniform_fitness_effect_del: string;
    uniform_fitness_effect_fav: string;
    high_impact_mutn_fraction: string;
    high_impact_mutn_threshold: string;
    max_fav_fitness_gain: string;
    fraction_recessive: string;
    recessive_hetero_expression: string;
    dominant_hetero_expression: string;
    selection_model: 'fulltrunc' | 'ups' | 'spps' | 'partialtrunc';
    heritability: string;
    non_scaling_noise: string;
    partial_truncation_value: string;
    files_to_output_fit: boolean;
    files_to_output_hst: boolean;
    files_to_output_allele_bins: boolean;
};

type ServerConfig = {
    basic: {
        pop_size: number;
        num_generations: number;
    },
    mutations: {
        mutn_rate: number;
        genome_size: number;
        mutn_rate_model: 'fixed' | 'poisson';
        frac_fav_mutn: number;
        fraction_neutral: number;
        fitness_effect_model: 'fixed' | 'uniform' | 'weibull';
        uniform_fitness_effect_del: number;
        uniform_fitness_effect_fav: number;
        high_impact_mutn_fraction: number;
        high_impact_mutn_threshold: number;
        max_fav_fitness_gain: number;
        fraction_recessive: number;
        recessive_hetero_expression: number;
        dominant_hetero_expression: number;
    },
    selection: {
        selection_model: 'fulltrunc' | 'ups' | 'spps' | 'partialtrunc';
        heritability: number;
        non_scaling_noise: number;
        partial_truncation_value: number;
    },
    computation: {
        files_to_output: string;
    }
};

type State = {
    defaultValues: StateConfig;
    fieldValues: StateConfig;
};

const HELP_URL_PREFIX = 'http://ec2-52-43-51-28.us-west-2.compute.amazonaws.com:8580/static/apps/mendel/help.html#';

class Component extends React.Component<Props, State> {
    fieldChangeHandlers: {
        pop_size: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_generations: (e: React.ChangeEvent<HTMLInputElement>) => void;
        mutn_rate: (e: React.ChangeEvent<HTMLInputElement>) => void;
        genome_size: (e: React.ChangeEvent<HTMLInputElement>) => void;
        mutn_rate_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        frac_fav_mutn: (e: React.ChangeEvent<HTMLInputElement>) => void;
        fraction_neutral: (e: React.ChangeEvent<HTMLInputElement>) => void;
        fitness_effect_model: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        uniform_fitness_effect_del: (e: React.ChangeEvent<HTMLInputElement>) => void;
        uniform_fitness_effect_fav: (e: React.ChangeEvent<HTMLInputElement>) => void;
        high_impact_mutn_fraction: (e: React.ChangeEvent<HTMLInputElement>) => void;
        high_impact_mutn_threshold: (e: React.ChangeEvent<HTMLInputElement>) => void;
        max_fav_fitness_gain: (e: React.ChangeEvent<HTMLInputElement>) => void;
        fraction_recessive: (e: React.ChangeEvent<HTMLInputElement>) => void;
        recessive_hetero_expression: (e: React.ChangeEvent<HTMLInputElement>) => void;
        dominant_hetero_expression: (e: React.ChangeEvent<HTMLInputElement>) => void;
        selection_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        heritability: (e: React.ChangeEvent<HTMLInputElement>) => void;
        non_scaling_noise: (e: React.ChangeEvent<HTMLInputElement>) => void;
        partial_truncation_value: (e: React.ChangeEvent<HTMLInputElement>) => void;
        files_to_output_fit: (checked: boolean) => void;
        files_to_output_hst: (checked: boolean) => void;
        files_to_output_allele_bins: (checked: boolean) => void;
    };

    constructor(props: Props) {
        super(props);

        this.fieldChangeHandlers = {
            pop_size: e => this.simpleFieldChanged('pop_size', e),
            num_generations: e => this.simpleFieldChanged('num_generations', e),
            mutn_rate: e => this.simpleFieldChanged('mutn_rate', e),
            genome_size: e => this.simpleFieldChanged('genome_size', e),
            mutn_rate_model: e => this.simpleFieldChanged('mutn_rate_model', e),
            frac_fav_mutn: e => this.simpleFieldChanged('frac_fav_mutn', e),
            fraction_neutral: e => this.simpleFieldChanged('fraction_neutral', e),
            fitness_effect_model: e => this.simpleFieldChanged('fitness_effect_model', e),
            uniform_fitness_effect_del: e => this.simpleFieldChanged('uniform_fitness_effect_del', e),
            uniform_fitness_effect_fav: e => this.simpleFieldChanged('uniform_fitness_effect_fav', e),
            high_impact_mutn_fraction: e => this.simpleFieldChanged('high_impact_mutn_fraction', e),
            high_impact_mutn_threshold: e => this.simpleFieldChanged('high_impact_mutn_threshold', e),
            max_fav_fitness_gain: e => this.simpleFieldChanged('max_fav_fitness_gain', e),
            fraction_recessive: e => this.simpleFieldChanged('fraction_recessive', e),
            recessive_hetero_expression: e => this.simpleFieldChanged('recessive_hetero_expression', e),
            dominant_hetero_expression: e => this.simpleFieldChanged('dominant_hetero_expression', e),
            selection_model: e => this.simpleFieldChanged('selection_model', e),
            heritability: e => this.simpleFieldChanged('heritability', e),
            non_scaling_noise: e => this.simpleFieldChanged('non_scaling_noise', e),
            partial_truncation_value: e => this.simpleFieldChanged('partial_truncation_value', e),
            files_to_output_fit: checked => this.checkboxFieldChanged('files_to_output_fit', checked),
            files_to_output_hst: checked => this.checkboxFieldChanged('files_to_output_hst', checked),
            files_to_output_allele_bins: checked => this.checkboxFieldChanged('files_to_output_allele_bins', checked),
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.onImportClick = this.onImportClick.bind(this);
        this.onExportClick = this.onExportClick.bind(this);

        const emptyStateConfig: StateConfig = {
            pop_size: '',
            num_generations: '',
            mutn_rate: '',
            genome_size: '',
            mutn_rate_model: 'poisson',
            frac_fav_mutn: '',
            fraction_neutral: '',
            fitness_effect_model: 'weibull',
            uniform_fitness_effect_del: '',
            uniform_fitness_effect_fav: '',
            high_impact_mutn_fraction: '',
            high_impact_mutn_threshold: '',
            max_fav_fitness_gain: '',
            fraction_recessive: '',
            recessive_hetero_expression: '',
            dominant_hetero_expression: '',
            selection_model: 'spps',
            heritability: '',
            non_scaling_noise: '',
            partial_truncation_value: '',
            files_to_output_fit: true,
            files_to_output_hst: true,
            files_to_output_allele_bins: true,
        };

        this.state = {
            defaultValues: Object.assign({}, emptyStateConfig),
            fieldValues: Object.assign({}, emptyStateConfig),
        };
    }

    onImportClick() {
        chooseFileContents(contents => {
            const config = toml.parse(contents) as ServerConfig;
            const values = configToState(config);

            this.setState({
                fieldValues: values,
            });
        });
    }

    onExportClick() {
        const output = stateToConfig(this.state.fieldValues);
        const a = document.createElement('a');
        a.setAttribute('download', 'export.toml');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
        a.click();
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const data = {
            config: stateToConfig(this.state.fieldValues),
        };

        apiPost('/api/create-job/', data, this.props.dispatch).then(response => {
            setRoute(this.props.dispatch, '/job-detail/' + response.job_id + '/');
        });
    }

    simpleFieldChanged(id: keyof State['fieldValues'], e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const value = e.currentTarget.value;

        this.setState(prevState => {
            const newFieldValues = Object.assign({}, prevState.fieldValues);
            newFieldValues[id] = value;

            return Object.assign({}, prevState, {
                fieldValues: newFieldValues,
            });
        });
    }

    checkboxFieldChanged(id: keyof State['fieldValues'], checked: boolean) {
        this.setState(prevState => {
            const newFieldValues = Object.assign({}, prevState.fieldValues);
            newFieldValues[id] = checked;

            return Object.assign({}, prevState, {
                fieldValues: newFieldValues,
            });
        });
    }

    componentDidMount() {
        if (this.props.jobId === null) {
            apiGet(
                '/api/default-config/',
                {},
                this.props.dispatch,
            ).then(response => {
                const config = toml.parse(response.config);
                const values = configToState(config);

                this.setState({
                    defaultValues: values,
                    fieldValues: values,
                });
            });
        } else {
            apiGet(
                '/api/default-config/',
                {},
                this.props.dispatch,
            ).then(response => {
                const config = toml.parse(response.config);

                this.setState({
                    defaultValues: configToState(config),
                });
            });

            apiGet(
                '/api/job-config/',
                { jobId: this.props.jobId },
                this.props.dispatch,
            ).then(response => {
                const config = toml.parse(response.config);

                this.setState({
                    fieldValues: configToState(config),
                });
            });
        }
    }

    render() {
        return React.createElement('div', { className: 'new-job-view' },
            React.createElement('div', { className: 'new-job-view__loading' }),
            React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit },
                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Basic'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Population size (initial or fixed)'),
                    React.createElement('input', {
                        type: 'number',
                        min: '2',
                        max: '1000000',
                        step: '1',
                        value: this.state.fieldValues.pop_size,
                        onChange: this.fieldChangeHandlers.pop_size,
                    }),
                    (this.state.fieldValues.pop_size !== this.state.defaultValues.pop_size ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'pop_size',
                        content: 'This is the number of reproducing adults, after selection. This number is normally kept constant, except when fertility is insufficient to allow replacement, or when population growth is specified below. For smaller computer systems such as PCs, population size must remain small (100-5000) or the program will run out of memory. Population sizes smaller than 1000 can be strongly affected by inbreeding and drift.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Generations'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1000000',
                        step: '1',
                        value: this.state.fieldValues.num_generations,
                        onChange: this.fieldChangeHandlers.num_generations,
                    }),
                    (this.state.fieldValues.num_generations !== this.state.defaultValues.num_generations ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'num_generations',
                        content: 'The number of generations the program should run. If there are too many generations specified, smaller computers will run out of memory because of the accumulation of large numbers of mutations, and the experiment will terminate prematurely. This problem can be mitigated by tracking only the larger-effect mutations (see computation parameters).  The program also terminates prematurely if fitness reaches a specified extinction threshold (default = 0.0) or if the population size shrinks to just one individual. In the special case of pop_growth_model==exponential, this value can be 0 which indicates the run should continue until max_pop_size is reached.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Mutations'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Total mutation rate (per individual per generation)'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1000',
                        step: 'any',
                        value: this.state.fieldValues.mutn_rate,
                        onChange: this.fieldChangeHandlers.mutn_rate,
                    }),
                    (parseFloat(this.state.fieldValues.mutn_rate) !== parseFloat(this.state.defaultValues.mutn_rate) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'mutn_rate',
                        content: 'This is the average number of new mutations per individual per generation. In humans, this number is believed to be approximately 100. The mutation rate can be adjusted to be proportional to the size of the functional genome. Thus if only 10% of the human genome actually functions (assuming the rest to be biologically inert), or if only 10% of the genome is modeled (as is the default), then the biologically relevant human mutation rate would be just 10. Rates of less than 1 new mutation per individual are allowed, including zero.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Functional genome size'),
                    React.createElement('input', {
                        type: 'number',
                        min: '100',
                        max: '10000000000000',
                        step: '1',
                        value: this.state.fieldValues.genome_size,
                        onChange: this.fieldChangeHandlers.genome_size,
                    }),
                    (parseInt(this.state.fieldValues.genome_size) !== parseInt(this.state.defaultValues.genome_size) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'genome_size',
                        content: 'The distribution of deleterious mutational effects must in some way be adjusted to account for genome size. An approximate yet reasonable means for doing this is to define the minimal mutational effect as being 1 divided by the functional haploid genome size. The result of this adjustment is that smaller genomes have “flatter” distributions of deleterious mutations, while larger genomes have “steeper” distribution curves. Because we consider all entirely neutral mutations separately, we only consider the size of the functional genome, so we choose the default genome size to be 300 million (10% of the actual human genome size).',
                        url: HELP_URL_PREFIX + 'hgs',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Mutation rate model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.mutn_rate_model,
                            onChange: this.fieldChangeHandlers.mutn_rate_model,
                        },
                        React.createElement('option', { value: 'fixed' }, 'Fixed'),
                        React.createElement('option', { value: 'poisson' }, 'Poisson (default)'),
                    ),
                    (this.state.fieldValues.mutn_rate_model !== this.state.defaultValues.mutn_rate_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'mutn_rate_model',
                        content: 'Choices: "poisson" - mutn_rate is determined by a poisson distribution, or "fixed" - mutn_rate is rounded to the nearest int',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Beneficial/deleterious ratio within non-neutral mutations'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.frac_fav_mutn,
                        onChange: this.fieldChangeHandlers.frac_fav_mutn,
                    }),
                    (parseFloat(this.state.fieldValues.frac_fav_mutn) !== parseFloat(this.state.defaultValues.frac_fav_mutn) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'frac_fav_mutn',
                        content: 'While some sources suggest this number might be as high as 1:1000, most sources suggest it is more realistically about 1:1,000,000. For studying the accumulation of only deleterious or only beneficial mutations, the fraction of beneficials can be set to zero or 1.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Fraction of the total number of mutations that are perfectly neutral'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.fraction_neutral,
                        onChange: this.fieldChangeHandlers.fraction_neutral,
                    }),
                    (parseFloat(this.state.fieldValues.fraction_neutral) !== parseFloat(this.state.defaultValues.fraction_neutral) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'frac_fav_mutn',
                        content: 'It is not clear that any mutations are perfectly neutral, but in the past it has often been claimed that most of the human genome is non-function “junk DNA”, and that mutations in these regions are truly neutral. For the human default, we allow (but do not believe) that 90% of the genome is junk DNA, and so 90% of all human mutations have absolutely no biological effect. Because of the computational cost of tracking so many neutral mutations we specify zero neutrals be simulated, and discount the genome size so it only reflects non-neutral mutations.',
                        url: HELP_URL_PREFIX + 'fmun',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Fitness effect model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.fitness_effect_model,
                            onChange: this.fieldChangeHandlers.fitness_effect_model,
                        },
                        React.createElement('option', { value: 'fixed' }, 'Fixed'),
                        React.createElement('option', { value: 'uniform' }, 'Uniform'),
                        React.createElement('option', { value: 'weibull' }, 'Weibull (default)'),
                    ),
                    (this.state.fieldValues.fitness_effect_model !== this.state.defaultValues.fitness_effect_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'fitness_effect_model',
                        content: 'Choices: "weibull" - the fitness effect of each mutation is determined by the Weibull distribution, "fixed" - use fixed values for mutation fitness effect as set in uniform_fitness_effect_*, or "uniform" - even distribution between 0 and uniform_fitness_effect_* as max.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For fixed: effect for each deleterious mutation'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '0.1',
                        step: 'any',
                        disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                        value: this.state.fieldValues.uniform_fitness_effect_del,
                        onChange: this.fieldChangeHandlers.uniform_fitness_effect_del,
                    }),
                    (parseFloat(this.state.fieldValues.uniform_fitness_effect_del) !== parseFloat(this.state.defaultValues.uniform_fitness_effect_del) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'uniform_fitness_effect_del',
                        content: 'Used for fitness_effect_model=fixed. Each deleterious mutation should have this fitness effect.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For fixed: effect for each beneficial mutation'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '0.1',
                        step: 'any',
                        disabled: this.state.fieldValues.fitness_effect_model !== 'fixed',
                        value: this.state.fieldValues.uniform_fitness_effect_fav,
                        onChange: this.fieldChangeHandlers.uniform_fitness_effect_fav,
                    }),
                    (parseFloat(this.state.fieldValues.uniform_fitness_effect_fav) !== parseFloat(this.state.defaultValues.uniform_fitness_effect_fav) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'uniform_fitness_effect_fav',
                        content: 'Used for fitness_effect_model=fixed. Each beneficial mutation should have this fitness effect.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Fraction of deleterious mutations with “major effect”'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0.000000001',
                        max: '0.9',
                        step: 'any',
                        value: this.state.fieldValues.high_impact_mutn_fraction,
                        onChange: this.fieldChangeHandlers.high_impact_mutn_fraction,
                    }),
                    (parseFloat(this.state.fieldValues.high_impact_mutn_fraction) !== parseFloat(this.state.defaultValues.high_impact_mutn_fraction) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'high_impact_mutn_fraction',
                        content: 'Most mutations have an effect on fitness that is too small to measure directly. However, mutations will have measurable effects in the far “tail” of the mutation distribution curve. By utilizing the frequency and distribution of “measurable” mutation effects, one can constrain the most significant portion of the distribution curve as it relates to the selection process. For most species, there may not yet be enough data, even for the major mutations, to accurately model the exact distribution of mutations. When such data is not yet available, we are forced to simply estimate, to the best of our ability and based on data from other organisms, the fraction of “major mutations”.  The human default is 0.001.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Minimum deleterious effect defined as “major”'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0.0001',
                        max: '0.9',
                        step: 'any',
                        value: this.state.fieldValues.high_impact_mutn_threshold,
                        onChange: this.fieldChangeHandlers.high_impact_mutn_threshold,
                    }),
                    (parseFloat(this.state.fieldValues.high_impact_mutn_threshold) !== parseFloat(this.state.defaultValues.high_impact_mutn_threshold) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'high_impact_mutn_threshold',
                        content: 'A somewhat arbitrary level must be selected for defining what constitutes a “measurable”, or “major”, mutation effect. MENDEL uses a default value for this cut-off of 0.10. This is because under realistic clinical conditions, it is questionable that we can reliably measure a single mutation’s fitness effect when it changes fitness by less than 10%.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Maximum beneficial fitness effect'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.max_fav_fitness_gain,
                        onChange: this.fieldChangeHandlers.max_fav_fitness_gain,
                    }),
                    (parseFloat(this.state.fieldValues.max_fav_fitness_gain) !== parseFloat(this.state.defaultValues.max_fav_fitness_gain) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'max_fav_fitness_gain',
                        content: 'A realistic upper limit must be placed upon beneficial mutations. This is because a single nucleotide change can expand total biological functionality of an organism only to a limited degree. The larger the genome and the greater the total genomic information, the less a single nucleotide is likely to increase the total. Researchers must make a judgment for themselves of what is a reasonable maximal value for a single base change. The MENDEL default value for this limit is 0.01. This limit implies that a single point mutation can increase total biological functionality by as much as 1%.',
                        url: HELP_URL_PREFIX + 'rdbm',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Fraction recessive (rest dominant)'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.fraction_recessive,
                        onChange: this.fieldChangeHandlers.fraction_recessive,
                    }),
                    (parseFloat(this.state.fieldValues.fraction_recessive) !== parseFloat(this.state.defaultValues.fraction_recessive) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'fraction_recessive',
                        content: 'This parameter simply specifies the percentage of mutations that are recessive. If set to 0.8, then 80% of mutations are recessive, so the remaining 20% will automatically be made dominant.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Expression of recessive mutations (in heterozygote)'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '0.5',
                        step: 'any',
                        value: this.state.fieldValues.recessive_hetero_expression,
                        onChange: this.fieldChangeHandlers.recessive_hetero_expression,
                    }),
                    (parseFloat(this.state.fieldValues.recessive_hetero_expression) !== parseFloat(this.state.defaultValues.recessive_hetero_expression) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'recessive_hetero_expression',
                        content: 'It is widely believed that recessive mutations are not completely silent in the heterozygous condition, but are still expressed at some low level. Although the co-dominance value is 0.5 expression, a reasonable setting would be 0.05.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Expression of dominant mutations (in heterozygote)'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0.5',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.dominant_hetero_expression,
                        onChange: this.fieldChangeHandlers.dominant_hetero_expression,
                    }),
                    (parseFloat(this.state.fieldValues.dominant_hetero_expression) !== parseFloat(this.state.defaultValues.dominant_hetero_expression) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'dominant_hetero_expression',
                        content: 'It is widely believed that dominant mutations are not completely dominant in the heterozygous condition, but are only expressed only at some very high level. Although the co-dominance value is 0.5, a reasonable setting would be 0.95.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Selection'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Selection model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.selection_model,
                            onChange: this.fieldChangeHandlers.selection_model,
                        },
                        React.createElement('option', { value: 'fulltrunc' }, 'Full truncation'),
                        React.createElement('option', { value: 'ups' }, 'Unrestricted probability selection'),
                        React.createElement('option', { value: 'spps' }, 'Strict proportionality probability selection (default)'),
                        React.createElement('option', { value: 'partialtrunc' }, 'Partial truncation'),
                    ),
                    (this.state.fieldValues.selection_model !== this.state.defaultValues.selection_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Heritability'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.heritability,
                        onChange: this.fieldChangeHandlers.heritability,
                    }),
                    (parseFloat(this.state.fieldValues.heritability) !== parseFloat(this.state.defaultValues.heritability) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'heritability',
                        content: 'Because a large part of phenotypic performance is affected by an individual’s circumstances (the “environment”), selection in nature is less effective than would be predicted simply from genotypic fitness values. Non-heritable environmental effects on phenotypic performance must be modeled realistically. A heritability value of 0.2 implies that on average, only 20% of an individual’s phenotypic performance is passed on to the next generation, with the rest being due to non-heritable factors. For a very general character such as reproductive fitness, 0.2 is an extremely generous heritability value. In most field contexts, it is in fact usually lower than this, typically being below the limit of detection.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Non-scaling noise'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.non_scaling_noise,
                        onChange: this.fieldChangeHandlers.non_scaling_noise,
                    }),
                    (parseFloat(this.state.fieldValues.non_scaling_noise) !== parseFloat(this.state.defaultValues.non_scaling_noise) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'non_scaling_noise',
                        content: 'If a population’s fitness is increasing or declining, heritability (as calculated in the normal way), tends to scale with fitness, and so the implied “environmental noise” diminishes or increases as fitness diminishes or increases. This seems counter-intuitive. Also, with truncation selection, phenotypic variance becomes un-naturally small. For these reasons, it is desirable to model a component of environmental noise that does not scale with fitness variation. The units for this non-scaling noise parameter are based upon standard deviations from the initial fitness of 1.0. For simplicity, a reasonable value is 0.05, but reasonable values probably exceed 0.01 and might exceed 0.1.',
                        url: HELP_URL_PREFIX + 'nsn',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'For partial truncation: partial truncation value'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.partial_truncation_value,
                        onChange: this.fieldChangeHandlers.partial_truncation_value,
                    }),
                    (parseFloat(this.state.fieldValues.partial_truncation_value) !== parseFloat(this.state.defaultValues.partial_truncation_value) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'partial_truncation_value',
                        content: 'Used in Parial Truncation selection, an individuals fitness is divided by: partial_truncation_value + (1. - partial_truncation_value)*randomnum(1).',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Output Files'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'mendel.fit'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.fieldValues.files_to_output_fit,
                            onChange: this.fieldChangeHandlers.files_to_output_fit,
                        }),
                    ),
                    (this.state.fieldValues.files_to_output_fit !== this.state.defaultValues.files_to_output_fit ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'files_to_output',
                        content: 'This contains data needed for the "Fitness History" plot.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'mendel.hst'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.fieldValues.files_to_output_hst,
                            onChange: this.fieldChangeHandlers.files_to_output_hst,
                        }),
                    ),
                    (this.state.fieldValues.files_to_output_hst !== this.state.defaultValues.files_to_output_hst ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'files_to_output',
                        content: 'This contains data needed for the "Average Mutations/Individual" plot.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Allele bin and distribution files'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.fieldValues.files_to_output_allele_bins,
                            onChange: this.fieldChangeHandlers.files_to_output_allele_bins,
                        }),
                    ),
                    (this.state.fieldValues.files_to_output_allele_bins !== this.state.defaultValues.files_to_output_allele_bins ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'files_to_output',
                        content: 'This contains data needed for the "SNP Frequencies", "Minor Allele Frequencies", and allele distribution plots.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__actions' },
                    React.createElement('input', { className: 'new-job-view__action button', type: 'submit', value: 'Start' }),
                    React.createElement('div', { className: 'new-job-view__action button button--text', onClick: this.onImportClick }, 'Import'),
                    React.createElement('div', { className: 'new-job-view__action button button--text', onClick: this.onExportClick }, 'Export'),
                ),
            )
        );
    }
}

function stateToConfig(state: StateConfig) {
    return [
        '[basic]',
        'pop_size = ' + tomlInt(state.pop_size),
        'num_generations = ' + tomlInt(state.num_generations),

        '[mutations]',
        'mutn_rate = ' + tomlFloat(state.mutn_rate),
        'genome_size = ' + tomlInt(state.genome_size),
        'mutn_rate_model = ' + tomlString(state.mutn_rate_model),
        'frac_fav_mutn = ' + tomlFloat(state.frac_fav_mutn),
        'fraction_neutral = ' + tomlFloat(state.fraction_neutral),
        'fitness_effect_model = ' + tomlString(state.fitness_effect_model),
        'uniform_fitness_effect_del = ' + tomlFloat(state.uniform_fitness_effect_del),
        'uniform_fitness_effect_fav = ' + tomlFloat(state.uniform_fitness_effect_fav),
        'high_impact_mutn_fraction = ' + tomlFloat(state.high_impact_mutn_fraction),
        'high_impact_mutn_threshold = ' + tomlFloat(state.high_impact_mutn_threshold),
        'max_fav_fitness_gain = ' + tomlFloat(state.max_fav_fitness_gain),
        'fraction_recessive = ' + tomlFloat(state.fraction_recessive),
        'recessive_hetero_expression = ' + tomlFloat(state.recessive_hetero_expression),
        'dominant_hetero_expression = ' + tomlFloat(state.dominant_hetero_expression),

        '[selection]',
        'selection_model = ' + tomlString(state.selection_model),
        'heritability = ' + tomlFloat(state.heritability),
        'non_scaling_noise = ' + tomlFloat(state.non_scaling_noise),
        'partial_truncation_value = ' + tomlFloat(state.partial_truncation_value),

        '[computation]',
        'plot_allele_gens = 1',
        'files_to_output = ' + tomlString(
            filesToOutputString(
                state.files_to_output_fit,
                state.files_to_output_hst,
                state.files_to_output_allele_bins
            )
        ),
    ].join('\n');
}

function configToState(config: ServerConfig) {
    const filesToOutput = filesToOutputBooleans(config.computation.files_to_output);

    return {
        pop_size: config.basic.pop_size.toString(),
        num_generations: config.basic.num_generations.toString(),
        mutn_rate: config.mutations.mutn_rate.toString(),
        genome_size: config.mutations.genome_size.toString(),
        mutn_rate_model: config.mutations.mutn_rate_model,
        frac_fav_mutn: config.mutations.frac_fav_mutn.toString(),
        fraction_neutral: config.mutations.fraction_neutral.toString(),
        fitness_effect_model: config.mutations.fitness_effect_model,
        uniform_fitness_effect_del: config.mutations.uniform_fitness_effect_del.toString(),
        uniform_fitness_effect_fav: config.mutations.uniform_fitness_effect_fav.toString(),
        high_impact_mutn_fraction: config.mutations.high_impact_mutn_fraction.toString(),
        high_impact_mutn_threshold: config.mutations.high_impact_mutn_threshold.toString(),
        max_fav_fitness_gain: config.mutations.max_fav_fitness_gain.toString(),
        fraction_recessive: config.mutations.fraction_recessive.toString(),
        recessive_hetero_expression: config.mutations.recessive_hetero_expression.toString(),
        dominant_hetero_expression: config.mutations.dominant_hetero_expression.toString(),
        selection_model: config.selection.selection_model,
        heritability: config.selection.heritability.toString(),
        non_scaling_noise: config.selection.non_scaling_noise.toString(),
        partial_truncation_value: config.selection.partial_truncation_value.toString(),
        files_to_output_fit: filesToOutput.fit,
        files_to_output_hst: filesToOutput.hst,
        files_to_output_allele_bins: filesToOutput.alleles,
    };
}

function filesToOutputString(fit: boolean, hst: boolean, alleles: boolean) {
    if (fit && hst && alleles) {
        return '*';
    } else {
        const outputFiles = [];

        if (fit) {
            outputFiles.push('mendel.fit');
        }

        if (hst) {
            outputFiles.push('mendel.hst');
        }

        if (alleles) {
            outputFiles.push('allele-bins/');
            outputFiles.push('normalized-allele-bins/');
            outputFiles.push('allele-distribution-del/');
            outputFiles.push('allele-distribution-fav/');
        }

        return outputFiles.join(',');
    }
}

function filesToOutputBooleans(s: string) {
    if (s === '*') {
        return {
            fit: true,
            hst: true,
            alleles: true,
        };
    }

    const parts = s.split(',').map(x => x.trim());

    return {
        fit: parts.indexOf('mendel.fit') >= 0,
        hst: parts.indexOf('mendel.hst') >= 0,
        alleles: (
            parts.indexOf('allele-bins/') >= 0 &&
            parts.indexOf('normalized-allele-bins/') >= 0 &&
            parts.indexOf('allele-distribution-del/') >= 0 &&
            parts.indexOf('allele-distribution-fav/') >= 0
        ),
    };
}

// In TOML ints must NOT contain a period
function tomlInt(s: string) {
    return parseInt(s).toString();
}

// In TOML floats must contain a period
function tomlFloat(s: string) {
    if (s.includes('.')) {
        return s;
    } else {
        return s + '.0';
    }
}

function tomlString(s: string) {
    return '"' + s + '"';
}

function chooseFileContents(callback: (content: string) => void) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();

    const onChange = () => {
        const f = assertNotNull(input.files)[0];
        const reader = new FileReader();
        reader.onload = () => {
            callback(reader.result as string);
        };
        reader.readAsText(f);
    };

    input.addEventListener('change', onChange, { once: true });
}

export const NewJob = ReactRedux.connect()(Component);
