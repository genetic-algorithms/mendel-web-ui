import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { BackIcon } from '../../icons/back';
import { apiGet } from '../../../api';
import { setRoute } from '../../../util';

const LINKS = [
    {
        title: 'Average mutations/individual',
        slug: 'average-mutations',
        filename: 'mendel.hst',
    },
    {
        title: 'Fitness history',
        slug: 'fitness-history',
        filename: 'mendel.fit',
    },
    {
        title: 'Distribution of accumulated mutations (deleterious)',
        slug: 'deleterious-mutations',
        filename: 'allele-distribution-del',
    },
    {
        title: 'Distribution of accumulated mutations (beneficial)',
        slug: 'beneficial-mutations',
        filename: 'allele-distribution-fav',
    },
    {
        title: 'SNP Frequencies',
        slug: 'snp-frequencies',
        filename: 'allele-bins',
    },
    {
        title: 'Minor Allele Frequencies',
        slug: 'minor-allele-frequencies',
        filename: 'normalized-allele-bins',
    },
];

type OwnProps = {
    jobId: string;
    activeSlug: string;
};

type Props = OwnProps & {
    onLinkClick: (slug: string) => void;
    onBackClick: () => void;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    files: string[],
    tribes: number[],
};

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

class Component extends React.Component<Props, State> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);

        this.fetchController = new AbortController();

        this.state = {
            files: [],
            tribes: [],
        };
    }

    fetchFiles(jobId: string) {
        this.fetchController.abort();
        this.fetchController = new AbortController();
    
        apiGet(
            '/api/job-plot-files/',
            { jobId: jobId },
            this.props.dispatch,
            this.fetchController.signal,
        ).then(response => {
            this.setState({
                files: response.files,
                tribes: response.tribes,
            });
        });
    }
    
    componentDidMount() {
        this.fetchFiles(this.props.jobId);
    }
    
    componentWillUnmount() {
        this.fetchController.abort();
    }
    
    render() {
        return React.createElement('div', { className: 'plots-view__sidebar' },
            React.createElement('div', { className: 'plots-view__sidebar__back', onClick: this.props.onBackClick },
                React.createElement(BackIcon, { width: 24, height: 24 }),
            ),
            React.createElement('div', { className: 'plots-view__sidebar__items' },
                LINKS.filter(link => this.state.files.indexOf(link.filename) > -1 ).map(link => (
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
