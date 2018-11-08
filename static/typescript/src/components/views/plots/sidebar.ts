import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';

type OwnProps = {
    jobId: string;
    activeSlug: string;
};

type Props = OwnProps & {
    onClick: (slug: string) => void;
};

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

function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>, ownProps: OwnProps) {
    return {
        onClick: (slug: string) => {
            const url = '/plots/' + ownProps.jobId + '/' + slug + '/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, '', url);
        },
    };
}

class Component extends React.Component<Props> {
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

export const Sidebar = ReactRedux.connect(null, mapDispatchToProps)(Component);
