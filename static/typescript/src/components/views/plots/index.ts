import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import { ReduxAction } from '../../../redux_action_types';
import { BackIcon } from '../../icons/back';
import { apiGet } from '../../../api';
import { setRoute, assertNotUndefined } from '../../../util';
import { AverageMutations } from './average_mutations';
import { FitnessHistory } from './fitness_history';
import { DeleteriousMutations } from './deleterious_mutations';
import { BeneficialMutations } from './beneficial_mutations';
import { SnpFrequencies } from './snp_frequencies';
import { MinorAlleleFrequencies } from './minor_allele_frequencies';
import { NoPlot } from './no_plot';
import { PlotInfo } from '../../../plot_info';
import { ReduxState } from '../../../redux_state_types';

/* Creates the plot links in the sidebar navigation panel and the current plot. With the introduction
  of tribes, this panel also displays a drop-down menu, when a job has tribes, to enable
  switching between the tribes.
 */

// All the possible plots. Will be filtered later for the plots files that actually exist for a job.
const LINKS = [
    {
        title: 'Fitness history',
        slug: 'fitness-history',
        filename: 'mendel.fit',
    },
    {
        title: 'Average mutations/individual',
        slug: 'average-mutations',
        filename: 'mendel.hst',
    },
    {
        title: 'SNP (Single Nucleotide Polymorphism) Frequencies',
        slug: 'snp-frequencies',
        filename: 'allele-bins',
    },
    {
        title: 'Minor Allele Frequencies',
        slug: 'minor-allele-frequencies',
        filename: 'normalized-allele-bins',
    },
    {
        title: 'Distribution of accumulated deleterious mutations (experimental)',
        slug: 'deleterious-mutations',
        filename: 'allele-distribution-del',
    },
    {
        title: 'Distribution of accumulated beneficial mutations (experimental)',
        slug: 'beneficial-mutations',
        filename: 'allele-distribution-fav',
    },
];

type OwnProps = {
    // Props that come from the route
    jobId: string;
    tribe: string;
    activeSlug: string;
};

type PropsFromState = {
    // Props that come from reduc via mapStateToProps()
    plots: PlotInfo;
}

type PropsFromDispatch = {
    // These are the props added by mapDispatchToProps()
    onLinkClick: (slug: string) => void;    // changes to a different plot within this page
    onBackClick: () => void;
    dispatch: Redux.Dispatch<ReduxAction>;
};

type Props = OwnProps & PropsFromState & PropsFromDispatch;

function mapStateToProps(state: ReduxState) {
    return {
        plots: state.plots,
    };
}

// Called by redux when the component re-renders. Returns additional properties that get merged into
// the components props. Use this method when you need the dispatch object for other functions.
function mapDispatchToProps(dispatch: Redux.Dispatch<ReduxAction>, ownProps: OwnProps) {
    return {
        dispatch: dispatch,
        onLinkClick: (slug: string) => {
            setRoute(dispatch, '/plots/' + ownProps.jobId + '/' + ownProps.tribe + '/' + slug + '/');
        },
        onBackClick: () => {
            setRoute(dispatch, '/job-detail/' + ownProps.jobId + '/');
        },
    };
}

class Component extends React.Component<Props> {
    fetchController: AbortController;

    constructor(props: Props) {
        super(props);

        this.onSelectChanged = this.onSelectChanged.bind(this);
        this.fetchController = new AbortController();
    }

    // When the tribe drop-down menu is changed, get the plot files list for this job and tribe
    onSelectChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        const tribe = e.currentTarget.value;
        //const tribeNum = parseInt(tribe);

        this.fetchFiles(this.props.jobId, tribe).then(response => {
            const url = '/plots/' + this.props.jobId + '/' + tribe + '/' + this.props.activeSlug + '/'
            this.props.dispatch({
                type: 'plots.INFO_AND_ROUTE',
                plots: { files: response.files, tribes: response.tribes },
                route: url,
            });
            history.pushState(null, '', url);
        });

    }

    // Get which plot files and tribe dirs are available for this job
    fetchFiles(jobId: string, tribe: string) {
        this.fetchController.abort();
        this.fetchController = new AbortController();

        return apiGet(
            '/api/job-plot-files/',
            { jobId: jobId, tribe: tribe },
            this.props.dispatch,
            this.fetchController.signal,
        );
    }

    // Returns true if the file associated with this active slug exists for the current tribe
    fileExists(slug: string): boolean {
        const theLink = LINKS.find(link => link.slug === slug);
        if (theLink === undefined) return false;
        return this.props.plots.files.indexOf(theLink.filename) > -1;
    }

    // Returns the plot title associated with for the specified slug
    getPlotTitle(slug: string): string {
        return assertNotUndefined(LINKS.find(link => link.slug === slug)).title;
    }

    // Returns the currently active plot component for this page
    getPlot() {
        if (this.props.activeSlug === 'average-mutations') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(AverageMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else if (this.props.activeSlug === 'fitness-history') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(FitnessHistory, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else if (this.props.activeSlug === 'deleterious-mutations') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(DeleteriousMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else if (this.props.activeSlug === 'beneficial-mutations') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(BeneficialMutations, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else if (this.props.activeSlug === 'snp-frequencies') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(SnpFrequencies, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else if (this.props.activeSlug === 'minor-allele-frequencies') {
            return (this.fileExists(this.props.activeSlug) ?
                React.createElement(MinorAlleleFrequencies, { jobId: this.props.jobId, tribe: this.props.tribe })
                : React.createElement(NoPlot, { plotName: this.getPlotTitle(this.props.activeSlug), tribe: this.props.tribe })
            );
        } else {
            return null;
        }
    }

    componentDidMount() {
        this.fetchFiles(this.props.jobId, this.props.tribe).then(response => {
            this.props.dispatch({
                type: 'plots.INFO',
                plots: { files: response.files, tribes: response.tribes },
            });
        });
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
                React.createElement('div', { className: 'plots-view__sidebar__title-area' },
                    React.createElement('div', { className: 'plots-view__sidebar__back', onClick: this.props.onBackClick },
                        React.createElement(BackIcon, { width: 24, height: 24 }),
                    ),
                    React.createElement('div', { className: 'plots-view__sidebar__title' }, 'Plots'),
                    (this.props.plots.tribes.length>0 ?
                        React.createElement('select', { className: 'plots-view__sidebar__select', value: this.props.tribe, onChange: this.onSelectChanged, },
                            React.createElement('option', { value: 0 }, 'Summary'),
                            this.props.plots.tribes.map(tribe => 
                                React.createElement('option', { value: tribe }, 'Tribe '+tribe),
                            )
                        )
                    : null ),
                ),
                React.createElement('div', { className: 'plots-view__sidebar__items' },
                    LINKS.filter(link => this.props.plots.files.indexOf(link.filename) > -1 ).map(link => (
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

export const Plots = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Component);
