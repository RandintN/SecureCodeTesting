import { IMedicineOfferedJson } from '../medicine-offered/medicine-offered-json';
import { MedicineRequestStatusEnum } from '../utils/enums';

export interface IMedicineOfferedRequestJson {
    request_id: string;
    amount: string;
    medicine: IMedicineOfferedJson;
    type: string;
    new_return_date: string;
    exchange: IMedicineOfferedJson;
    status: MedicineRequestStatusEnum;
    observations: string;
}
