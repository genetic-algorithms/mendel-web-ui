import { Checkbox } from '../checkbox';

function mapDispatchToProps(dispatch) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
        onSubmit: (data) => {
            fetch('/api/new-job/create/', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    const url = '/job-detail/' + responseJson.job_id + '/';
                    dispatch({
                        type: 'ROUTE',
                        value: url,
                    });
                    history.pushState(null, null, url);
                });
            });
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fieldChangeHandlers = {
            title: (e) => this.simpleFieldChanged('title', e),
            pop_size: (e) => this.simpleFieldChanged('pop_size', e),
            num_generations: (e) => this.simpleFieldChanged('num_generations', e),
            mutn_rate: (e) => this.simpleFieldChanged('mutn_rate', e),
            fitness_effect_model: (e) => this.simpleFieldChanged('fitness_effect_model', e),
            files_to_output_fit: (checked) => this.checkboxFieldChanged('files_to_output_fit', checked),
            files_to_output_hst: (checked) => this.checkboxFieldChanged('files_to_output_hst', checked),
            files_to_output_allele_bins: (checked) => this.checkboxFieldChanged('files_to_output_allele_bins', checked),
        };

        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            loading: true,
            data: null,
            fieldValues: {
                title: '',
                pop_size: '1000',
                num_generations: '200',
                mutn_rate: '50.0',
                fitness_effect_model: 'weibull',
                uniform_fitness_effect_del: '0.0001',
                uniform_fitness_effect_fav: '0.0001',
                files_to_output_fit: true,
                files_to_output_hst: true,
                files_to_output_allele_bins: true,
            },
        };
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.onSubmit({
            title: this.state.fieldValues.title,
            config: [
                '[basic]',
                'pop_size = ' + tomlInt(this.state.fieldValues.pop_size),
                'num_generations = ' + tomlInt(this.state.fieldValues.num_generations),

                '[mutations]',
                'mutn_rate = ' + tomlFloat(this.state.fieldValues.mutn_rate),
                'fitness_effect_model = ' + tomlString(this.state.fieldValues.fitness_effect_model),
                'uniform_fitness_effect_del = ' + tomlFloat(this.state.fieldValues.uniform_fitness_effect_del),
                'uniform_fitness_effect_fav = ' + tomlFloat(this.state.fieldValues.uniform_fitness_effect_fav),

                '[computation]',
                'plot_allele_gens = 1',
                'files_to_output = ' + tomlString(
                    filesToOutputString(
                        this.state.fieldValues.files_to_output_fit,
                        this.state.fieldValues.files_to_output_hst,
                        this.state.fieldValues.files_to_output_allele_bins
                    )
                ),
            ].join('\n'),
        });
    }

    simpleFieldChanged(id, e) {
        const value = e.target.value;

        this.setState(prevState => {
            const newFieldValues = Object.assign({}, prevState.fieldValues);
            newFieldValues[id] = value;

            return Object.assign({}, prevState, {
                fieldValues: newFieldValues,
            });
        });
    }

    checkboxFieldChanged(id, checked) {
        this.setState(prevState => {
            const newFieldValues = Object.assign({}, prevState.fieldValues);
            newFieldValues[id] = checked;

            return Object.assign({}, prevState, {
                fieldValues: newFieldValues,
            });
        });
    }

    componentDidMount() {
        fetch('/api/new-job/', {
            credentials: 'same-origin',
        }).then(response => {
            if (response.status === 401) {
                this.props.onShowLogin();
            } else {
                response.json().then(responseJson => {
                    this.setState({
                        loading: false,
                        data: responseJson,
                    });
                });
            }
        });
    }

    render() {
        return React.createElement('div', { className: 'new-job-view' },
            (this.state.loading ?
                React.createElement('div', { className: 'new-job-view__loading' }) :
                React.createElement('form', { className: 'new-job-view__form', onSubmit: this.onSubmit },
                    React.createElement('div', { className: 'new-job-view__form-section-title' }, 'Metadata'),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Job title'),
                        React.createElement('input', {
                            type: 'text',
                            value: this.state.fieldValues.title,
                            onChange: this.fieldChangeHandlers.title,
                        }),
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
                    ),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'mendel.hst'),
                        React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                            React.createElement(Checkbox, {
                                checked: this.state.fieldValues.files_to_output_hst,
                                onChange: this.fieldChangeHandlers.files_to_output_hst,
                            }),
                        ),
                    ),
                    React.createElement('div', { className: 'new-job-view__field' },
                        React.createElement('label', {}, 'Allele bin and distribution files'),
                        React.createElement('div', { className: 'new-job-view__checkbox-wrapper' },
                            React.createElement(Checkbox, {
                                checked: this.state.fieldValues.files_to_output_allele_bins,
                                onChange: this.fieldChangeHandlers.files_to_output_allele_bins,
                            }),
                        ),
                    ),

                    React.createElement('input', { className: 'button', type: 'submit', value: 'Submit' }),
                )
            )
        );
    }
}

function filesToOutputString(fit, hst, alleles) {
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

// In TOML ints must NOT contain a period
function tomlInt(s) {
    return parseInt(s).toString();
}

// In TOML floats must contain a period
function tomlFloat(s) {
    if (s.includes('.')) {
        return s;
    } else {
        return s + '.0';
    }
}

function tomlString(s) {
    return '"' + s + '"';
}

export const NewJob = ReactRedux.connect(null, mapDispatchToProps)(Component);
