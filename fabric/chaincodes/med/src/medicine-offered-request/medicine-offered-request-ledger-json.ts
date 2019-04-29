import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';

export interface IMedicineOfferedRequestLedgerJson extends IMedicineOfferedRequestJson {
    key: string;
    msp_id: string;
}
