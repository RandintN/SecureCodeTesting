import { IExchangeJson } from './exchange-json';
import { IMedicineOfferJson } from './medicine-offer-json';

export interface IMedicineRequestJson {
    org_id: string;
    amount: string;
    medicine: IMedicineOfferJson;
    type: string[];
    return_date: string;
    exchange: IExchangeJson[];

}
