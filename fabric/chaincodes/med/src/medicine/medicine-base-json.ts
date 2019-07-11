import { IExchangeJson } from '../exchange/exchange-json';
import { MedicineStatusEnum } from '../utils/enums';

export interface IMedicineBaseJson {
    amount: string;
    type: string;
    return_date: string;
    exchange: IExchangeJson[];
    status: MedicineStatusEnum;
}
