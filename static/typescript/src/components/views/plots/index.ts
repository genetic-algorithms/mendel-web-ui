import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { BackIcon } from '../../icons/back';
import { apiGet } from '../../../api';
import { setRoute } from '../../../util';
import { AverageMutations } from './average_mutations';
import { FitnessHistory } from './fitness_history';
import { DeleteriousMutations } from './deleterious_mutations';
import { BeneficialMutations } from './beneficial_mutations';
import { SnpFrequencies } from './snp_frequencies';
import { MinorAlleleFrequencies } from './minor_allele_frequencies';

/* Creates the plot links in the sidebar navigation panel and the current plot. With the introduction
  of tribes, this panel also displays a drop-down menu, when a job has tribes, to enable
  switching between the tribes.
 */

// All the possible plots. Will be filtered later for the plots files that actually exist for a job.
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
    // These are the props added by mapDispatchToProps()
    onLinkClick: (slug: string) => void;    // changes to a different plot within this page
    onBackClick: () => void;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type State = {
    files: string[],
    tribes: number[],
    currentTribe: number,
};

// Called by redux when the component re-renders. Returns additional properties that get merged into
// the components props. Use this method when you need the dispatch object for other functions.
function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>, ownProps: OwnProps) {
    return {
        dispatch: dispatch,
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

        this.onSelectChanged = this.onSelectChanged.bind(this);
        this.fetchController = new AbortController();

        this.state = {
            files: [],
            tribes: [],
            currentTribe: 0,  // initialize to 0 to indicate no tribe has been selected yet
        };
    }

    // When the tribe drop-down menu is changed, get the plot files list for this job and tribe
    onSelectChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        const value = parseInt(e.currentTarget.value);

        this.fetchFiles(this.props.jobId, value);

        this.setState({ currentTribe: value, });
    }

    // Get which plot files and tribe dirs are available for this job
    fetchFiles(jobId: string, tribe: number) {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        apiGet(
            '/api/job-plot-files/',
            { jobId: jobId, tribe: tribe.toString() },
            this.props.dispatch,
            this.fetchController.signal,
        ).then(response => {
            this.setState({
                files: response.files,
                tribes: response.tribes,
            });
        });
    }

    // Returns the currently active plot component for this page
    getPlot() {
        if (this.props.activeSlug === 'average-mutations') {
            return React.createElement(AverageMutations, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else if (this.props.activeSlug === 'fitness-history') {
            return React.createElement(FitnessHistory, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else if (this.props.activeSlug === 'deleterious-mutations') {
            return React.createElement(DeleteriousMutations, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else if (this.props.activeSlug === 'beneficial-mutations') {
            return React.createElement(BeneficialMutations, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else if (this.props.activeSlug === 'snp-frequencies') {
            return React.createElement(SnpFrequencies, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else if (this.props.activeSlug === 'minor-allele-frequencies') {
            return React.createElement(MinorAlleleFrequencies, { jobId: this.props.jobId, tribe: this.state.currentTribe });
        } else {
            return null;
        }
    }

    componentDidMount() {
        this.fetchFiles(this.props.jobId, this.state.currentTribe);
    }

    componentWillUnmount() {
        this.fetchController.abort();
    }

    /* The filter below filters the list to only the plots that exist for this job, then we map them to link elements.
        The select widget changes what tribe we fetch plot files for and display.
    */
    render() {
        return React.createElement('div', { className: 'plots-view' },
            React.createElement('div', { className: 'plots-view__sidebar' },
                React.createElement('div', { className: 'plots-view__sidebar__back', onClick: this.props.onBackClick },
                    React.createElement(BackIcon, { width: 24, height: 24 }),
                ),
                (this.state.tribes.length>0 ?
                    React.createElement('select', { className: 'plots-view__sidebar__select', value: this.state.currentTribe, onChange: this.onSelectChanged, },
                        React.createElement('option', { value: 0 }, 'Summary'),
                        this.state.tribes.map(tribe => 
                            React.createElement('option', { value: tribe }, tribe),
                        )
                    )
                : null ),
                React.createElement('div', { className: 'plots-view__sidebar__items' },
                    LINKS.filter(link => this.state.files.indexOf(link.filename) > -1 ).map(link => (
                            React.createElement('div', {
                                className: 'plots-view__sidebar__item ' + (this.props.activeSlug === link.slug ? 'plots-view__sidebar--active' : ''),
                                onClick: () => this.props.onLinkClick(link.slug),
                                key: link.slug,
                            }, link.title)
                        )),
                ),
            ),
            this.getPlot(),
        );
    }
}

export const Plots = ReactRedux.connect(null, mapDispatchToProps)(Component);
