import { User, UserWithId } from './user_types';

export type ReduxState = {
    user: User | null;
    route: string;
    loading_indicator_count: number;
    user_listing: {
        users: UserWithId[],
    },
};
