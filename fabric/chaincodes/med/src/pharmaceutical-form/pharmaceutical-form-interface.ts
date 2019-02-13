import { Context } from 'fabric-contract-api';

export interface IPharmaceuticalFormService {
    addPharmaceuticalForm(ctx: Context, strPharmaceuticalForm: string): Promise<string>;

    queryPharmaceuticalFormByKey(ctx: Context, key: string): Promise<string>;

    queryPharmaceuticalFormByForm(ctx: Context, strPharmaceuticalForm: string): Promise<string>;
}
