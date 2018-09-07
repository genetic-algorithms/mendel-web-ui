import { NewJob } from './views/new_job';
import { Login } from './views/login';
import { JobDetail } from './views/job_detail';
import { JobListing } from './views/job_listing';
import { AverageMutations } from './views/plots/average_mutations';
import { FitnessHistory } from './views/plots/fitness_history';
import { DeleteriousMutations } from './views/plots/deleterious_mutations';

function mapStateToProps(state) {
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
        }
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
