import * as React from 'react';

type Props = {
    width: number;
    height: number;
};

export class BackIcon extends React.PureComponent<Props> {
    render() {
        return React.createElement(
            'svg',
            {
                width: this.props.width.toString(),
                height: this.props.height.toString(),
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            },
            React.createElement('path', { d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' }),
        );
    }
}
