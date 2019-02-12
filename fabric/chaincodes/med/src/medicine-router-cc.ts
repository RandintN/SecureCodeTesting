import { Context, Contract } from 'fabric-contract-api';
import 'reflect-metadata';
import { ActiveIngredientDomain } from './active-ingredient/active-ingredient-domain';
import { IActiveIngredientService } from './active-ingredient/active-ingredient-interface';
import { MedicineRequestDomain } from './medicine-request/medicine-request-domain';
import { IMedicineRequestService } from './medicine-request/medicine-request-interface';
import { PharmaceuticalIndustryDomain } from './pharmaceutical-industry/pharmaceutical-industry-domain';
import { IPharmaceuticalIndustryService } from './pharmaceutical-industry/pharmaceutical-industry-interface';

export class MedicineRouterCC extends Contract
    implements IActiveIngredientService, IPharmaceuticalIndustryService, IMedicineRequestService {

    //#region methods of active-ingredient
    public async addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string> {
        const activeIngredientService: IActiveIngredientService = new ActiveIngredientDomain();
        return await activeIngredientService.addActiveIngredient(ctx, strActiveIngredient);
    }

    public async queryActiveIngredientByKey(ctx: Context, key: string): Promise<string> {
        const activeIngredientService: IActiveIngredientService = new ActiveIngredientDomain();
        return await activeIngredientService.queryActiveIngredientByKey(ctx, key);
    }

    public async queryActiveIngredientByName(ctx: Context, name: string): Promise<string> {
        const activeIngredientService: IActiveIngredientService = new ActiveIngredientDomain();
        return await activeIngredientService.queryActiveIngredientByName(ctx, name);
    }
    //#endregion

    //#region of methods of IMedicineRequestService
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<string> {
        const medicuneRequest: IMedicineRequestService = new MedicineRequestDomain();
        return await medicuneRequest.addMedicineRequest(ctx, medRequestJson);
    }

    public async queryMedicineRequest(ctx: Context): Promise<string> {
        const medicuneRequest: IMedicineRequestService = new MedicineRequestDomain();
        return await medicuneRequest.queryMedicineRequest(ctx);
    }
    //#endregion

    //#region of methods of IPharmaceuticalIndustryService
    public async addPharmaceuticalIndustry(ctx: Context, strPharmaceuticalIndustry: string): Promise<string> {
        const pharmaceuticalIndustry: IPharmaceuticalIndustryService = new PharmaceuticalIndustryDomain();
        return await pharmaceuticalIndustry.addPharmaceuticalIndustry(ctx, strPharmaceuticalIndustry);
    }

    public async queryPharmaceuticalIndustryByKey(ctx: Context, key: string): Promise<string> {
        const pharmaceuticalIndustry: IPharmaceuticalIndustryService = new PharmaceuticalIndustryDomain();
        return await pharmaceuticalIndustry.queryPharmaceuticalIndustryByKey(ctx, key);
    }

    // tslint:disable-next-line:variable-name
    public async queryPharmaceuticalIndustryByName(ctx: Context, pharmaceutical_laboratory: string): Promise<string> {
        const pharmaceuticalIndustry: IPharmaceuticalIndustryService = new PharmaceuticalIndustryDomain();
        return await pharmaceuticalIndustry.queryPharmaceuticalIndustryByName(ctx, pharmaceutical_laboratory);
    }
    //#endregion
}
