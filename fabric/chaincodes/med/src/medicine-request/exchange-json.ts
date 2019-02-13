import { IMedicineExchangeJson } from './medicine-exchange-json';

export interface IExchangeJson {
    amount: string;
    medicine: IMedicineExchangeJson;
}
