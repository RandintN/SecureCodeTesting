import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';

export interface IMedicineRequestExchangeJson extends IMedicineExchangeJson {

        ref_value: number;
        medicine_batch: IMedicineBatchJson[];

}
