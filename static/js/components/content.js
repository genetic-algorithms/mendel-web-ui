import { NewJob } from './views/new_job';
import { Login } from './views/login';

function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

function getView(route) {
    if (route === '/') {
        return React.createElement(NewJob, {});
    } else if (route === '/login/') {
        return React.createElement(Login, {});
    } else {
        return null;
    }
}

function Component(props) {
    return React.createElement('div', { className: 'page-content' },
        getView(props.route),
    );
}

export const Content = ReactRedux.connect(mapStateToProps)(Component);
