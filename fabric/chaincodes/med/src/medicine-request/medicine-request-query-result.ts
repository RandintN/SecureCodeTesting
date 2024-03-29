import { IMedicineRequestJson } from './medicine-request-json';

/**
 * Interface of results of paginated query
 *
 * @author fmarino - CPqD
 */
export interface IMedicineRequestQueryResultJson {

    /**
     * Array with records
     */
    medicine_trades: IMedicineRequestJson[];

    /**
     * Operation timestamp
     */
    timestamp: number;

}
