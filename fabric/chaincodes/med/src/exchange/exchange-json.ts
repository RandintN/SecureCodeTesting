import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';

export interface IExchangeJson {
    amount: string;
    medicine: IMedicineExchangeJson;
}
