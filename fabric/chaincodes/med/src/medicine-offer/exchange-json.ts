import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';

/**
 * @author fmarino - CPqD
 *
 * Interface that's used as interface to data transfer json objects
 */
export interface IOfferExchangeJson {

    /**
     * Amount of exchange
     */
    amount: string;

    /**
     * Medicine offered to exchange
     */
    medicine: IMedicineExchangeJson;
}
