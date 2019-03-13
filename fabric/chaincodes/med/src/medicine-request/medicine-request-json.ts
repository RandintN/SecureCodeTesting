import { IExchangeJson } from '../exchange/exchange-json';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';

export interface IMedicineRequestJson {
    user_id: string;
    affiliation_id: string;
    amount: string;
    medicine: IMedicineOfferJson;
    type: string;
    return_date: string;
    exchange: IExchangeJson[];

}
