import { IMedicineRequestJson } from './medicine-request-json';

export interface IMedicineRequestLedgerJson extends IMedicineRequestJson {
    msp_id: string;

}
