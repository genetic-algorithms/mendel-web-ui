import { fetchGetSmart } from '../util';
import { Header } from './header';
import { Content } from './content';

function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        fetchCurrentUser: () => {
            fetchGetSmart(
                '/api/get-current-user/',
                dispatch,
            ).then(response => {
                dispatch({
                    type: 'USER',
                    value: response,
                });
            });
        },
    };
}

export class Component extends React.Component {
    componentDidMount() {
        this.props.fetchCurrentUser();
    }

    render() {
        return React.createElement('div', null,
            (this.props.route == '/login/' ? null : React.createElement('div', { className: 'page-header__spacer' })),
            (this.props.route == '/login/' ? null : React.createElement(Header, null)),
            React.createElement(Content, null),
        );
    }
}

export const Root = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
