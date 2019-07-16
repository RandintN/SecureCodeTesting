import { MedicineStatusEnum } from '../utils/enums';

export interface IMedicineBaseJson {
    amount: string;
    type: string;
    return_date: string;
    status: MedicineStatusEnum;
}
