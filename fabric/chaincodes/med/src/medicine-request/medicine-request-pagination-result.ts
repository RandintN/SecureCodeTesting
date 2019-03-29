import { IMedicineRequestQueryResultJson } from './medicine-request-query-result';

/**
 * Interface of results of paginated query
 *
 * @author fmarino - CPqD
 */
export interface IMedicineRequestPaginationResultJson extends IMedicineRequestQueryResultJson {

    /**
     * Amount of fetched records
     */
    fetched_records_count: number;

    /**
     * Current bookmark
     */
    bookmark: string;

}
