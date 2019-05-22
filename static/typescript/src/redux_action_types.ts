import { User } from './user_types';
import { PlotInfo } from './plot_info';

// The list of actions that can change redux state

export type ReduxAction = {
    type: 'USER';
    value: User;
} | {
    type: 'LOGIN';
    user: User;
} | {
    type: 'LOGOUT';
} | {
    type: 'ROUTE';
    value: string;
} | {
    type: 'LOADING_INDICATOR_INCREMENT';
} | {
    type: 'LOADING_INDICATOR_DECREMENT';
/*} | {
    type: 'user_listing.USERS';
    value: User[];*/
} | {
    type: 'plots.INFO';
    plots: PlotInfo;
} | {
    type: 'plots.INFO_AND_ROUTE';
    plots: PlotInfo;
    route: string;
};
