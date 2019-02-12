import { Context } from 'fabric-contract-api';

export interface IPharmaceuticalIndustryService {
    addPharmaceuticalIndustry(ctx: Context, strPharmaceuticalIndustry: string): Promise<string>;

    queryPharmaceuticalIndustryByKey(ctx: Context, key: string): Promise<string>;

    queryPharmaceuticalIndustryByName(ctx: Context, pharmaceuticalLaboratory: string): Promise<string>;
}
