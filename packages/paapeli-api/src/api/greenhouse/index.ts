import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

/** Names by language code: en, fa, ar. */
export type LocalizedNames = Partial<Record<'en' | 'fa' | 'ar', string>>;

/** What a target can be set on; the bounds are in the metric's unit. */
export type CropMetric = 'TEMPERATURE' | 'HUMIDITY' | 'VPD' | 'CO2' | 'DLI' | 'SUBSTRATE_MOISTURE' | 'PH' | 'EC';
export type CropTargetPeriod = 'DAY' | 'NIGHT' | 'ALL';
export type CultivationMethod = 'SOIL' | 'HYDROPONIC' | 'SUBSTRATE' | 'OTHER';
export type GreenhouseStructure = 'GLASS' | 'POLY_FILM' | 'POLYCARBONATE' | 'NET_HOUSE' | 'TUNNEL' | 'OTHER';
export type CropCycleStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type CropCycleEventKind = 'STARTED' | 'STAGE' | 'OBSERVATION' | 'HARVEST' | 'COMPLETED' | 'ARCHIVED';

/** The range one measurement should stay in; either bound may be missing. */
export interface CropTarget {
    metric: CropMetric;
    period: CropTargetPeriod;
    min?: number | null;
    max?: number | null;
}

export interface CropStage {
    id: string;
    /** The library's names for it; empty for a stage of the grower's own. */
    names: LocalizedNames;
    /** The grower's own name; shown instead of names when set. */
    name?: string | null;
    /** For planning only: a cycle changes stage when someone records it. */
    durationDays?: number | null;
    irrigation?: string | null;
    notes?: string | null;
    targets: CropTarget[];
}

/** A crop of the built-in library. It sets no target values. */
export interface CropTemplate {
    key: string;
    position: number;
    icon: string;
    names: LocalizedNames;
    stages: { key: string; names: LocalizedNames }[];
}

export interface CropProfile {
    id: string;
    templateKey?: string | null;
    /** The library crop's names; empty for a custom crop. */
    names: LocalizedNames;
    name?: string | null;
    variety?: string | null;
    icon: string;
    cultivationMethods: CultivationMethod[];
    cycleDays?: number | null;
    notes?: string | null;
    stages: CropStage[];
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CropStageInput {
    /** Keeps a stage (or names a library stage); left out for a new one. */
    id?: string;
    name?: string | null;
    durationDays?: number | null;
    irrigation?: string | null;
    notes?: string | null;
    targets?: CropTarget[];
}

export interface CropProfileRequest {
    /** On create only. */
    templateKey?: string | null;
    name?: string | null;
    variety?: string | null;
    icon?: string | null;
    cultivationMethods?: CultivationMethod[];
    cycleDays?: number | null;
    notes?: string | null;
    /** Left out on create from the library to take its stages. */
    stages?: CropStageInput[];
}

export interface CropCycle {
    id: string;
    crop: { id: string; templateKey?: string | null; names: LocalizedNames; name?: string | null; icon?: string | null };
    /** The zone or bed; null once that location was deleted. */
    assetId?: string | null;
    assetName: string;
    greenhouseAssetId?: string | null;
    greenhouseName?: string | null;
    variety?: string | null;
    plantedOn: string;
    expectedHarvestOn?: string | null;
    /** The stage it is in, with that stage's targets. */
    stage: CropStage;
    stageSince: string;
    status: CropCycleStatus;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    endedAt?: string | null;
}

export interface CropCycleEvent {
    id: string;
    kind: CropCycleEventKind;
    stageId?: string | null;
    note?: string | null;
    quantity?: number | null;
    unit?: string | null;
    occurredAt: string;
    createdBy?: string | null;
}

export interface StartCropCycleRequest {
    cropProfileId: string;
    assetId: string;
    variety?: string | null;
    /** yyyy-MM-dd */
    plantedOn: string;
    expectedHarvestOn?: string | null;
    stageId?: string | null;
    notes?: string | null;
}

export interface UpdateCropCycleRequest {
    variety?: string | null;
    plantedOn: string;
    expectedHarvestOn?: string | null;
    notes?: string | null;
}

export interface CropCycleFilter {
    status?: CropCycleStatus;
    assetId?: string;
    greenhouseId?: string;
    cropProfileId?: string;
}

export interface GreenhouseDetail {
    assetId: string;
    location?: string | null;
    areaM2?: number | null;
    timeZone?: string | null;
    structureType?: GreenhouseStructure | null;
    cultivationMethod?: CultivationMethod | null;
}

export interface GreenhouseDetailRequest {
    location?: string | null;
    areaM2?: number | null;
    timeZone?: string | null;
    structureType?: GreenhouseStructure | null;
    cultivationMethod?: CultivationMethod | null;
}

export interface GreenhouseBed {
    id: string;
    name: string;
    label?: string | null;
    devices: number;
    cycle?: CropCycle | null;
}

export interface GreenhouseZone {
    id: string;
    name: string;
    label?: string | null;
    areaM2?: number | null;
    /** The zone's own devices and its beds'. */
    devices: number;
    cycle?: CropCycle | null;
    beds: GreenhouseBed[];
}

export interface Greenhouse {
    id: string;
    name: string;
    label?: string | null;
    location?: string | null;
    areaM2?: number | null;
    timeZone?: string | null;
    structureType?: GreenhouseStructure | null;
    cultivationMethod?: CultivationMethod | null;
    /** Every device on the greenhouse, its zones and their beds. */
    devices: number;
    zones: GreenhouseZone[];
}

const crops = (workspaceId: string, productKey: string) => `/api/v1/aiot/crops/${workspaceId}/${productKey}`;
const cycles = (workspaceId: string, productKey: string) => `/api/v1/aiot/crop-cycles/${workspaceId}/${productKey}`;
const greenhouses = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/greenhouses/${workspaceId}/${productKey}`;

export const cropService = {
    async library(workspaceId: string, productKey: string): Promise<CropTemplate[]> {
        const { data } = await napiHttpHandler.get<CropTemplate[]>(`${crops(workspaceId, productKey)}/library`);
        return data;
    },

    async list(workspaceId: string, productKey: string, includeArchived = false): Promise<CropProfile[]> {
        const { data } = await napiHttpHandler.get<CropProfile[]>(crops(workspaceId, productKey), { includeArchived });
        return data;
    },

    async create(workspaceId: string, productKey: string, request: CropProfileRequest): Promise<CropProfile> {
        const { data } = await napiHttpHandler.post<CropProfile>(crops(workspaceId, productKey), request);
        return data;
    },

    async update(
        workspaceId: string,
        productKey: string,
        cropProfileId: string,
        request: CropProfileRequest,
    ): Promise<CropProfile> {
        const { data } = await napiHttpHandler.put<CropProfile>(
            `${crops(workspaceId, productKey)}/${cropProfileId}`,
            request,
        );
        return data;
    },

    /** Deleted when no cycle grew it, archived otherwise. */
    async remove(workspaceId: string, productKey: string, cropProfileId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(`${crops(workspaceId, productKey)}/${cropProfileId}`);
        return data;
    },
};

export const cropCycleService = {
    async list(workspaceId: string, productKey: string, filter: CropCycleFilter = {}): Promise<CropCycle[]> {
        const { data } = await napiHttpHandler.get<CropCycle[]>(cycles(workspaceId, productKey), { ...filter });
        return data;
    },

    async get(workspaceId: string, productKey: string, cropCycleId: string): Promise<CropCycle> {
        const { data } = await napiHttpHandler.get<CropCycle>(`${cycles(workspaceId, productKey)}/${cropCycleId}`);
        return data;
    },

    async start(workspaceId: string, productKey: string, request: StartCropCycleRequest): Promise<CropCycle> {
        const { data } = await napiHttpHandler.post<CropCycle>(cycles(workspaceId, productKey), request);
        return data;
    },

    async update(
        workspaceId: string,
        productKey: string,
        cropCycleId: string,
        request: UpdateCropCycleRequest,
    ): Promise<CropCycle> {
        const { data } = await napiHttpHandler.put<CropCycle>(`${cycles(workspaceId, productKey)}/${cropCycleId}`, request);
        return data;
    },

    async events(workspaceId: string, productKey: string, cropCycleId: string): Promise<CropCycleEvent[]> {
        const { data } = await napiHttpHandler.get<CropCycleEvent[]>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/events`,
        );
        return data;
    },

    async changeStage(
        workspaceId: string,
        productKey: string,
        cropCycleId: string,
        request: { stageId: string; note?: string | null; occurredAt?: string | null },
    ): Promise<CropCycle> {
        const { data } = await napiHttpHandler.post<CropCycle>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/stage`,
            request,
        );
        return data;
    },

    async observe(
        workspaceId: string,
        productKey: string,
        cropCycleId: string,
        request: { note: string; occurredAt?: string | null },
    ): Promise<CropCycleEvent> {
        const { data } = await napiHttpHandler.post<CropCycleEvent>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/observations`,
            request,
        );
        return data;
    },

    async harvest(
        workspaceId: string,
        productKey: string,
        cropCycleId: string,
        request: { quantity: number; unit: string; note?: string | null; occurredAt?: string | null },
    ): Promise<CropCycleEvent> {
        const { data } = await napiHttpHandler.post<CropCycleEvent>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/harvests`,
            request,
        );
        return data;
    },

    async complete(workspaceId: string, productKey: string, cropCycleId: string, note?: string): Promise<CropCycle> {
        const { data } = await napiHttpHandler.post<CropCycle>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/complete`,
            { note: note || null },
        );
        return data;
    },

    async archive(workspaceId: string, productKey: string, cropCycleId: string, note?: string): Promise<CropCycle> {
        const { data } = await napiHttpHandler.post<CropCycle>(
            `${cycles(workspaceId, productKey)}/${cropCycleId}/archive`,
            { note: note || null },
        );
        return data;
    },
};

export const greenhouseService = {
    /** Each greenhouse with its zones, beds, what grows in each and its device count. */
    async list(workspaceId: string, productKey: string): Promise<Greenhouse[]> {
        const { data } = await napiHttpHandler.get<Greenhouse[]>(greenhouses(workspaceId, productKey));
        return data;
    },

    /** Replaces the details; a field left out is cleared. */
    async saveDetail(
        workspaceId: string,
        productKey: string,
        assetId: string,
        request: GreenhouseDetailRequest,
    ): Promise<GreenhouseDetail> {
        const { data } = await napiHttpHandler.put<GreenhouseDetail>(
            `${greenhouses(workspaceId, productKey)}/${assetId}/details`,
            request,
        );
        return data;
    },
};
