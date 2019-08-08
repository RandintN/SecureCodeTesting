import { IMedicineProposedJson } from './medicine-proposed-json';

export interface IMedicineProposedLedgerJson extends IMedicineProposedJson {
    key: string;
    msp_id: string;
}
