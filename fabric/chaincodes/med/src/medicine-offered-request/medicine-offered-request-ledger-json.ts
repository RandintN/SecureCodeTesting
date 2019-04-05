import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';

export interface IMedicineOfferedRequestLedgerJson extends IMedicineOfferedRequestJson{
    msp_id: string;
}