import { IProposedJson } from './medicine-proposed-json';

export interface IMedicineProposedLedgerJson extends IProposedJson {
    key: string;
    msp_id: string;
}
