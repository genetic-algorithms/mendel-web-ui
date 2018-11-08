import { User } from './user_types';

export type ReduxState = {
    user: User | null;
    route: string;
    loading_indicator_count: number;
    user_listing: {
        users: User[],
    },
};
