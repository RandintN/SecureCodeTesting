import { IMedicineJson } from '../medicine-abstract/medicine-json';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';

export interface IMedicineExchangeJson extends IMedicineJson {
        classification: string;
        pharma_industry: string;
        medicine_batch: IMedicineBatchJson[];
        ref_value: number;
}