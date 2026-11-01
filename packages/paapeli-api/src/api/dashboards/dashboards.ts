import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';

/* ------------------------------------------------------------------ */
/* Dashboard definition (the `definition` JSON the gateway stores)     */
/* ------------------------------------------------------------------ */

/** An ISO-8601 duration, e.g. "PT30S", "PT1H", "P7D". */
export type IsoDuration = string;

export interface RelativeTimeWindow {
    type: 'relative';
    last: IsoDuration;
}
export type DashboardTimeWindow = RelativeTimeWindow;

export type DashboardTimeZone =
    | { type: 'workspace' }
    | { type: 'browser' }
    | { type: 'iana'; zoneId: string };

export interface DashboardSettings {
    timeWindow: DashboardTimeWindow;
    /** null = manual refresh only. */
    refreshInterval: IsoDuration | null;
    timeZone: DashboardTimeZone;
}

export interface DeviceDataSource {
    type: 'device';
    /** Paapeli workspace-product device id. */
    deviceId: string;
}
export interface DeviceQueryDataSource {
    type: 'deviceQuery';
    deviceTypeId: string;
    assetId?: string;
    includeDescendants?: boolean;
}
/** A current count of devices; every filter is optional. Feeds the KPI widget. */
export interface DeviceCountDataSource {
    type: 'deviceCount';
    deviceTypeId?: string;
    assetId?: string;
    /** Only meaningful with an assetId. */
    includeDescendants?: boolean;
    /** true: active only, false: inactive only, omitted: all. */
    active?: boolean;
}
export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
export type AlarmStatus = 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
/** Alarms of the workspace product; an omitted filter matches everything. */
export interface AlarmQueryDataSource {
    type: 'alarmQuery';
    severities?: AlarmSeverity[];
    statuses?: AlarmStatus[];
    deviceId?: string;
}
export type FormulaOperation = 'SUM' | 'AVG' | 'MIN' | 'MAX';
/** One number from the latest value of several device keys. */
export interface FormulaDataSource {
    type: 'formula';
    operation: FormulaOperation;
    /** 2 to 10 device keys, none repeated. */
    inputs: Array<{ deviceId: string; key: string }>;
}
export type DashboardDataSource =
    | DeviceDataSource
    | DeviceQueryDataSource
    | DeviceCountDataSource
    | AlarmQueryDataSource
    | FormulaDataSource;
export type DashboardDataSourceType = DashboardDataSource['type'];

/** One series a widget reads: `key` of the data source named by `source`. */
export interface WidgetDataItem {
    source: string;
    key: string;
    label?: string;
    unit?: string;
    /** Slice colour, for widgets whose data schema has one. */
    color?: string;
    /** What this reading drives in a process diagram. */
    role?: "reading" | "motion" | "level" | "travel";
}

/** An instance of a widget definition placed on a dashboard. */
export interface DashboardWidget {
    id: string;
    /** Widget definition `type` — must name an existing definition. */
    type: string;
    /** Widget definition `schemaVersion` this instance was written against. */
    schemaVersion: number;
    title: string;
    data: WidgetDataItem[];
    /** Overrides settings.timeWindow when the definition supports it. */
    timeWindow: DashboardTimeWindow | null;
    /** Validated against the definition's configurationSchema. */
    options: Record<string, unknown>;
}

export interface LayoutItem {
    x: number;
    y: number;
    w: number;
    h: number;
}
/** Widget id → position, one map per breakpoint. */
export type DashboardLayout = Record<string, LayoutItem>;

export interface DashboardLayouts {
    desktop: DashboardLayout;
    mobile: DashboardLayout;
}

export interface DashboardDefinition {
    settings: DashboardSettings;
    /** Data-source key (referenced by WidgetDataItem.source) → source. */
    dataSources: Record<string, DashboardDataSource>;
    widgets: DashboardWidget[];
    layouts: DashboardLayouts;
}

/** The definition format version this client writes. */
export const DASHBOARD_DEFINITION_SCHEMA_VERSION = 1;

export const emptyDashboardDefinition = (settings: DashboardSettings): DashboardDefinition => ({
    settings,
    dataSources: {},
    widgets: [],
    layouts: { desktop: {}, mobile: {} },
});

/* ------------------------------------------------------------------ */
/* Resources                                                          */
/* ------------------------------------------------------------------ */

export type DashboardVisibility = 'PRIVATE' | 'WORKSPACE_PRODUCT';

export interface DashboardResponse {
    id: string;
    workspaceProductId: string;
    categoryId?: string | null;
    assetId?: string | null;
    createdByUserId: string;
    name: string;
    description?: string | null;
    coverImageUri?: string | null;
    visibility: DashboardVisibility;
    definitionSchemaVersion: number;
    /** Optimistic-lock token: send it back on update; a stale one gets 409. */
    recordVersion: number;
    definition: DashboardDefinition;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDashboardRequest {
    name: string;
    description?: string | null;
    categoryId?: string | null;
    assetId?: string | null;
    coverImageUri?: string | null;
    visibility: DashboardVisibility;
    definitionSchemaVersion?: number;
    definition: DashboardDefinition;
}

export interface UpdateDashboardRequest extends CreateDashboardRequest {
    recordVersion?: number;
}

export interface DashboardCategory {
    id: string;
    name: string;
    description?: string | null;
    sortOrder?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDashboardCategoryRequest {
    name: string;
    description?: string;
    sortOrder?: number;
}

export type DashboardPermission = 'VIEW' | 'EDIT';

export interface DashboardGrant {
    workspaceMembershipId: string;
    permission: DashboardPermission;
    createdAt: string;
    updatedAt: string;
}

export interface WidgetCapabilities {
    supportsTimeWindow?: boolean;
    supportsMultipleSeries?: boolean;
    supportedDataSourceTypes?: DashboardDataSourceType[];
}

/** A JSON Schema (draft 2020-12) object, kept loose on purpose. */
export type JsonSchema = {
    type?: string | string[];
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    required?: string[];
    enum?: unknown[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    minItems?: number;
    maxItems?: number;
    title?: string;
    description?: string;
    default?: unknown;
    additionalProperties?: boolean | JsonSchema;
    [k: string]: unknown;
};

export interface WidgetDefinition {
    id: string;
    type: string;
    schemaVersion: number;
    name: string;
    description?: string | null;
    category?: string | null;
    iconUri?: string | null;
    /** Schema of a widget instance's `data` array. */
    dataSchema: JsonSchema;
    /** Schema of a widget instance's `options`. */
    configurationSchema: JsonSchema;
    uiSchema?: { order?: string[]; [k: string]: unknown } | null;
    defaultConfiguration?: Record<string, unknown> | null;
    capabilities?: WidgetCapabilities | null;
    current: boolean;
    enabled: boolean;
}

const base = (workspaceId: string, productKey: string) =>
    `/api/v1/aiot/dashboards/${workspaceId}/${productKey}`;

export const dashboardService = {
    async listDashboards(
        workspaceId: string,
        productKey: string,
        page = 1,
        size = 25,
    ): Promise<PageResponse<DashboardResponse>> {
        const { data } = await napiHttpHandler.get<PageResponse<DashboardResponse>>(
            base(workspaceId, productKey),
            { page, size },
        );
        return data;
    },

    async getDashboard(workspaceId: string, productKey: string, dashboardId: string): Promise<DashboardResponse> {
        const { data } = await napiHttpHandler.get<DashboardResponse>(
            `${base(workspaceId, productKey)}/${dashboardId}`,
        );
        return data;
    },

    async createDashboard(
        workspaceId: string,
        productKey: string,
        req: CreateDashboardRequest,
    ): Promise<DashboardResponse> {
        const { data } = await napiHttpHandler.post<DashboardResponse>(base(workspaceId, productKey), {
            definitionSchemaVersion: DASHBOARD_DEFINITION_SCHEMA_VERSION,
            ...req,
        });
        return data;
    },

    async updateDashboard(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        req: UpdateDashboardRequest,
    ): Promise<DashboardResponse> {
        const { data } = await napiHttpHandler.put<DashboardResponse>(
            `${base(workspaceId, productKey)}/${dashboardId}`,
            { definitionSchemaVersion: DASHBOARD_DEFINITION_SCHEMA_VERSION, ...req },
        );
        return data;
    },

    async deleteDashboard(workspaceId: string, productKey: string, dashboardId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `${base(workspaceId, productKey)}/${dashboardId}`,
        );
        return data;
    },

    async listWidgetDefinitions(workspaceId: string, productKey: string): Promise<WidgetDefinition[]> {
        const { data } = await napiHttpHandler.get<WidgetDefinition[]>(
            `${base(workspaceId, productKey)}/widget-definitions`,
        );
        return data;
    },

    async getWidgetDefinition(
        workspaceId: string,
        productKey: string,
        typeKey: string,
        schemaVersion: number,
    ): Promise<WidgetDefinition> {
        const { data } = await napiHttpHandler.get<WidgetDefinition>(
            `${base(workspaceId, productKey)}/widget-definitions/${encodeURIComponent(typeKey)}/versions/${schemaVersion}`,
        );
        return data;
    },

    async listCategories(workspaceId: string, productKey: string): Promise<DashboardCategory[]> {
        const { data } = await napiHttpHandler.get<DashboardCategory[]>(
            `${base(workspaceId, productKey)}/categories`,
        );
        return data;
    },

    async createCategory(
        workspaceId: string,
        productKey: string,
        req: CreateDashboardCategoryRequest,
    ): Promise<DashboardCategory> {
        const { data } = await napiHttpHandler.post<DashboardCategory>(
            `${base(workspaceId, productKey)}/categories`,
            req,
        );
        return data;
    },

    async listGrants(workspaceId: string, productKey: string, dashboardId: string): Promise<DashboardGrant[]> {
        const { data } = await napiHttpHandler.get<DashboardGrant[]>(
            `${base(workspaceId, productKey)}/${dashboardId}/grants`,
        );
        return data;
    },

    async putGrant(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        workspaceMembershipId: string,
        permission: DashboardPermission,
    ): Promise<DashboardGrant> {
        const { data } = await napiHttpHandler.put<DashboardGrant>(
            `${base(workspaceId, productKey)}/${dashboardId}/grants/${workspaceMembershipId}`,
            { permission },
        );
        return data;
    },

    async deleteGrant(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        workspaceMembershipId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `${base(workspaceId, productKey)}/${dashboardId}/grants/${workspaceMembershipId}`,
        );
        return data;
    },
};

/** A saved state of a dashboard, without its definition. */
export interface DashboardVersionSummary {
    /** Identifies the version: the record version the dashboard held then. */
    recordVersion: number;
    name: string;
    widgetCount: number;
    /** null for a state saved before history was kept. */
    savedByUserId?: string | null;
    /** ISO date-time. */
    savedAt: string;
    /** Whether this is the state the dashboard holds now. */
    current: boolean;
}

export interface DashboardVersion extends Omit<DashboardVersionSummary, 'widgetCount'> {
    description?: string | null;
    definitionSchemaVersion: number;
    definition: DashboardDefinition;
}

export const dashboardVersionService = {
    /** Newest first; one-based pages. The gateway keeps the newest 50. */
    async list(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        page = 1,
        size = 25,
    ): Promise<PageResponse<DashboardVersionSummary>> {
        const { data } = await napiHttpHandler.get<PageResponse<DashboardVersionSummary>>(
            `${base(workspaceId, productKey)}/${dashboardId}/versions`,
            { page, size },
        );
        return data;
    },

    async get(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        recordVersion: number,
    ): Promise<DashboardVersion> {
        const { data } = await napiHttpHandler.get<DashboardVersion>(
            `${base(workspaceId, productKey)}/${dashboardId}/versions/${recordVersion}`,
        );
        return data;
    },

    /**
     * Makes a saved definition the dashboard's definition again.
     * `currentRecordVersion` is the dashboard's version as last read; a stale one is a 409.
     */
    async restore(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        recordVersion: number,
        currentRecordVersion: number,
    ): Promise<DashboardResponse> {
        const { data } = await napiHttpHandler.post<DashboardResponse>(
            `${base(workspaceId, productKey)}/${dashboardId}/versions/${recordVersion}/restore`,
            { recordVersion: currentRecordVersion },
        );
        return data;
    },
};
