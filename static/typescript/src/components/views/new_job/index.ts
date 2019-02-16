import { Checkbox } from '../../checkbox';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { apiPost, apiGet } from '../../../api';
import { setRoute, assertNotNull } from '../../../util';
import { Help } from './help';

/*
The NewJob component displays the virtual page to fill in the job parameters.
 */

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
    reproductive_rate: string;
    num_offspring_model: 'uniform' | 'fixed';
    crossover_model: 'none' | 'partial' | 'full';
    mean_num_crossovers: string;
    haploid_chromosome_number: string;
    num_linkage_subunits: string;
    num_contrasting_alleles: string;
    max_total_fitness_increase: string;
    initial_allele_fitness_model: 'variablefreq' | 'allunique';
    initial_alleles_pop_frac: string;
    initial_alleles_frequencies: string;
    pop_growth_model: 'none' | 'exponential' | 'capacity' | 'founders' | 'multi-bottleneck';
    pop_growth_rate: string;
    pop_growth_rate2: string;
    max_pop_size: string;
    carrying_capacity: string;
    bottleneck_generation: string;
    bottleneck_pop_size: string;
    num_bottleneck_generations: string;
    multiple_bottlenecks: string;
    files_to_output_fit: boolean;
    files_to_output_hst: boolean;
    files_to_output_allele_bins: boolean;
    tracking_threshold: string;
    track_neutrals: boolean;
    extinction_threshold: string;
    plot_allele_gens: string;
    omit_first_allele_bin: boolean;
    verbosity: string;
    random_number_seed: string;
    num_threads: string;
    force_gc: boolean;
    allele_count_gc_interval: string;
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
    population: {
        reproductive_rate: number;
        num_offspring_model: 'uniform' | 'fixed';
        crossover_model: 'none' | 'partial' | 'full';
        mean_num_crossovers: number;
        haploid_chromosome_number: number;
        num_linkage_subunits: number;
        num_contrasting_alleles: number;
        max_total_fitness_increase: number;
        initial_allele_fitness_model: 'variablefreq' | 'allunique';
        initial_alleles_pop_frac: number;
        initial_alleles_frequencies: string;
        pop_growth_model: 'none' | 'exponential' | 'capacity' | 'founders' | 'multi-bottleneck';
        pop_growth_rate: number;
        pop_growth_rate2: number;
        max_pop_size: number;
        carrying_capacity: number;
        bottleneck_generation: number;
        bottleneck_pop_size: number;
        num_bottleneck_generations: number;
        multiple_bottlenecks: string;
    },
    computation: {
        files_to_output: string;
        tracking_threshold: number;
        track_neutrals: boolean;
        extinction_threshold: number;
        plot_allele_gens: number;
        omit_first_allele_bin: boolean;
        verbosity: number;
        random_number_seed: number;
        num_threads: number;
        force_gc: boolean;
        allele_count_gc_interval: number;
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
        reproductive_rate: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_offspring_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        crossover_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        mean_num_crossovers: (e: React.ChangeEvent<HTMLInputElement>) => void;
        haploid_chromosome_number: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_linkage_subunits: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_contrasting_alleles: (e: React.ChangeEvent<HTMLInputElement>) => void;
        max_total_fitness_increase: (e: React.ChangeEvent<HTMLInputElement>) => void;
        initial_allele_fitness_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        initial_alleles_pop_frac: (e: React.ChangeEvent<HTMLInputElement>) => void;
        initial_alleles_frequencies: (e: React.ChangeEvent<HTMLInputElement>) => void;
        pop_growth_model: (e: React.ChangeEvent<HTMLInputElement>) => void;
        pop_growth_rate: (e: React.ChangeEvent<HTMLInputElement>) => void;
        pop_growth_rate2: (e: React.ChangeEvent<HTMLInputElement>) => void;
        max_pop_size: (e: React.ChangeEvent<HTMLInputElement>) => void;
        carrying_capacity: (e: React.ChangeEvent<HTMLInputElement>) => void;
        bottleneck_generation: (e: React.ChangeEvent<HTMLInputElement>) => void;
        bottleneck_pop_size: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_bottleneck_generations: (e: React.ChangeEvent<HTMLInputElement>) => void;
        multiple_bottlenecks: (e: React.ChangeEvent<HTMLInputElement>) => void;
        files_to_output_fit: (checked: boolean) => void;
        files_to_output_hst: (checked: boolean) => void;
        files_to_output_allele_bins: (checked: boolean) => void;
        tracking_threshold: (e: React.ChangeEvent<HTMLInputElement>) => void;
        track_neutrals: (checked: boolean) => void;
        extinction_threshold: (e: React.ChangeEvent<HTMLInputElement>) => void;
        plot_allele_gens: (e: React.ChangeEvent<HTMLInputElement>) => void;
        omit_first_allele_bin: (checked: boolean) => void;
        verbosity: (e: React.ChangeEvent<HTMLInputElement>) => void;
        random_number_seed: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_threads: (e: React.ChangeEvent<HTMLInputElement>) => void;
        force_gc: (checked: boolean) => void;
        allele_count_gc_interval: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
            reproductive_rate: e => this.simpleFieldChanged('reproductive_rate', e),
            num_offspring_model: e => this.simpleFieldChanged('num_offspring_model', e),
            crossover_model: e => this.simpleFieldChanged('crossover_model', e),
            mean_num_crossovers: e => this.simpleFieldChanged('mean_num_crossovers', e),
            haploid_chromosome_number: e => this.simpleFieldChanged('haploid_chromosome_number', e),
            num_linkage_subunits: e => this.simpleFieldChanged('num_linkage_subunits', e),
            num_contrasting_alleles: e => this.simpleFieldChanged('num_contrasting_alleles', e),
            max_total_fitness_increase: e => this.simpleFieldChanged('max_total_fitness_increase', e),
            initial_allele_fitness_model: e => this.simpleFieldChanged('initial_allele_fitness_model', e),
            initial_alleles_pop_frac: e => this.simpleFieldChanged('initial_alleles_pop_frac', e),
            initial_alleles_frequencies: e => this.simpleFieldChanged('initial_alleles_frequencies', e),
            pop_growth_model: e => this.simpleFieldChanged('pop_growth_model', e),
            pop_growth_rate: e => this.simpleFieldChanged('pop_growth_rate', e),
            pop_growth_rate2: e => this.simpleFieldChanged('pop_growth_rate2', e),
            max_pop_size: e => this.simpleFieldChanged('max_pop_size', e),
            carrying_capacity: e => this.simpleFieldChanged('carrying_capacity', e),
            bottleneck_generation: e => this.simpleFieldChanged('bottleneck_generation', e),
            bottleneck_pop_size: e => this.simpleFieldChanged('bottleneck_pop_size', e),
            num_bottleneck_generations: e => this.simpleFieldChanged('num_bottleneck_generations', e),
            multiple_bottlenecks: e => this.simpleFieldChanged('multiple_bottlenecks', e),
            files_to_output_fit: checked => this.checkboxFieldChanged('files_to_output_fit', checked),
            files_to_output_hst: checked => this.checkboxFieldChanged('files_to_output_hst', checked),
            files_to_output_allele_bins: checked => this.checkboxFieldChanged('files_to_output_allele_bins', checked),
            tracking_threshold: e => this.simpleFieldChanged('tracking_threshold', e),
            track_neutrals: checked => this.checkboxFieldChanged('track_neutrals', checked),
            extinction_threshold: e => this.simpleFieldChanged('extinction_threshold', e),
            plot_allele_gens: e => this.simpleFieldChanged('plot_allele_gens', e),
            omit_first_allele_bin: checked => this.checkboxFieldChanged('omit_first_allele_bin', checked),
            verbosity: e => this.simpleFieldChanged('verbosity', e),
            random_number_seed: e => this.simpleFieldChanged('random_number_seed', e),
            num_threads: e => this.simpleFieldChanged('num_threads', e),
            force_gc: checked => this.checkboxFieldChanged('force_gc', checked),
            allele_count_gc_interval: e => this.simpleFieldChanged('allele_count_gc_interval', e),
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
            reproductive_rate: '',
            num_offspring_model: 'fixed',
            crossover_model: 'partial',
            mean_num_crossovers: '',
            haploid_chromosome_number: '',
            num_linkage_subunits: '',
            num_contrasting_alleles: '',
            max_total_fitness_increase: '',
            initial_allele_fitness_model: 'variablefreq',
            initial_alleles_pop_frac: '',
            initial_alleles_frequencies: '',
            pop_growth_model: 'none',
            pop_growth_rate: '',
            pop_growth_rate2: '',
            max_pop_size: '',
            carrying_capacity: '',
            bottleneck_generation: '',
            bottleneck_pop_size: '',
            num_bottleneck_generations: '',
            multiple_bottlenecks: '',
            files_to_output_fit: true,
            files_to_output_hst: true,
            files_to_output_allele_bins: true,
            tracking_threshold: '',
            track_neutrals: false,
            extinction_threshold: '',
            plot_allele_gens: '',
            omit_first_allele_bin: false,
            verbosity: '',
            random_number_seed: '',
            num_threads: '',
            force_gc: false,
            allele_count_gc_interval: '',
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

    // Initialize the fields with values from the defaults file, or from the relevant job
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
                    (parseInt(this.state.fieldValues.pop_size) !== parseInt(this.state.defaultValues.pop_size) ?
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
                    (parseInt(this.state.fieldValues.num_generations) !== parseInt(this.state.defaultValues.num_generations) ?
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
                    (parseFloat(this.state.fieldValues.genome_size) !== parseFloat(this.state.defaultValues.genome_size) ?
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
                        disabled: (
                            this.state.fieldValues.fitness_effect_model !== 'fixed' ||
                            parseFloat(this.state.fieldValues.frac_fav_mutn) === 0
                        ),
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
                        disabled: parseFloat(this.state.fieldValues.frac_fav_mutn) === 0,
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
                    React.createElement('label', {}, 'For Partial Truncation: partial truncation value'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        disabled: this.state.fieldValues.selection_model !== 'partialtrunc',
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

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Population'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Reproductive rate'),
                    React.createElement('input', {
                        type: 'number',
                        min: '1',
                        max: '25',
                        step: 'any',
                        value: this.state.fieldValues.reproductive_rate,
                        onChange: this.fieldChangeHandlers.reproductive_rate,
                    }),
                    (parseFloat(this.state.fieldValues.reproductive_rate) !== parseFloat(this.state.defaultValues.reproductive_rate) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'reproductive_rate',
                        content: 'This is the number of offspring per reproducing individual. When population size is constant, this variable defines the maximum amount of selection. There must be an average of at least one offspring per individual (after the selection process) for the population to maintain its size and avoid rapid extinction. Except where random death is considered, the entire surplus population is removed based upon phenotypic selection. The typical value for humans is two offspring per selected individual (or four offspring per reproducing female).',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Num offspring model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.num_offspring_model,
                            onChange: this.fieldChangeHandlers.num_offspring_model,
                        },
                        React.createElement('option', { value: 'uniform' }, 'Uniform'),
                        React.createElement('option', { value: 'fixed' }, 'Fixed (default)'),
                    ),
                    (this.state.fieldValues.num_offspring_model !== this.state.defaultValues.num_offspring_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'num_offspring_model',
                        content: 'Choices: "fixed" - reproductive_rate rounded to the nearest integer, or "uniform" - an even distribution such that the mean is reproductive_rate',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Crossover model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.crossover_model,
                            onChange: this.fieldChangeHandlers.crossover_model,
                        },
                        React.createElement('option', { value: 'none' }, 'None'),
                        React.createElement('option', { value: 'partial' }, 'Partial (default)'),
                        React.createElement('option', { value: 'full' }, 'Full'),
                    ),
                    (this.state.fieldValues.crossover_model !== this.state.defaultValues.crossover_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'crossover_model',
                        content: 'Choices: "partial" - mean_num_crossovers per chromosome pair, "none" - no crossover, or "full" - each LB has a 50/50 chance of coming from dad or mom',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For Partial: Mean crossovers per chromosome pair'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100',
                        step: '1',
                        disabled: this.state.fieldValues.crossover_model !== 'partial',
                        value: this.state.fieldValues.mean_num_crossovers,
                        onChange: this.fieldChangeHandlers.mean_num_crossovers,
                    }),
                    (parseInt(this.state.fieldValues.mean_num_crossovers) !== parseInt(this.state.defaultValues.mean_num_crossovers) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'mean_num_crossovers',
                        content: 'Used only for crossover_model=partial. The average number of crossovers per chromosome PAIR during Meiosis 1 Metaphase.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Haploid chromosome number'),
                    React.createElement('input', {
                        type: 'number',
                        min: '1',
                        max: '100',
                        step: '1',
                        value: this.state.fieldValues.haploid_chromosome_number,
                        onChange: this.fieldChangeHandlers.haploid_chromosome_number,
                    }),
                    (parseInt(this.state.fieldValues.haploid_chromosome_number) !== parseInt(this.state.defaultValues.haploid_chromosome_number) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'haploid_chromosome_number',
                        content: 'The number of linkage blocks is evenly distributed over a user-specified haploid number of chromosomes (default=23).',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Number of linkage subunits per individual'),
                    React.createElement('input', {
                        type: 'number',
                        min: '1',
                        max: '100000',
                        step: '1',
                        value: this.state.fieldValues.num_linkage_subunits,
                        onChange: this.fieldChangeHandlers.num_linkage_subunits,
                    }),
                    (parseInt(this.state.fieldValues.num_linkage_subunits) !== parseInt(this.state.defaultValues.num_linkage_subunits) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'num_linkage_subunits',
                        content: 'The number of linkage blocks. The number of linkage blocks should be an integer multiple of the number of chromosome (e.g. the default value of 989 is 43 times the default 23 chromosomes).',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Number of initial contrasting alleles per individual'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1000000000',
                        step: '1',
                        value: this.state.fieldValues.num_contrasting_alleles,
                        onChange: this.fieldChangeHandlers.num_contrasting_alleles,
                    }),
                    (parseInt(this.state.fieldValues.num_contrasting_alleles) !== parseInt(this.state.defaultValues.num_contrasting_alleles) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'num_contrasting_alleles',
                        content: 'Number of initial contrasting alleles (pairs) given to each individual. Used to start the population with pre-existing diversity.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'The total fitness effect of all of the favorable initial alleles in an individual'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: 'any',
                        disabled: parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0,
                        value: this.state.fieldValues.max_total_fitness_increase,
                        onChange: this.fieldChangeHandlers.max_total_fitness_increase,
                    }),
                    (parseFloat(this.state.fieldValues.max_total_fitness_increase) !== parseFloat(this.state.defaultValues.max_total_fitness_increase) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'max_total_fitness_increase',
                        content: 'Used along with num_contrasting_alleles to set the total fitness effect of all of the favorable initial alleles in an individual.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'Initial Alleles model'),
                    React.createElement('select',
                        {
                            disabled: parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0,
                            value: this.state.fieldValues.initial_allele_fitness_model,
                            onChange: this.fieldChangeHandlers.initial_allele_fitness_model,
                        },
                        React.createElement('option', { value: 'variablefreq' }, 'Variable Frequencies (default)'),
                        React.createElement('option', { value: 'allunique' }, 'All Unique Alleles'),
                    ),
                    (this.state.fieldValues.initial_allele_fitness_model !== this.state.defaultValues.initial_allele_fitness_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'initial_allele_fitness_model',
                        content: 'Choices: "variablefreq" - different frequenceis for different fraction of the alleles like 0.25:0.1, 0.5:0.25, 0.25:0.5, "allunique" - unique allele pairs in every indiv',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For All Unique: Fraction of the population with initial alleles'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        disabled: (
                            parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0 ||
                            this.state.fieldValues.initial_allele_fitness_model === 'variablefreq'
                        ),
                        value: this.state.fieldValues.initial_alleles_pop_frac,
                        onChange: this.fieldChangeHandlers.initial_alleles_pop_frac,
                    }),
                    (parseFloat(this.state.fieldValues.initial_alleles_pop_frac) !== parseFloat(this.state.defaultValues.initial_alleles_pop_frac) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'initial_alleles_pop_frac',
                        content: 'Used for All Unique model along with num_contrasting_alleles to set the fraction of the initial population that should have num_contrasting_alleles alleles',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For Variable Frequencies: alleleFraction1:frequency1, alleleFraction2:frequency2, ...'),
                    React.createElement('input', {
                        type: 'text',
                        disabled: (
                            parseFloat(this.state.fieldValues.num_contrasting_alleles) === 0 ||
                            this.state.fieldValues.initial_allele_fitness_model === 'allunique'
                        ),
                        value: this.state.fieldValues.initial_alleles_frequencies,
                        onChange: this.fieldChangeHandlers.initial_alleles_frequencies,
                    }),
                    (this.state.fieldValues.initial_alleles_frequencies !== this.state.defaultValues.initial_alleles_frequencies ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'initial_alleles_frequencies',
                        content: 'Used for Variable Frequencies model along with num_contrasting_alleles to define portions of the total num_contrasting_alleles alleles and what frequency each should have',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Population growth model'),
                    React.createElement('select',
                        {
                            value: this.state.fieldValues.pop_growth_model,
                            onChange: this.fieldChangeHandlers.pop_growth_model,
                        },
                        React.createElement('option', { value: 'none' }, 'None (default)'),
                        React.createElement('option', { value: 'exponential' }, 'Exponential'),
                        React.createElement('option', { value: 'capacity' }, 'Carrying capacity'),
                        React.createElement('option', { value: 'founders' }, 'Founders effect'),
                        React.createElement('option', { value: 'multi-bottleneck' }, 'Multiple bottlenecks'),
                    ),
                    (this.state.fieldValues.pop_growth_model !== this.state.defaultValues.pop_growth_model ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'pop_growth_model',
                        content: 'Choices: "none" - no population growth, "exponential" - exponential growth model until max pop or number of generations, "capacity" - pop growth to asymptotically approach the pop carrying capacity, "founders" - exponential growth until bottleneck generations, a 2nd exponential growth rate after bottleneck until the carrying capacity or number of generations is reached, "multi-bottleneck" - like founders except an arbitrary number of comma-separated 5-tuples growth-rate:max-pop:bottle-start:bottle-size:bottle-gens',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'Population growth rate each generation'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '10',
                        step: 'any',
                        disabled: (
                            this.state.fieldValues.pop_growth_model === 'none' ||
                            this.state.fieldValues.pop_growth_model === 'multi-bottleneck'
                        ),
                        value: this.state.fieldValues.pop_growth_rate,
                        onChange: this.fieldChangeHandlers.pop_growth_rate,
                    }),
                    (parseFloat(this.state.fieldValues.pop_growth_rate) !== parseFloat(this.state.defaultValues.pop_growth_rate) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'pop_growth_rate',
                        content: 'Population growth rate each generation (e.g. 1.05 is 5% increase). Used for pop_growth_model==Exponential, Carrying capacity, and Founders effect.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For Founders: Population growth rate after the bottleneck'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '10',
                        step: 'any',
                        disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                        value: this.state.fieldValues.pop_growth_rate2,
                        onChange: this.fieldChangeHandlers.pop_growth_rate2,
                    }),
                    (parseFloat(this.state.fieldValues.pop_growth_rate2) !== parseFloat(this.state.defaultValues.pop_growth_rate2) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'pop_growth_rate2',
                        content: 'Population growth rate after the population bottleneck. Used for pop_growth_model==Founders effect.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For Exponential: Maximum population size'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        disabled: this.state.fieldValues.pop_growth_model !== 'exponential',
                        value: this.state.fieldValues.max_pop_size,
                        onChange: this.fieldChangeHandlers.max_pop_size,
                    }),
                    (parseInt(this.state.fieldValues.max_pop_size) !== parseInt(this.state.defaultValues.max_pop_size) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'max_pop_size',
                        content: 'The run will stop when this population size is reached or num_generations is reached, whichever comes first. Set to 0 for no max. Used for pop_growth_model==exponential.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'Population carrying capacity'),
                    React.createElement('input', {
                        type: 'number',
                        min: '10',
                        max: '100000',
                        step: '1',
                        disabled: (
                            this.state.fieldValues.pop_growth_model === 'none' ||
                            this.state.fieldValues.pop_growth_model === 'exponential' ||
                            this.state.fieldValues.pop_growth_model === 'multi-bottleneck'
                        ),
                        value: this.state.fieldValues.carrying_capacity,
                        onChange: this.fieldChangeHandlers.carrying_capacity,
                    }),
                    (parseInt(this.state.fieldValues.carrying_capacity) !== parseInt(this.state.defaultValues.carrying_capacity) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'carrying_capacity',
                        content: 'The limit that the population size should approach. Used for pop_growth_model==Carrying capacity and Founders effect.',
                        url: 'https://en.wikipedia.org/wiki/Carrying_capacity',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'Generation number of a population bottleneck'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                        value: this.state.fieldValues.bottleneck_generation,
                        onChange: this.fieldChangeHandlers.bottleneck_generation,
                    }),
                    (parseInt(this.state.fieldValues.bottleneck_generation) !== parseInt(this.state.defaultValues.bottleneck_generation) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'bottleneck_generation',
                        content: 'The generation number at which the population size bottleneck should start. Use 0 for no bottleneck. Currently only used for pop_growth_model==founders',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'The population size during the bottleneck'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                        value: this.state.fieldValues.bottleneck_pop_size,
                        onChange: this.fieldChangeHandlers.bottleneck_pop_size,
                    }),
                    (parseInt(this.state.fieldValues.bottleneck_pop_size) !== parseInt(this.state.defaultValues.bottleneck_pop_size) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'The number of generations the bottleneck should last'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        disabled: this.state.fieldValues.pop_growth_model !== 'founders',
                        value: this.state.fieldValues.num_bottleneck_generations,
                        onChange: this.fieldChangeHandlers.num_bottleneck_generations,
                    }),
                    (parseInt(this.state.fieldValues.num_bottleneck_generations) !== parseInt(this.state.defaultValues.num_bottleneck_generations) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                ),

                React.createElement('div', { className: 'new-job-view__field new-job-view--indented' },
                    React.createElement('label', {}, 'For Multiple Bottlenecks: growth-rate:max-pop:bottle-start:bottle-size:bottle-gens, …'),
                    React.createElement('input', {
                        type: 'text',
                        disabled: this.state.fieldValues.pop_growth_model !== 'multi-bottleneck',
                        value: this.state.fieldValues.multiple_bottlenecks,
                        onChange: this.fieldChangeHandlers.multiple_bottlenecks,
                    }),
                    (this.state.fieldValues.multiple_bottlenecks !== this.state.defaultValues.multiple_bottlenecks ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'multiple_bottlenecks',
                        content: 'Used for Multiple Bottlenecks population growth model, instead of any of the other population growth and bottleneck parameters.',
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

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Computation'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Do not track mutations below this fitness effect'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '10',
                        step: 'any',
                        disabled: !this.state.fieldValues.files_to_output_allele_bins,
                        value: this.state.fieldValues.tracking_threshold,
                        onChange: this.fieldChangeHandlers.tracking_threshold,
                    }),
                    (parseFloat(this.state.fieldValues.tracking_threshold) !== parseFloat(this.state.defaultValues.tracking_threshold) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'tracking_threshold',
                        content: 'Below this fitness effect value, near neutral mutations will be pooled into the cumulative fitness of the LB, instead of tracked individually. This saves on memory and computation time, but some stats will not be available. This value is automatically set to a high value if allele output is not requested, because there is no benefit to tracking in that case.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Track neutral mutations'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.fieldValues.track_neutrals,
                            onChange: this.fieldChangeHandlers.track_neutrals,
                        }),
                    ),
                    (this.state.fieldValues.track_neutrals !== this.state.defaultValues.track_neutrals ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'track_neutrals',
                        content: 'Checking this box will cause Mendel to track neutral mutations as long as tracking_threshold is also set to 0.0. This button must be checked if neutral mutations are to be simulated.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'End simulation if population fitness falls to this'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '1',
                        step: 'any',
                        value: this.state.fieldValues.extinction_threshold,
                        onChange: this.fieldChangeHandlers.extinction_threshold,
                    }),
                    (parseFloat(this.state.fieldValues.extinction_threshold) !== parseFloat(this.state.defaultValues.extinction_threshold) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'extinction_threshold',
                        content: 'If the mean fitness of the population falls to this value or below, it is considered mutational meltdown and the simulation is stopped.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Plot alleles every n generations'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        disabled: !this.state.fieldValues.files_to_output_allele_bins,
                        value: this.state.fieldValues.plot_allele_gens,
                        onChange: this.fieldChangeHandlers.plot_allele_gens,
                    }),
                    (parseInt(this.state.fieldValues.plot_allele_gens) !== parseInt(this.state.defaultValues.plot_allele_gens) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'plot_allele_gens',
                        content: 'A value of 0 means only plot alleles for the last generation.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Omit the 1st allele bin'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            disabled: !this.state.fieldValues.files_to_output_allele_bins,
                            checked: this.state.fieldValues.omit_first_allele_bin,
                            onChange: this.fieldChangeHandlers.omit_first_allele_bin,
                        }),
                    ),
                    (this.state.fieldValues.omit_first_allele_bin !== this.state.defaultValues.omit_first_allele_bin ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'omit_first_allele_bin',
                        content: 'If checked, do not output the 0-1% allele bin for allele plots. This is consistent with the way most geneticists plot this data.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'The verbosity of the output'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        value: this.state.fieldValues.verbosity,
                        onChange: this.fieldChangeHandlers.verbosity,
                    }),
                    (parseInt(this.state.fieldValues.verbosity) !== parseInt(this.state.defaultValues.verbosity) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'verbosity',
                        content: 'A value of 1 is recommended. Higher values will output more information, but will also take longer to gather.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Advanced Options'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Random number generator (RNG) seed'),
                    React.createElement('input', {
                        type: 'number',
                        min: '-9223372036854775808',
                        max: '9223372036854775807',
                        step: '1',
                        value: this.state.fieldValues.random_number_seed,
                        onChange: this.fieldChangeHandlers.random_number_seed,
                    }),
                    (parseInt(this.state.fieldValues.random_number_seed) !== parseInt(this.state.defaultValues.random_number_seed) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'random_number_seed',
                        content: 'At several stages within the MENDEL program, a random number generator is required. When an experiment needs to be independently replicated, the “random number seed” must be changed. If this is not done, the second experiment will be an exact duplicate of the earlier run. Or you can set this value to 0 and get a unique seed every time.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Number of CPUs to use for the simulation'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        value: this.state.fieldValues.num_threads,
                        onChange: this.fieldChangeHandlers.num_threads,
                    }),
                    (parseInt(this.state.fieldValues.num_threads) !== parseInt(this.state.defaultValues.num_threads) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'num_threads',
                        content: 'The number of concurrent CPU threads that should be used in the simulation. If this is set to 0 (recommended) it will automatically use all available CPUs.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Force system garbage collection each generation'),
                    React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                        React.createElement(Checkbox, {
                            checked: this.state.fieldValues.force_gc,
                            onChange: this.fieldChangeHandlers.force_gc,
                        }),
                    ),
                    (this.state.fieldValues.force_gc !== this.state.defaultValues.force_gc ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'force_gc',
                        content: 'Check this box to explicitly run Go garbage collection after mating each generation. (Otherwise Go decides when to run gargage collection.) Setting this can cut memory usage, sometimes as much as 40%, but it also increases the run time.',
                    }),
                ),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Run Go garbage collection during allele counting after this %'),
                    React.createElement('input', {
                        type: 'number',
                        min: '0',
                        max: '100000',
                        step: '1',
                        value: this.state.fieldValues.allele_count_gc_interval,
                        onChange: this.fieldChangeHandlers.allele_count_gc_interval,
                    }),
                    (parseInt(this.state.fieldValues.allele_count_gc_interval) !== parseInt(this.state.defaultValues.allele_count_gc_interval) ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                    React.createElement(Help, {
                        title: 'allele_count_gc_interval',
                        content: 'if 0 < n < 100 explicitly call Go garbage collection after counting this percent of individuals (with a min bound of 100 individuals and max bound of 500), or if n >= 100 call GC after counting alleles from this many individuals. This helps memory not balloon right at the end of a long run, but will take a little longer.',
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
        'genome_size = ' + tomlFloat(state.genome_size),
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

        '[population]',
        'reproductive_rate = ' + tomlFloat(state.reproductive_rate),
        'num_offspring_model = ' + tomlString(state.num_offspring_model),
        'crossover_model = ' + tomlString(state.crossover_model),
        'mean_num_crossovers = ' + tomlInt(state.mean_num_crossovers),
        'haploid_chromosome_number = ' + tomlInt(state.haploid_chromosome_number),
        'num_linkage_subunits = ' + tomlInt(state.num_linkage_subunits),
        'num_contrasting_alleles = ' + tomlInt(state.num_contrasting_alleles),
        'max_total_fitness_increase = ' + tomlFloat(state.max_total_fitness_increase),
        'initial_allele_fitness_model = ' + tomlString(state.initial_allele_fitness_model),
        'initial_alleles_pop_frac = ' + tomlFloat(state.initial_alleles_pop_frac),
        'initial_alleles_frequencies = ' + tomlString(state.initial_alleles_frequencies),
        'pop_growth_model = ' + tomlString(state.pop_growth_model),
        'pop_growth_rate = ' + tomlFloat(state.pop_growth_rate),
        'pop_growth_rate2 = ' + tomlFloat(state.pop_growth_rate2),
        'max_pop_size = ' + tomlInt(state.max_pop_size),
        'carrying_capacity = ' + tomlInt(state.carrying_capacity),
        'bottleneck_generation = ' + tomlInt(state.bottleneck_generation),
        'bottleneck_pop_size = ' + tomlInt(state.bottleneck_pop_size),
        'num_bottleneck_generations = ' + tomlInt(state.num_bottleneck_generations),
        'multiple_bottlenecks = ' + tomlString(state.multiple_bottlenecks),

        '[computation]',
        'files_to_output = ' + tomlString(
            filesToOutputString(
                state.files_to_output_fit,
                state.files_to_output_hst,
                state.files_to_output_allele_bins
            )
        ),
        'tracking_threshold = ' + tomlFloat(state.tracking_threshold),
        'track_neutrals = ' + tomlBoolean(state.track_neutrals),
        'extinction_threshold = ' + tomlFloat(state.extinction_threshold),
        'plot_allele_gens = ' + tomlInt(state.plot_allele_gens),
        'omit_first_allele_bin = ' + tomlBoolean(state.omit_first_allele_bin),
        'verbosity = ' + tomlInt(state.verbosity),
        'random_number_seed = ' + tomlInt(state.random_number_seed),
        'num_threads = ' + tomlInt(state.num_threads),
        'force_gc = ' + tomlBoolean(state.force_gc),
        'allele_count_gc_interval = ' + tomlInt(state.allele_count_gc_interval),
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
        reproductive_rate: config.population.reproductive_rate.toString(),
        num_offspring_model: config.population.num_offspring_model,
        crossover_model: config.population.crossover_model,
        mean_num_crossovers: config.population.mean_num_crossovers.toString(),
        haploid_chromosome_number: config.population.haploid_chromosome_number.toString(),
        num_linkage_subunits: config.population.num_linkage_subunits.toString(),
        num_contrasting_alleles: config.population.num_contrasting_alleles.toString(),
        max_total_fitness_increase: config.population.max_total_fitness_increase.toString(),
        initial_allele_fitness_model: config.population.initial_allele_fitness_model,
        initial_alleles_pop_frac: config.population.initial_alleles_pop_frac.toString(),
        initial_alleles_frequencies: config.population.initial_alleles_frequencies,
        pop_growth_model: config.population.pop_growth_model,
        pop_growth_rate: config.population.pop_growth_rate.toString(),
        pop_growth_rate2: config.population.pop_growth_rate2.toString(),
        max_pop_size: config.population.max_pop_size.toString(),
        carrying_capacity: config.population.carrying_capacity.toString(),
        bottleneck_generation: config.population.bottleneck_generation.toString(),
        bottleneck_pop_size: config.population.bottleneck_pop_size.toString(),
        num_bottleneck_generations: config.population.num_bottleneck_generations.toString(),
        multiple_bottlenecks: config.population.multiple_bottlenecks,
        files_to_output_fit: filesToOutput.fit,
        files_to_output_hst: filesToOutput.hst,
        files_to_output_allele_bins: filesToOutput.alleles,
        tracking_threshold: config.computation.tracking_threshold.toString(),
        track_neutrals: config.computation.track_neutrals,
        extinction_threshold: config.computation.extinction_threshold.toString(),
        plot_allele_gens: config.computation.plot_allele_gens.toString(),
        omit_first_allele_bin: config.computation.omit_first_allele_bin,
        verbosity: config.computation.verbosity.toString(),
        random_number_seed: config.computation.random_number_seed.toString(),
        num_threads: config.computation.num_threads.toString(),
        force_gc: config.computation.force_gc,
        allele_count_gc_interval: config.computation.allele_count_gc_interval.toString(),
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

function tomlBoolean(b: boolean) {
    return b ? 'true' : 'false';
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
