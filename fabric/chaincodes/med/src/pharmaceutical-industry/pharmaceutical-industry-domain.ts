import { Context } from 'fabric-contract-api';
import { Guid } from 'guid-typescript';
import { ValidationResult } from '../validation/validation-model';
import { IPharmaceuticalIndustryService } from './pharmaceutical-industry-interface';
import { IPharmaceuticalIndustryJson } from './pharmaceutical-industry-json';
import { PharmaceuticalIndustry } from './pharmaceutical-industry-model';

export class PharmaceuticalIndustryDomain implements IPharmaceuticalIndustryService {
    //#region constants
    private static ADMIN_MSP: string = 'n2mimsp';
    //#endregion

    public async addPharmaceuticalIndustry(ctx: Context, strPharmaceuticalIndustry: string): Promise<string> {
        try {
            if (PharmaceuticalIndustryDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error('Invalid active ingredient');
            }

            const pharmaceuticalIndustry: PharmaceuticalIndustry = new PharmaceuticalIndustry();
            pharmaceuticalIndustry.fromJson(JSON.parse(strPharmaceuticalIndustry) as IPharmaceuticalIndustryJson);
            const validationResult: ValidationResult = (pharmaceuticalIndustry as PharmaceuticalIndustry).isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const pharmaceuticalIndustryID: string = Guid.create().toString();
            await ctx.stub.putState(pharmaceuticalIndustryID, Buffer.from(strPharmaceuticalIndustry));

            return pharmaceuticalIndustryID;

        } catch (error) {
            return JSON.stringify(error + 'Error ocurrence');
        }
    }

    public async queryPharmaceuticalIndustryByKey(ctx: Context, key: string): Promise<string> {
        const pharmaceuticalIndustryInBytes = await ctx.stub.getState(key);
        return pharmaceuticalIndustryInBytes.toString();
    }

    public async queryPharmaceuticalIndustryByName(ctx: Context, name: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

}
