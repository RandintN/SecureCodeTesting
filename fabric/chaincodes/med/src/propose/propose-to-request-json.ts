import { MedicineProposedStatusEnum, MedicineOperationEnum } from '../utils/enums';
import { IMedicineProposedRequestJson } from '../medicine-proposed/medicine-proposed-request-json';

export interface IProposeToRequestJson {
    id: string;
    medicine:           IMedicineProposedRequestJson;
    type:               string;
    new_return_date:    string;
    status:             MedicineProposedStatusEnum;
    observations:       string;
    propose_id:         string;
    operation:          MedicineOperationEnum;
}
