import { IMedicineRequestJson } from './medicine-request-json';

/**
 * Interface of results of paginated query
 *
 * @author fmarino - CPqD
 */
export interface IMedicineRequestPaginationResultJson {
    /**
     * Amount of fetched records
     */
    fetched_records_count: number;

    /**
     * Current bookmark
     */
    bookmark: string;

    /**
     * Array with records
     */
    medicine_requests: IMedicineRequestJson[];

    /**
     * Operation timestamp
     */
    timestamp: number;

}
