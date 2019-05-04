import * as React from 'react';

type Props = {
    plotName: string;
    tribe: string;
};

export class NoPlot extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const tribeStr = this.props.tribe=='0' ? 'the summary' : 'tribe '+this.props.tribe
        return React.createElement('div', {className: 'plots-view__non-sidebar'}, 
            React.createElement('div', {className: 'plots-view__no-plot'}, 'The '+this.props.plotName+' plot does not exist for '+tribeStr)
        );
    }
}
