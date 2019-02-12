import { Context } from 'fabric-contract-api';

export interface IMedicineClassificationService {
    addMedicineClassification(ctx: Context, strMedicineClassification: string): Promise<string>;

    queryMedicineClassificationByKey(ctx: Context, key: string): Promise<string>;

    queryMedicineClassificationByName(ctx: Context, name: string): Promise<string>;
}
