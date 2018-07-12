function mapDispatchToProps(dispatch) {
    return {
        onShowLogin: () => {
            dispatch({
                type: 'ROUTE',
                value: '/login/',
            });
            history.pushState(null, null, '/login/');
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.fieldChangeHandlers = {
            pop_size: (e) => this.simpleFieldChanged('pop_size', e),
            num_generations: (e) => this.simpleFieldChanged('num_generations', e),
        };

        this.state = {
            loading: true,
            data: null,
            fieldValues: {
                pop_size: '1000',
                num_generations: '200',
            },
        };
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
                React.createElement('form', { className: 'new-job-view__form' },
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

                    React.createElement('input', { className: 'button', type: 'submit', value: 'Submit' }),
                )
            )
        );
    }
}

export const NewJob = ReactRedux.connect(null, mapDispatchToProps)(Component);
