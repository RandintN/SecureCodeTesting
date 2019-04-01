import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';

export interface IMedicineOfferedJson {
    amount: string;
    active_ingredient: string;
    comercial_name: string;
    pharma_form: string;
    concentration: string;
    pharma_industry: string;
    classification: string;
    ref_value: number;
    medicine_batch: IMedicineBatchJson[];
}
