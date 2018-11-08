import { UserWithId } from './user_types';

export type ReduxState = {
    user: UserWithId | null;
    route: string;
    loading_indicator_count: number;
    user_listing: {
        users: UserWithId[],
    },
};
