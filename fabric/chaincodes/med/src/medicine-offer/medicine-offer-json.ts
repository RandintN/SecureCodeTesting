import { ITradeBaseJson } from '../medicine/medicine-base-json';
import { IMedicineOfferClaPharmIndJson } from './medicine-offer-classification-pharma-industry-json';
import { IOfferExchangeJson } from './exchange-json';

export interface IMedicineOfferJson extends ITradeBaseJson {
    medicine:       IMedicineOfferClaPharmIndJson;
    exchange:       IOfferExchangeJson[];
}
