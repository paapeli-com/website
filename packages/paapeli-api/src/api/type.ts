export interface PageResponse<T> {
    data: T[];
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
}

export interface PaapeliMessage {
    message: string;
}
