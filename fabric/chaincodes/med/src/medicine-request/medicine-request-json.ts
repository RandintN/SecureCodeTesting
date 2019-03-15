import { IExchangeJson } from '../exchange/exchange-json';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineRequestStatusEnum } from '../utils/enums';

export interface IMedicineRequestJson {
    amount: string;
    medicine: IMedicineOfferJson;
    type: string;
    return_date: string;
    exchange: IExchangeJson[];
    status: MedicineRequestStatusEnum;

}
