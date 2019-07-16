import { IMedicineRequestExchangeJson } from './medicine-exchange-json';

/**
 * @author fmarino - CPqD
 *
 * Interface that's used as interface to data transfer json objects
 */
export interface IRequestExchangeJson {

    /**
     * Amount of exchange
     */
    amount: string;

    /**
     * Medicine offered to exchange
     */
    medicine: IMedicineRequestExchangeJson;
}
