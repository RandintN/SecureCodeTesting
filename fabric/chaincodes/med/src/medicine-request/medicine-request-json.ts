import { IMedicineBaseJson } from '../medicine/medicine-base-json';
import { IMedicineRequestClaPharmIndJson } from '../medicine/medicine-initial-transaction-json';
import { IRequestExchangeJson } from './exchange-json';

export interface IMedicineRequestJson extends IMedicineBaseJson {
    medicine:       IMedicineRequestClaPharmIndJson;
    exchange:       IRequestExchangeJson[];
}
