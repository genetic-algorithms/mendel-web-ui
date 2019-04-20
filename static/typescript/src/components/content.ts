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
import { Plots } from './views/plots/index';
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
    const plotMatch = route.match(new RegExp('^/plots/(\\w+)/(\\w+)/([\\w-]+)/$'));

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
        const tribe = plotMatch[2];
        return React.createElement(Plots, { jobId: jobId, tribe: tribe, activeSlug: plotMatch[3] });
    }

    return null;
}

function Component(props: Props) {
    return React.createElement('div', { className: 'page-content' },
        getView(props.route),
    );
}

export const Content = ReactRedux.connect(mapStateToProps)(Component);
