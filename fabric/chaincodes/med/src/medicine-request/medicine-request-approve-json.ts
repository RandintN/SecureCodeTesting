import { MedicineRequestStatusEnum } from '../utils/enums';

export interface IMedicineRequestApproveJson {
    id: string;
    status: MedicineRequestStatusEnum;

}
