import napiHttpHandler from '~/api/napiHttpHandler';
import { State } from '../network/vpc';
import { IpnResponse } from '../type';

export interface ElasticIpItem {
    allocationId: string;
    associationId: string;
    publicIpAddress: string;
    privateIp: string;
    instanceId: string;
    networkInterfaceId: string;
    networkInterfaceOwnerId: string;
    state: string;
    networkBorderGroup: string;
    publicIpv4Pool: string;
    customerOwnedIpv4Pool: string;
    created_at: string;
    vpcId: string;
    deviceName?: string;
    privateIpAddress?: string;
}

export type ElasticIpListResponse = { elasticIPs: ElasticIpItem[] };

export interface CreateElasticIP {
    networkBorderGroup: string;
    vpcId: string;
}

export interface AssociateElasticIP {
    allocation: string;
    privateIpAddress: string;
    instanceId: string;
}
export interface DisassociateElasticIP {
    allocation: string;
}

export const elasticIpService = {
    async getAllElasticIps(
        regionCode: string,
        page: number,
        perPage: number,
        name: string,
        state: State | '',
        createdAt: string,
        sortByFiled: string,
        sortBy: string,
        searchQuery: string,
    ): Promise<IpnResponse<ElasticIpListResponse>> {
        const params: Record<string, any> = {
            region: `eq:${regionCode}`,
            page,
            perPage,
        };
        if (state) params['state'] = `eq:${state}`;
        if (createdAt) params['createdAt'] = `gt:${createdAt}`;
        if (name) params['name'] = `neq:${name}`;
        if (sortBy) params['sortBy'] = `${sortBy}:${sortByFiled}`;
        if (searchQuery) params['q'] = `${searchQuery}`;
        const { data } = await napiHttpHandler.get('/v1/elastic-ips', params, {
            quiet: false,
        });
        return data;
    },
    async getSubnetById(
        vpcId: string,
        subnetId: string,
    ): Promise<IpnResponse<ElasticIpListResponse>> {
        const { data } = await napiHttpHandler.get(
            `/v1/vpcs/${vpcId}/subnets/${subnetId}`,
            {},
            { quiet: false },
        );
        return data;
    },

    async create(req: CreateElasticIP) {
        const { data } = await napiHttpHandler.post('/v1/elastic-ips/', req);
        return data;
    },
    async delete(allocationId: string) {
        const { data } = await napiHttpHandler.del(
            `/v1/elastic-ips/${allocationId}`,
        );
        return data;
    },
    async associate(req: AssociateElasticIP) {
        const { data } = await napiHttpHandler.post(
            `/v1/elastic-ips/${req.allocation}/associate`,
            req,
        );
        return data;
    },
    async disassociate(req: DisassociateElasticIP) {
        const { data } = await napiHttpHandler.post(
            `/v1/elastic-ips/${req.allocation}/disassociate`,
            req,
        );
        return data;
    },
};
