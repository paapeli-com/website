import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { State } from '../network/vpc';
import { Ref } from 'vue';
import { elasticIpService } from './elasticip';
import { IassRegion } from '../../iaas/iaas';
import { SubnetItem } from '../subnet/subnet';

export interface ElasticIpSelectedFilters {
    name: string;
    createdAt: '';
    state: State | '';
    sortByFiled: { value: string; name: string };
    sortBy: string;
}

export function useGetElasticIpQuery(
    regionCode: Ref<IassRegion| null>,
    page: Ref,
    perPage: number,
    selectedFilters: Ref<ElasticIpSelectedFilters>,
    searchQuery: Ref<string>,
) {
    return useQuery({
        queryKey: [
            'elasticIpList',
            regionCode,
            page,
            perPage,
            selectedFilters,
            searchQuery,
        ],
        queryFn: () =>
            elasticIpService.getAllElasticIps(
                regionCode.value?.code!,
                page.value,
                perPage,
                selectedFilters.value.name,
                selectedFilters.value.state,
                selectedFilters.value.createdAt,
                selectedFilters.value.sortByFiled?.value,
                selectedFilters.value.sortBy,
                searchQuery.value,
            ),
    });
}
export function useGetElaticIpInfiniteQuery(
    regionCode: Ref<IassRegion>,
    page: Ref,
    perPage: number,
    enabled: Ref<boolean>,
    selectedAz?: Ref<SubnetItem>,
) {
    return useInfiniteQuery({
        queryKey: ['elasticIpListInfinity', regionCode, enabled,selectedAz],
        queryFn: ({ pageParam = 1 }) =>
            elasticIpService.getAllElasticIps(
                regionCode.value.code,
                pageParam,
                perPage,
                '',
                '',
                '',
                '',
                '',
                '',
            ),
        initialPageParam: 1, // ✅ This line fixes the TypeScript error
        getNextPageParam: (lastPage) => {
            const { current: page, lastPage: lastPageNum } =
                lastPage.data.meta.pagination;
            return page < lastPageNum ? page + 1 : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            const { current } = firstPage.data.meta.pagination;
            return current > 1 ? current - 1 : undefined;
        },
        enabled,
    });
}
