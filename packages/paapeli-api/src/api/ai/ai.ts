import napiHttpHandler from '../napiHttpHandler';

/* AI insights: /api/v1/aiot/ai/{workspaceId}/{productKey}. The gateway runs
   the analyses on its own schedule (TimesFM 2.5 forecasts, Isolation Forest,
   Mann-Kendall / Theil-Sen trends) and keeps the results; these calls read
   them and record what people did about them. Recommended actions and steps
   arrive as codes for the client to word. */

export type AiRisk = 'Critical' | 'High' | 'Medium' | 'Low';
export type AiSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AiForecastStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export type AiAnomalyStatus = AiForecastStatus | 'FALSE_POSITIVE';
export type AiOpportunityStatus = 'NEW' | 'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'DISMISSED';
export type AiAnomalyKind = 'SPIKE' | 'DROP' | 'LEVEL_SHIFT' | 'DRIFT' | 'NOISE' | 'FLATLINE' | 'PATTERN';
export type AiTrendDirection = 'Increasing' | 'Decreasing' | 'Stable';
export type AiTrendWindow = '7d' | '30d' | '90d';
export type AiOpportunityCategory = 'Energy' | 'Efficiency' | 'Maintenance' | 'Utilization';
export type AiSourceKind = 'FORECAST' | 'ANOMALY' | 'TREND' | 'OPPORTUNITY';
/** What a telemetry key measures, guessed from its name. */
export type AiSignalCategory =
    | 'VIBRATION' | 'TEMPERATURE' | 'PRESSURE' | 'CURRENT' | 'VOLTAGE' | 'POWER' | 'FLOW'
    | 'SPEED' | 'LEVEL' | 'HUMIDITY' | 'EFFICIENCY' | 'THROUGHPUT' | 'UTILIZATION' | 'OTHER';

/** A share of the blame, in whole percent; a list sums to 100. */
export interface AiWeighted {
    key: string;
    weight: number;
}

export interface AiStatus {
    enabled: boolean;
    sensitivity: AiSensitivity;
    /** "timesfm-2.5-200m", or "seasonal-naive" when the engine could not load TimesFM. */
    model?: string | null;
    lastRunAt?: string | null;
    lastFullRunAt?: string | null;
    nextRunAt?: string | null;
    nextFullRunAt?: string | null;
    devicesAnalyzed: number;
    lastError?: string | null;
}

export interface AiSignal {
    key: string;
    category: AiSignalCategory;
    current: number;
    baseline: number;
    threshold: number;
    /** ALARM_RULE: from the device's alarm rule; LEARNED: from its own history. */
    thresholdSource: 'ALARM_RULE' | 'LEARNED';
    /** 0 healthy .. 1 at the threshold. */
    degradation: number;
}

export interface AiHealthPoint {
    ts: number;
    health?: number | null;
    projected?: number | null;
}

export interface AiFailureForecast {
    /** The Paapeli device ID. */
    deviceId: string;
    deviceName: string;
    deviceType: string;
    assetId?: string | null;
    health: number;
    risk: AiRisk;
    probability7d: number;
    probability30d: number;
    probability90d: number;
    predictedFailureAt?: string | null;
    rulDays?: number | null;
    causeKey: string;
    causeCategory: AiSignalCategory;
    causes: AiWeighted[];
    signals: AiSignal[];
    healthSeries: AiHealthPoint[];
    actions: string[];
    status: AiForecastStatus;
    statusChangedByName?: string | null;
    statusChangedAt?: string | null;
    model: string;
    computedAt: string;
}

export interface AiAnomalyPoint {
    ts: number;
    actual?: number | null;
    expected?: number | null;
    expectedLow?: number | null;
    expectedHigh?: number | null;
}

export interface AiAnomaly {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    assetId?: string | null;
    key: string;
    category: AiSignalCategory;
    kind: AiAnomalyKind;
    severity: AiRisk;
    confidence: number;
    score: number;
    zScore: number;
    thresholdCrossed: boolean;
    startedAt: string;
    endedAt: string;
    peakAt: string;
    peakValue: number;
    expectedValue?: number | null;
    causes: AiWeighted[];
    series: AiAnomalyPoint[];
    actions: string[];
    status: AiAnomalyStatus;
    statusChangedByName?: string | null;
    statusChangedAt?: string | null;
    detectedAt: string;
    model: string;
}

export interface AiTrendPoint {
    ts: number;
    actual?: number | null;
    projected?: number | null;
    projectedLow?: number | null;
    projectedHigh?: number | null;
}

export interface AiTrend {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    assetId?: string | null;
    key: string;
    category: AiSignalCategory;
    window: AiTrendWindow;
    direction: AiTrendDirection;
    /** Over the window, in percent of the starting level. */
    changePct: number;
    slopePerDay: number;
    pValue: number;
    confidence: number;
    baseline: number;
    current: number;
    /** 0..1: how much a daily cycle explains. */
    seasonality: number;
    factors: AiWeighted[];
    series: AiTrendPoint[];
    actions: string[];
    model: string;
    computedAt: string;
}

export interface AiOpportunity {
    id: string;
    rule: 'ENERGY_RISING' | 'EFFICIENCY_FALLING' | 'UTILIZATION_FALLING' | 'WEAR_RISING';
    category: AiOpportunityCategory;
    key: string;
    keyCategory: AiSignalCategory;
    impactPct: number;
    confidence: number;
    devices: { id: string; name: string; assetId?: string | null }[];
    /** False once the trends stopped supporting it. */
    active: boolean;
    status: AiOpportunityStatus;
    statusChangedAt?: string | null;
    actions: string[];
    steps: string[];
    computedAt: string;
}

export interface AiCompletedAction {
    code: string;
    completedBy?: string | null;
    completedByName?: string | null;
    completedAt: string;
}

const base = (workspaceId: string, productKey: string) => `/api/v1/aiot/ai/${workspaceId}/${productKey}`;

export const aiService = {
    async status(workspaceId: string, productKey: string): Promise<AiStatus> {
        const { data } = await napiHttpHandler.get<AiStatus>(`${base(workspaceId, productKey)}/status`);
        return data;
    },
    async saveSettings(
        workspaceId: string,
        productKey: string,
        settings: { enabled: boolean; sensitivity: AiSensitivity },
    ): Promise<AiStatus> {
        const { data } = await napiHttpHandler.put<AiStatus>(`${base(workspaceId, productKey)}/settings`, settings);
        return data;
    },
    async analyzeNow(workspaceId: string, productKey: string): Promise<AiStatus> {
        const { data } = await napiHttpHandler.post<AiStatus>(`${base(workspaceId, productKey)}/analyze`, {});
        return data;
    },

    async forecasts(workspaceId: string, productKey: string): Promise<AiFailureForecast[]> {
        const { data } = await napiHttpHandler.get<AiFailureForecast[]>(`${base(workspaceId, productKey)}/forecasts`);
        return data;
    },
    async forecast(workspaceId: string, productKey: string, deviceId: string): Promise<AiFailureForecast> {
        const { data } = await napiHttpHandler.get<AiFailureForecast>(
            `${base(workspaceId, productKey)}/forecasts/${deviceId}`,
        );
        return data;
    },
    async setForecastStatus(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        status: AiForecastStatus,
    ): Promise<AiFailureForecast> {
        const { data } = await napiHttpHandler.put<AiFailureForecast>(
            `${base(workspaceId, productKey)}/forecasts/${deviceId}/status`,
            { status },
        );
        return data;
    },

    async anomalies(workspaceId: string, productKey: string): Promise<AiAnomaly[]> {
        const { data } = await napiHttpHandler.get<AiAnomaly[]>(`${base(workspaceId, productKey)}/anomalies`);
        return data;
    },
    async anomaly(workspaceId: string, productKey: string, id: string): Promise<AiAnomaly> {
        const { data } = await napiHttpHandler.get<AiAnomaly>(`${base(workspaceId, productKey)}/anomalies/${id}`);
        return data;
    },
    async setAnomalyStatus(
        workspaceId: string,
        productKey: string,
        id: string,
        status: AiAnomalyStatus,
    ): Promise<AiAnomaly> {
        const { data } = await napiHttpHandler.put<AiAnomaly>(
            `${base(workspaceId, productKey)}/anomalies/${id}/status`,
            { status },
        );
        return data;
    },

    async trends(workspaceId: string, productKey: string): Promise<AiTrend[]> {
        const { data } = await napiHttpHandler.get<AiTrend[]>(`${base(workspaceId, productKey)}/trends`);
        return data;
    },
    async trend(workspaceId: string, productKey: string, id: string): Promise<AiTrend> {
        const { data } = await napiHttpHandler.get<AiTrend>(`${base(workspaceId, productKey)}/trends/${id}`);
        return data;
    },

    async opportunities(workspaceId: string, productKey: string): Promise<AiOpportunity[]> {
        const { data } = await napiHttpHandler.get<AiOpportunity[]>(`${base(workspaceId, productKey)}/opportunities`);
        return data;
    },
    async opportunity(workspaceId: string, productKey: string, id: string): Promise<AiOpportunity> {
        const { data } = await napiHttpHandler.get<AiOpportunity>(
            `${base(workspaceId, productKey)}/opportunities/${id}`,
        );
        return data;
    },
    async setOpportunityStatus(
        workspaceId: string,
        productKey: string,
        id: string,
        status: AiOpportunityStatus,
    ): Promise<AiOpportunity> {
        const { data } = await napiHttpHandler.put<AiOpportunity>(
            `${base(workspaceId, productKey)}/opportunities/${id}/status`,
            { status },
        );
        return data;
    },

    async actions(
        workspaceId: string,
        productKey: string,
        kind: AiSourceKind,
        sourceId: string,
    ): Promise<AiCompletedAction[]> {
        const { data } = await napiHttpHandler.get<AiCompletedAction[]>(
            `${base(workspaceId, productKey)}/actions/${kind}/${sourceId}`,
        );
        return data;
    },
    async completeAction(
        workspaceId: string,
        productKey: string,
        kind: AiSourceKind,
        sourceId: string,
        code: string,
    ): Promise<AiCompletedAction[]> {
        const { data } = await napiHttpHandler.put<AiCompletedAction[]>(
            `${base(workspaceId, productKey)}/actions/${kind}/${sourceId}/${code}`,
            {},
        );
        return data;
    },
    async undoAction(
        workspaceId: string,
        productKey: string,
        kind: AiSourceKind,
        sourceId: string,
        code: string,
    ): Promise<AiCompletedAction[]> {
        const { data } = await napiHttpHandler.del<AiCompletedAction[]>(
            `${base(workspaceId, productKey)}/actions/${kind}/${sourceId}/${code}`,
        );
        return data;
    },

    /* The AI Co-Pilot: the conversation so far, oldest first, ending with the
       user's message. The gateway adds a snapshot of the product and asks the
       language model; it answers in `language`. 502 when the model is down. */
    async copilotChat(
        workspaceId: string,
        productKey: string,
        messages: AiCopilotMessage[],
        language: 'en' | 'fa' | 'ar',
    ): Promise<AiCopilotReply> {
        const { data } = await napiHttpHandler.post<AiCopilotReply>(
            `/api/v1/aiot/copilot/${workspaceId}/${productKey}/chat`,
            { messages, language },
            { quiet: true },
        );
        return data;
    },
    /* Temporary, for testing: simulated GPS trackers whose telemetry the
       gateway sends (/virtual-devices/{ws}/{pk}). One of each scenario when
       none are named. Remove with the panel's secret trigger. */
    async createVirtualDevices(
        workspaceId: string,
        productKey: string,
        assetId: string,
        scenarios?: string[],
    ): Promise<AiVirtualDevice[]> {
        const { data } = await napiHttpHandler.post<AiVirtualDevice[]>(
            `/api/v1/aiot/virtual-devices/${workspaceId}/${productKey}`,
            { assetId, scenarios },
        );
        return data;
    },
    /* Temporary, for testing: the virtual trackers and how their sending is going. */
    async listVirtualDevices(workspaceId: string, productKey: string): Promise<AiVirtualDevice[]> {
        const { data } = await napiHttpHandler.get<AiVirtualDevice[]>(
            `/api/v1/aiot/virtual-devices/${workspaceId}/${productKey}`,
        );
        return data;
    },
};

export interface AiCopilotMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AiCopilotChart {
    title: string;
    device: string;
    key: string;
    points: { ts: string; value: number }[];
}

export interface AiCopilotReply {
    reply: string;
    model: string;
    /** The lookups the assistant made to answer, in order (find_devices, get_telemetry, …). */
    toolsUsed: string[];
    /** Telemetry it read, to draw under the answer. */
    charts: AiCopilotChart[];
}

export interface AiVirtualDevice {
    deviceId: string;
    name: string;
    label?: string | null;
    scenario: string;
    description: string;
    createdAt: string;
    sentUntil: string;
    historyComplete: boolean;
    lastError?: string | null;
}
