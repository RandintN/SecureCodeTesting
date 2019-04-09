import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';

export interface IMedicineOfferedJson {
    active_ingredient: string;
    commercial_name: string;
    pharma_form: string;
    concentration: string;
    amount: string;
    pharma_industry: string;
    classification: string;
    ref_value: number;
    medicine_batch: IMedicineBatchJson[];
}
