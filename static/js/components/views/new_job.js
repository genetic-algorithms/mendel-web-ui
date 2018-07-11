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

        this.state = {
            loading: true,
            data: null,
        };
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
                )
            )
        );
    }
}

export const NewJob = ReactRedux.connect(null, mapDispatchToProps)(Component);
