(function () {
    'use strict';

    function reducer(state, action) {
        if (state === undefined) {
            return {
                page_loaded: false,
                page_data: {},
                authenticated: false,
                route: location.pathname,
            };
        }

        switch (action.type) {
            case 'PAGE_LOADED':
                return immer.default(state, draft => {
                    draft.page_loaded = true;
                    draft.page_data = action.page_data;
                    draft.authenticated = action.authenticated;
                });
            case 'ROUTE':
                return immer.default(state, draft => {
                    draft.route = action.value;
                });
            default:
                return state;
        }
    }

    function mapStateToProps(state) {
        return {
            route: state.route,
        };
    }

    function mapDispatchToProps(dispatch) {
        return {
            onNewJobTabClick: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/',
                });
                history.pushState(null, null, '/');
            },
            onJobsTabClick: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/jobs/',
                });
                history.pushState(null, null, '/jobs/');
            },
        };
    }

    function Component(props) {
        return React.createElement('div', { className: 'page-header' },
            React.createElement('div', { className: 'page-header__tabs' },
                React.createElement('div', {
                    className: 'page-header__tab ' + (props.route === '/' ? 'page-header--active-tab' : ''),
                    onClick: props.onNewJobTabClick,
                }, 'New Job'),
                React.createElement('div', {
                    className: 'page-header__tab ' + (props.route === '/jobs/' ? 'page-header--active-tab' : ''),
                    onClick: props.onJobsTabClick,
                }, 'Jobs'),
            ),
        );
    }

    const Header = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);

    function mapDispatchToProps$1(dispatch) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
            onSubmit: (fieldValues) => {
                fetch('/api/new-job/create/', {
                    method: 'POST',
                    body: JSON.stringify(fieldValues),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                }).then(response => {
                    response.json().then(responseJson => {
                        const url = '/jobs/' + responseJson.job_id + '/';
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

    class Component$1 extends React.Component {
        constructor(props) {
            super(props);

            this.fieldChangeHandlers = {
                pop_size: (e) => this.simpleFieldChanged('pop_size', e),
                num_generations: (e) => this.simpleFieldChanged('num_generations', e),
            };

            this.onSubmit = this.onSubmit.bind(this);

            this.state = {
                loading: true,
                data: null,
                fieldValues: {
                    pop_size: '1000',
                    num_generations: '200',
                },
            };
        }

        onSubmit(e) {
            e.preventDefault();
            this.props.onSubmit(this.state.fieldValues);
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

    const NewJob = ReactRedux.connect(null, mapDispatchToProps$1)(Component$1);

    function mapDispatchToProps$2(dispatch) {
        return {
            onShowHome: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/',
                });
                history.pushState(null, null, '/');
            },
        };
    }

    class Component$2 extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                password: '',
                submitting: false,
                wrongCredentials: false,
            };

            this.onPasswordChange = this.onPasswordChange.bind(this);
            this.onSubmit = this.onSubmit.bind(this);
        }

        onPasswordChange(e) {
            const value = e.target.value;

            this.setState((prevState) => (Object.assign({}, prevState, {
                password: value,
            })));
        }

        onSubmit(e) {
            e.preventDefault();

            if (this.state.submitting) return;

            this.setState((prevState) => (Object.assign({}, prevState, {
                submitting: true,
            })));

            fetch('/api/login/', {
                method: 'POST',
                body: JSON.stringify({
                    password: this.state.password,
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
            }).then(
                response => response.json()
            ).then(responseJson => {
                if (responseJson.status === 'success') {
                    this.props.onShowHome();
                } else if (responseJson.status === 'wrong_credentials') {
                    this.setState({
                        password: '',
                        submitting: false,
                        wrongCredentials: true,
                    });
                }
            });
        }

        render() {
            return React.createElement('div', { className: 'login-view' },
                React.createElement('div', { className: 'login-view__title' }, 'Login'),
                React.createElement('form', { className: 'login-view__form', onSubmit: this.onSubmit },
                    React.createElement('input', {
                        className: 'login-view__input',
                        type: 'password',
                        placeholder: 'Password',
                        value: this.state.password,
                        required: true,
                        onChange: this.onPasswordChange,
                    }),

                    (this.state.wrongCredentials ?
                        React.createElement('div', { className: 'login-view__form-error' }, 'Incorrect password') :
                        null
                    ),

                    React.createElement('input', {
                        className: 'login-view__submit button',
                        type: 'submit',
                        value: this.state.submitting ? 'Processing…' : 'Login',
                    }),
                ),
            );
        }
    }

    const Login = ReactRedux.connect(null, mapDispatchToProps$2)(Component$2);

    function mapDispatchToProps$3(dispatch, ownProps) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
            onPlotsClick: () => {
                const url = '/jobs/' + ownProps.jobId + '/plots/average-mutations/';

                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$3 extends React.Component {
        constructor(props) {
            super(props);

            this.fetchOutput = this.fetchOutput.bind(this);

            this.state = {
                output: '',
                done: false,
            };

            this.mounted = false;
            this.outputOffset = 0;
        }

        componentDidMount() {
            this.mounted = true;
            this.fetchOutput();
        }

        componentWillUnmount() {
            this.mounted = false;
        }

        fetchOutput() {
            if (!this.mounted) return;

            fetch('/api/job-output/?jobId=' + encodeURIComponent(this.props.jobId) + '&offset=' + encodeURIComponent(this.outputOffset), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    this.outputOffset += responseJson.output.length;

                    this.setState((prevState, props) => ({
                        output: prevState.output + responseJson.output,
                        done: responseJson.done,
                    }));

                    if (!responseJson.done) {
                        this.timeout = setTimeout(this.fetchOutput, 1000);
                    }
                });
            });
        }

        render() {
            return React.createElement('div', { className: 'job-detail-view' },
                React.createElement('div', { className: 'job-detail-view__title' },
                    'Job',
                    React.createElement('span', { className: 'job-detail-view__job-id' }, this.props.jobId),
                ),
                React.createElement('pre', { className: 'job-detail-view__output' }, this.state.output),
                React.createElement('div', { className: 'job-detail-view__bottom' },
                    React.createElement('div', { className: 'job-detail-view__status' },
                        'Status: ' + (this.state.done ? 'Done' : 'Running')
                    ),
                    (this.state.done ?
                        React.createElement('div',
                            {
                                className: 'job-detail-view__plots-button button',
                                onClick: this.props.onPlotsClick,
                            },
                            'Plots',
                        ) :
                        null
                    ),
                ),
            );
        }
    }

    const JobDetail = ReactRedux.connect(null, mapDispatchToProps$3)(Component$3);

    function mapDispatchToProps$4(dispatch) {
        return {
            onShowLogin: () => {
                dispatch({
                    type: 'ROUTE',
                    value: '/login/',
                });
                history.pushState(null, null, '/login/');
            },
            onClick: (jobId) => {
                const url = '/jobs/' + jobId + '/';
                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$4 extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                jobs: [],
            };

            this.mounted = false;
        }

        componentDidMount() {
            this.mounted = true;

            fetch('/api/job-list/', {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    this.setState({
                        jobs: responseJson.jobs,
                    });
                });
            });
        }

        componentWillUnmount() {
            this.mounted = false;
        }

        render() {
            return React.createElement('div', { className: 'job-listing-view' },
                React.createElement('div', { className: 'job-listing-view__title' }, 'Jobs'),
                React.createElement('div', { className: 'job-listing-view__jobs' },
                    React.createElement('div', { className: 'job-listing-view__labels' },
                        React.createElement('div', { className: 'job-listing-view__labels__id' }, 'Job ID'),
                        React.createElement('div', { className: 'job-listing-view__labels__time' }, 'Time'),
                        React.createElement('div', { className: 'job-listing-view__labels__status' }, 'Status'),
                    ),

                    this.state.jobs.map(job => (
                        React.createElement('div',
                            {
                                className: 'job-listing-view__job',
                                key: job.job_id,
                                onClick: () => this.props.onClick(job.job_id),
                            },
                            React.createElement('div', { className: 'job-listing-view__job__id' }, job.job_id),
                            React.createElement('div', { className: 'job-listing-view__job__time' }, job.time),
                            React.createElement('div', { className: 'job-listing-view__job__status' },
                                (job.done ? 'Done' : 'Running'),
                            ),
                        )
                    )),
                ),
            );
        }
    }

    const JobListing = ReactRedux.connect(null, mapDispatchToProps$4)(Component$4);

    const LINKS = [
        {
            title: 'Average mutations/individual',
            slug: 'average-mutations',
        },
        {
            title: 'Fitness history',
            slug: 'fitness-history',
        },
        {
            title: 'Distribution of accumulated mutations (deleterious)',
            slug: 'deleterious-mutations',
        },
        {
            title: 'Distribution of accumulated mutations (beneficial)',
            slug: 'beneficial-mutations',
        },
        {
            title: 'SNP Frequencies',
            slug: 'snp-frequencies',
        },
        {
            title: 'Minor Allele Frequencies',
            slug: 'minor-allele-frequencies',
        },
    ];

    function mapDispatchToProps$5(dispatch, ownProps) {
        return {
            onClick: (slug) => {
                const url = '/jobs/' + ownProps.jobId + '/plots/' + slug + '/';
                dispatch({
                    type: 'ROUTE',
                    value: url,
                });
                history.pushState(null, null, url);
            },
        };
    }

    class Component$5 extends React.Component {
        render() {
            return React.createElement('div', { className: 'plots-view__sidebar' },
                LINKS.map(link => (
                    React.createElement('div', {
                        className: 'plots-view__sidebar__item ' + (this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                        onClick: () => this.props.onClick(link.slug),
                        key: link.slug,
                    }, link.title)
                )),
            );
        }
    }

    const Sidebar = ReactRedux.connect(null, mapDispatchToProps$5)(Component$5);

    class AverageMutations extends React.Component {
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
            fetch('/api/plot-average-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    const data = [
                        {
                            x: responseJson.generations,
                            y: responseJson.deleterious,
                            type: 'scatter',
                            name: 'Deleterious',
                            line: {
                                color: 'rgb(200, 0, 0)',
                            },
                        },
                        {
                            x: responseJson.generations,
                            y: responseJson.neutral,
                            type: 'scatter',
                            name: 'Neutral',
                            line: {
                                color: 'rgb(0, 0, 200)',
                            },
                        },
                        {
                            x: responseJson.generations,
                            y: responseJson.favorable,
                            type: 'scatter',
                            name: 'Favorable',
                            line: {
                                color: 'rgb(0, 200, 0)',
                            },
                        },
                    ];

                    const layout = {
                        title: 'Average mutations/individual',
                        xaxis: {
                            title: 'Generations',
                        },
                        yaxis: {
                            title: 'Mutations',
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
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'average-mutations' }),
                React.createElement('div', { className: 'plots-view__non-sidebar' },
                    React.createElement('div', { className: 'plots-view__plot', ref: el => this.plotElement = el }),
                ),
            );
        }
    }

    class FitnessHistory extends React.Component {
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

    class DeleteriousMutations extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.mounted = false;
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
            fetch('/api/plot-deleterious-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

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
                        title: 'Distribution of accumulated mutations (deleterious)',
                        xaxis: {
                            title: 'Mutational Fitness Degradation',
                            type: 'log',
                            autorange: 'reversed',
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

            this.mounted = true;
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.mounted = false;
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'deleterious-mutations' }),
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

    class BeneficialMutations extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.mounted = false;
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
            fetch('/api/plot-beneficial-mutations/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

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

            this.mounted = true;
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.mounted = false;
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

    class SnpFrequencies extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.mounted = false;
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

        componentDidMount() {
            fetch('/api/plot-snp-frequencies/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    let maxY = 0;
                    for (let generation of responseJson) {
                        for (let n of generation.deleterious) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.favorable) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.neutral) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.delInitialAlleles) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }

                        for (let n of generation.favInitialAlleles) {
                            if (n > maxY) {
                                maxY = n;
                            }
                        }
                    }

                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
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

                    const layout = {
                        title: 'SNP Frequencies',
                        xaxis: {
                            title: 'SNP Frequencies',
                        },
                        yaxis: {
                            title: 'Number of Alleles',
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

            this.mounted = true;
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.mounted = false;
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'snp-frequencies' }),
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

    class MinorAlleleFrequencies extends React.Component {
        constructor(props) {
            super(props);

            this.resizePlot = this.resizePlot.bind(this);
            this.sliderInputChange = this.sliderInputChange.bind(this);

            this.mounted = false;
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

        componentDidMount() {
            fetch('/api/plot-minor-allele-frequencies/?jobId=' + encodeURIComponent(this.props.jobId), {
                credentials: 'same-origin',
            }).then(response => {
                response.json().then(responseJson => {
                    if (!this.mounted) return;

                    const generationData = responseJson[responseJson.length - 1];

                    const data = [
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

                    const layout = {
                        title: 'SNP Frequencies',
                        xaxis: {
                            title: 'SNP Frequencies',
                        },
                        yaxis: {
                            title: 'Number of Alleles',
                            range: [0, 1],
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

            this.mounted = true;
        }

        componentWillUnmount() {
            Plotly.purge(this.plotElement);
            window.removeEventListener('resize', this.resizePlot);
            this.mounted = false;
        }

        render() {
            return React.createElement('div', { className: 'plots-view' },
                React.createElement(Sidebar, { jobId: this.props.jobId, activeSlug: 'minor-allele-frequencies' }),
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

    function mapStateToProps$1(state) {
        return {
            route: state.route,
        };
    }

    function getView(route) {
        const jobDetailMatch = route.match(new RegExp('^/jobs/(\\w+)/$'));
        const plotMatch = route.match(new RegExp('^/jobs/(\\w+)/plots/([\\w-]+)/$'));

        if (route === '/') {
            return React.createElement(NewJob, {});
        } else if (route === '/login/') {
            return React.createElement(Login, {});
        } else if (route === '/jobs/') {
            return React.createElement(JobListing, {});
        } else if (jobDetailMatch) {
            return React.createElement(JobDetail, {
                jobId: jobDetailMatch[1],
            });
        } else if (plotMatch) {
            const jobId = plotMatch[1];

            if (plotMatch[2] === 'average-mutations') {
                return React.createElement(AverageMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'fitness-history') {
                return React.createElement(FitnessHistory, { jobId: jobId });
            } else if (plotMatch[2] === 'deleterious-mutations') {
                return React.createElement(DeleteriousMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'beneficial-mutations') {
                return React.createElement(BeneficialMutations, { jobId: jobId });
            } else if (plotMatch[2] === 'snp-frequencies') {
                return React.createElement(SnpFrequencies, { jobId: jobId });
            } else if (plotMatch[2] === 'minor-allele-frequencies') {
                return React.createElement(MinorAlleleFrequencies, { jobId: jobId });
            }
        } else {
            return null;
        }
    }

    function Component$6(props) {
        return React.createElement('div', { className: 'page-content' },
            getView(props.route),
        );
    }

    const Content = ReactRedux.connect(mapStateToProps$1)(Component$6);

    function init() {
        const store = Redux.createStore(reducer);

        const root = React.createElement(ReactRedux.Provider, { store: store },
            React.createElement('div', null,
                React.createElement(Header, {}),
                React.createElement(Content, {}),
            ),
        );

        ReactDOM.render(root, document.getElementById('react-root'));

        window.addEventListener('popstate', () => {
            store.dispatch({
                type: 'ROUTE',
                value: location.pathname,
            });
        });
    }

    init();

}());
