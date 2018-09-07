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

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onClick: (slug) => {
            const url = '/jobs/' + ownProps.jobId + '/plots/' + slug + '/';
            dispatch({
                type: 'ROUTE',
                value: url,
            });
            history.pushState(null, null, url);
        },
    };
}

export class Component extends React.Component {
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
