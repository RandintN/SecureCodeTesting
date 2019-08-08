import { MedicineStatusEnum, MedicineOperationEnum } from '../utils/enums';

export interface IMedicineBaseJson {
    id:             string;
    internal_id:    string;
    amount:         string;
    type:           string;
    return_date:    string;
    status:         MedicineStatusEnum;
    operation:      MedicineOperationEnum;
}
