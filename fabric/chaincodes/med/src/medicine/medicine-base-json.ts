import { IExchangeJson } from '../exchange/exchange-json';
import { IMedicineInitialTransactionJson } from '../medicine-offer/medicine-initial-transaction-json';
import { MedicineStatusEnum } from '../utils/enums';

export interface IMedicineBaseJson {
    amount: string;
    medicine: IMedicineInitialTransactionJson;
    type: string;
    return_date: string;
    exchange: IExchangeJson[];
    status: MedicineStatusEnum;
}
