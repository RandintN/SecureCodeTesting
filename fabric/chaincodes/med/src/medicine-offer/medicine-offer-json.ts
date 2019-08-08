import { IMedicineBaseJson } from '../medicine/medicine-base-json';
import { IMedicineOfferClaPharmIndJson } from './medicine-offer-classification-pharma-industry-json';
import { IOfferExchangeJson } from './exchange-json';

export interface IMedicineOfferJson extends IMedicineBaseJson {
    medicine:       IMedicineOfferClaPharmIndJson;
    exchange:       IOfferExchangeJson[];
}
