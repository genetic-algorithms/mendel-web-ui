import { UserWithId } from './user_types';

export type ReduxAction = {
    type: 'USER';
    value: UserWithId;
} | {
    type: 'LOGIN';
    user: UserWithId;
} | {
    type: 'LOGOUT';
} | {
    type: 'ROUTE';
    value: string;
} | {
    type: 'LOADING_INDICATOR_INCREMENT';
} | {
    type: 'LOADING_INDICATOR_DECREMENT';
} | {
    type: 'user_listing.USERS';
    value: UserWithId[];
};
