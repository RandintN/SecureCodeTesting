import { IExchangeJson } from '../exchange/exchange-json';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';

export interface IMedicineRequestJson {
    amount: string;
    medicine: IMedicineOfferJson;
    type: string;
    return_date: string;
    exchange: IExchangeJson[];

}
