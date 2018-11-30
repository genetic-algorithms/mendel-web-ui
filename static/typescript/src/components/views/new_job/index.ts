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
    title: string;
    pop_size: string;
    num_generations: string;
    mutn_rate: string;
    fitness_effect_model: 'fixed' | 'uniform' | 'weibull';
    uniform_fitness_effect_del: string;
    uniform_fitness_effect_fav: string;
    files_to_output_fit: boolean;
    files_to_output_hst: boolean;
    files_to_output_allele_bins: boolean;
};

type State = {
    defaultValues: StateConfig;
    fieldValues: StateConfig;
};

class Component extends React.Component<Props, State> {
    fieldChangeHandlers: {
        title: (e: React.ChangeEvent<HTMLInputElement>) => void;
        pop_size: (e: React.ChangeEvent<HTMLInputElement>) => void;
        num_generations: (e: React.ChangeEvent<HTMLInputElement>) => void;
        mutn_rate: (e: React.ChangeEvent<HTMLInputElement>) => void;
        fitness_effect_model: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        uniform_fitness_effect_del: (e: React.ChangeEvent<HTMLInputElement>) => void;
        uniform_fitness_effect_fav: (e: React.ChangeEvent<HTMLInputElement>) => void;
        files_to_output_fit: (checked: boolean) => void;
        files_to_output_hst: (checked: boolean) => void;
        files_to_output_allele_bins: (checked: boolean) => void;
    };

    constructor(props: Props) {
        super(props);

        this.fieldChangeHandlers = {
            title: e => this.simpleFieldChanged('title', e),
            pop_size: e => this.simpleFieldChanged('pop_size', e),
            num_generations: e => this.simpleFieldChanged('num_generations', e),
            mutn_rate: e => this.simpleFieldChanged('mutn_rate', e),
            fitness_effect_model: e => this.simpleFieldChanged('fitness_effect_model', e),
            uniform_fitness_effect_del: e => this.simpleFieldChanged('uniform_fitness_effect_del', e),
            uniform_fitness_effect_fav: e => this.simpleFieldChanged('uniform_fitness_effect_fav', e),
            files_to_output_fit: checked => this.checkboxFieldChanged('files_to_output_fit', checked),
            files_to_output_hst: checked => this.checkboxFieldChanged('files_to_output_hst', checked),
            files_to_output_allele_bins: checked => this.checkboxFieldChanged('files_to_output_allele_bins', checked),
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.onImportClick = this.onImportClick.bind(this);
        this.onExportClick = this.onExportClick.bind(this);

        this.state = {
            defaultValues: {
                title: '',
                pop_size: '',
                num_generations: '',
                mutn_rate: '',
                fitness_effect_model: 'weibull',
                uniform_fitness_effect_del: '',
                uniform_fitness_effect_fav: '',
                files_to_output_fit: true,
                files_to_output_hst: true,
                files_to_output_allele_bins: true,
            },
            fieldValues: {
                title: '',
                pop_size: '',
                num_generations: '',
                mutn_rate: '',
                fitness_effect_model: 'weibull',
                uniform_fitness_effect_del: '',
                uniform_fitness_effect_fav: '',
                files_to_output_fit: true,
                files_to_output_hst: true,
                files_to_output_allele_bins: true,
            },
        };
    }

    onImportClick() {
        chooseFileContents(contents => {
            const config = toml.parse(contents);
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
            title: this.state.fieldValues.title,
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
                React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Metadata'),

                React.createElement('div', { className: 'new-job-view__field' },
                    React.createElement('label', {}, 'Job title'),
                    React.createElement('input', {
                        type: 'text',
                        value: this.state.fieldValues.title,
                        onChange: this.fieldChangeHandlers.title,
                    }),
                    (this.state.fieldValues.title !== this.state.defaultValues.title ?
                        React.createElement('div', { className: 'new-job-view__not-default' }) :
                        null
                    ),
                ),

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

                React.createElement('div', { className: 'new-job-view__field' },
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

                React.createElement('div', { className: 'new-job-view__field' },
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
        'fitness_effect_model = ' + tomlString(state.fitness_effect_model),
        'uniform_fitness_effect_del = ' + tomlFloat(state.uniform_fitness_effect_del),
        'uniform_fitness_effect_fav = ' + tomlFloat(state.uniform_fitness_effect_fav),

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

function configToState(config: any) {
    const filesToOutput = filesToOutputBooleans(config.computation.files_to_output);

    return {
        title: '',
        pop_size: config.basic.pop_size.toString(),
        num_generations: config.basic.num_generations.toString(),
        mutn_rate: config.mutations.mutn_rate.toString(),
        fitness_effect_model: config.mutations.fitness_effect_model,
        uniform_fitness_effect_del: config.mutations.uniform_fitness_effect_del.toString(),
        uniform_fitness_effect_fav: config.mutations.uniform_fitness_effect_fav.toString(),
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

export const NewJob = ReactRedux.connect()(Component);
