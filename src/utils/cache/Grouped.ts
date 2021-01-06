import { createCache } from '.';
import { Cache, PublicCache } from './Cache';

export type CacheGroups = Record<string, new (...args: any) => any>;

export type GroupedCache<Groups extends CacheGroups> = { readonly [K in keyof Groups]: Cache<InstanceType<Groups[K]>> };

export type AddToGroupedCache<Groups extends CacheGroups> = { readonly [K in keyof Groups]: PublicCache<InstanceType<Groups[K]>>['add'] };

export function createGroupedCache<Groups extends CacheGroups>(groups: Groups): [cache: GroupedCache<Groups>, add: AddToGroupedCache<Groups>] {
    const groupNames = Object.keys(groups) as (keyof Groups)[];

    const adds = {} as any;
    const caches = {} as any;

    groupNames.forEach(group => {
        const [cache, add] = createCache<InstanceType<Groups[keyof Groups]>>();

        caches[group] = cache;
        adds[group] = add;
    });

    return [caches, adds];
}
