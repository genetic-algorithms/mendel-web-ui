import { Header } from './header';
import { Content } from './content';

function mapDispatchToProps(dispatch) {
    return {
        setRoute: url => {
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
    };
}

export class Component extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loadingIndicatorCount: 0,
        };

        this.loadingIndicator = {
            increment: () => {
                this.setState(prevState => ({
                    loadingIndicatorCount: prevState.loadingIndicatorCount + 1,
                }));
            },
            decrement: () => {
                this.setState(prevState => ({
                    loadingIndicatorCount: Math.max(prevState.loadingIndicatorCount - 1, 0),
                }));
            },
        };
    }

    render() {
        return React.createElement('div', null,
            React.createElement(Header, {
                setRoute: this.props.setRoute,
                loading: this.state.loadingIndicatorCount !== 0,
            }),
            React.createElement(Content, {
                setRoute: this.props.setRoute,
                loadingIndicator: this.loadingIndicator,
            }),
        );
    }
}

export const Root = ReactRedux.connect(null, mapDispatchToProps)(Component);
