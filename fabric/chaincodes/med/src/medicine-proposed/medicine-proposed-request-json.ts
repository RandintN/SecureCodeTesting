import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';
import { IMedicineProposedBaseJson } from './medicine-proposed-base-json';

export interface IMedicineProposedRequestJson extends IMedicineProposedBaseJson {
    medicine_batch: IMedicineBatchJson[];
}
