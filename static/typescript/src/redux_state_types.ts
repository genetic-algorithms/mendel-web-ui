import { User } from './user_types';
import { PlotInfo } from './plot_info';

// Holds the global state of the UI, managed by redux

export type ReduxState = {
    user: User | null;
    route: string;
    loading_indicator_count: number;
    /*user_listing: {
        users: User[];
    },*/
    plots: PlotInfo;
};
