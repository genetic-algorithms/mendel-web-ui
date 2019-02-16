import * as ReactRedux from 'react-redux';
import * as React from 'react';
import { NewJob } from './views/new_job/index';
import { Login } from './views/login';
import { JobListing } from './views/job_listing';
import { UserListing } from './views/user_listing';
import { CreateUser } from './views/create_user';
import { EditUser } from './views/edit_user';
import { MyAccount } from './views/my_account';
import { JobDetail } from './views/job_detail';
import { AverageMutations } from './views/plots/average_mutations';
import { FitnessHistory } from './views/plots/fitness_history';
import { DeleteriousMutations } from './views/plots/deleterious_mutations';
import { BeneficialMutations } from './views/plots/beneficial_mutations';
import { SnpFrequencies } from './views/plots/snp_frequencies';
import { MinorAlleleFrequencies } from './views/plots/minor_allele_frequencies';
import { ReduxState } from '../redux_state_types';

/*
The Content component is the main body of the page. It includes a component inside it that is appropriate for
the current virtual page, based on the current route.
 */

type Props = {
    route: string;
};

function mapStateToProps(state: ReduxState) {
    return {
        route: state.route,
    };
}

function getView(route: string) {
    const jobDetailMatch = route.match(new RegExp('^/job-detail/(\\w+)/$'));
    const jobConfigMatch = route.match(new RegExp('^/job-config/(\\w+)/$'));
    const editUserMatch = route.match(new RegExp('^/edit-user/(\\w+)/$'));
    const plotMatch = route.match(new RegExp('^/plots/(\\w+)/([\\w-]+)/$'));

    if (route === '/') {
        return React.createElement(NewJob, {
            jobId: null,
            key: 'new_job',
        });
    } else if (jobConfigMatch) {
        return React.createElement(NewJob, {
            jobId: jobConfigMatch[1],
            key: 'job_config:' + jobConfigMatch[1],
        });
    } else if (route === '/login/') {
        return React.createElement(Login, null);
    } else if (route === '/job-listing/') {
        return React.createElement(JobListing, null);
    } else if (route === '/user-listing/') {
        return React.createElement(UserListing, null);
    } else if (route === '/create-user/') {
        return React.createElement(CreateUser, null);
    } else if (editUserMatch) {
        return React.createElement(EditUser, {
            userId: editUserMatch[1],
        });
    } else if (route === '/my-account/') {
        return React.createElement(MyAccount, null);
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
    }

    return null;
}

function Component(props: Props) {
    return React.createElement('div', { className: 'page-content' },
        getView(props.route),
    );
}

export const Content = ReactRedux.connect(mapStateToProps)(Component);
