import { IMedicineOfferedJson } from '../medicine-offered/medicine-offered-json';
import { MedicineOfferedStatusEnum } from '../utils/enums';

export interface IMedicineOfferedRequestJson {
    request_id: string;
    medicine: IMedicineOfferedJson;
    type: string;
    new_return_date: string;
    status: MedicineOfferedStatusEnum;
    observations: string;
}
