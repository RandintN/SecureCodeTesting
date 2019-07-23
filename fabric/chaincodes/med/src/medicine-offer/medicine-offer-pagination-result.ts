import { IMedicineOfferQueryResultJson } from './medicine-offer-query-result';

/**
 * Interface of results of paginated query
 *
 * @author fmarino - CPqD
 */
export interface IMedicineOfferPaginationResultJson extends IMedicineOfferQueryResultJson {

    /**
     * Amount of fetched records
     */
    fetched_records_count: number;

    /**
     * Current bookmark
     */
    bookmark: string;

}
