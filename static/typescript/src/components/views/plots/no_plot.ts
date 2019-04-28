import * as React from 'react';

type Props = {
    plotName: string;
};

export class NoPlot extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return React.createElement('div', {className: 'plots-view__non-sidebar'}, 
            React.createElement('div', {className: 'plots-view__no-plot'}, 'The '+this.props.plotName+' plot does not exist for this tribe')
        );
    }
}
