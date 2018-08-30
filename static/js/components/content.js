import { NewJob } from './views/new_job';
import { Login } from './views/login';
import { JobDetail } from './views/job_detail';
import { JobListing } from './views/job_listing';

function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

function getView(route) {
    const jobDetailMatch = route.match(new RegExp('^/jobs/(\\w+)/$'));

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
