import { NewJob } from './views/new_job';
import { Login } from './views/login';
import { JobListing } from './views/job_listing';
import { UserListing } from './views/user_listing';
import { CreateUser } from './views/create_user';
import { EditUser } from './views/edit_user';
import { JobDetail } from './views/job_detail';
import { AverageMutations } from './views/plots/average_mutations';
import { FitnessHistory } from './views/plots/fitness_history';
import { DeleteriousMutations } from './views/plots/deleterious_mutations';
import { BeneficialMutations } from './views/plots/beneficial_mutations';
import { SnpFrequencies } from './views/plots/snp_frequencies';
import { MinorAlleleFrequencies } from './views/plots/minor_allele_frequencies';

function mapStateToProps(state) {
    return {
        route: state.route,
    };
}

function getView(route, setRoute, loadingIndicator) {
    const jobDetailMatch = route.match(new RegExp('^/job-detail/(\\w+)/$'));
    const editUserMatch = route.match(new RegExp('^/edit-user/(\\w+)/$'));
    const plotMatch = route.match(new RegExp('^/plots/(\\w+)/([\\w-]+)/$'));

    if (route === '/') {
        return React.createElement(NewJob, {});
    } else if (route === '/login/') {
        return React.createElement(Login, {});
    } else if (route === '/job-listing/') {
        return React.createElement(JobListing);
    } else if (route === '/user-listing/') {
        return React.createElement(UserListing, {
            setRoute: setRoute,
            loadingIndicator: loadingIndicator,
        });
    } else if (route === '/create-user/') {
        return React.createElement(CreateUser);
    } else if (editUserMatch) {
        return React.createElement(EditUser, {
            userId: editUserMatch[1],
        });
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

function Component(props) {
    return React.createElement('div', { className: 'page-content' },
        getView(props.route, props.setRoute, props.loadingIndicator),
    );
}

export const Content = ReactRedux.connect(mapStateToProps)(Component);
