import { TradeStatusEnum, MedicineOperationEnum } from '../utils/enums';

export interface ITradeBaseJson {
    id:             string;
    internal_id:    string;
    amount:         string;
    type:           string;
    return_date:    string;
    status:         TradeStatusEnum;
    operation:      MedicineOperationEnum;
}
