import { Header } from './header';
import { Content } from './content';

export class Root extends React.PureComponent {
    render() {
        return React.createElement('div', null,
            React.createElement(Header, null),
            React.createElement(Content, null),
        );
    }
}
