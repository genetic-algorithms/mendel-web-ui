import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { BackIcon } from '../../icons/back';
import { setRoute } from '../../../util';

type OwnProps = {
    jobId: string;
    activeSlug: string;
};

type Props = OwnProps & {
    onLinkClick: (slug: string) => void;
    onBackClick: () => void;
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
        onLinkClick: (slug: string) => {
            setRoute(dispatch, '/plots/' + ownProps.jobId + '/' + slug + '/');
        },
        onBackClick: () => {
            setRoute(dispatch, '/job-detail/' + ownProps.jobId + '/');
        },
    };
}

class Component extends React.Component<Props> {
    render() {
        return React.createElement('div', { className: 'plots-view__sidebar' },
            React.createElement('div', { className: 'plots-view__sidebar__back', onClick: this.props.onBackClick },
                React.createElement(BackIcon, { width: 24, height: 24 }),
            ),
            React.createElement('div', { className: 'plots-view__sidebar__items' },
                LINKS.map(link => (
                    React.createElement('div', {
                        className: 'plots-view__sidebar__item ' + (this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                        onClick: () => this.props.onLinkClick(link.slug),
                        key: link.slug,
                    }, link.title)
                )),
            ),
        );
    }
}

export const Sidebar = ReactRedux.connect(null, mapDispatchToProps)(Component);
