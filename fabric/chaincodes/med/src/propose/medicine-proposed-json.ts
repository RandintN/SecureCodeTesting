import { IMedicineProposedBaseJson } from '../medicine-proposed/medicine-proposed-base-json';
import { MedicineProposedStatusEnum, MedicineOperationEnum } from '../utils/enums';
import { IProposedExchangeJson } from './medicine-propose-exchange-json';

export interface IMedicineProposedJson {
    id: string;
    medicine:           IMedicineProposedBaseJson;
    type:               string;
    new_return_date:    string;
    status:             MedicineProposedStatusEnum;
    observations:       string;
    propose_id:         string;
    operation:          MedicineOperationEnum;
    exchange:           IProposedExchangeJson;
}
