import { IMedicineBaseJson } from '../medicine/medicine-base-json';
import { IMedicineOfferClaPharmIndJson } from './medicine-offer-classification-pharma-industry-json';
import { IOfferExchangeJson } from './exchange-json';

export interface IMedicineOfferJson extends IMedicineBaseJson {
    offer_id: string;
    medicine: IMedicineOfferClaPharmIndJson;
    exchange: IOfferExchangeJson[];
}
