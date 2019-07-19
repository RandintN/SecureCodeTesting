import { IMedicineOfferJson } from './medicine-offer-json';

/**
 * Interface of results of paginated query
 *
 * @author enicola - CPqD
 */
export interface IMedicineOfferQueryResultJson {

    /**
     * Array with records
     */
    medicine_offers: IMedicineOfferJson[];

    /**
     * Operation timestamp
     */
    timestamp: number;

}
