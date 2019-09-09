import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IPharmaceuticalIndustryService } from './pharmaceutical-industry-interface';
import { IPharmaceuticalIndustryJson } from './pharmaceutical-industry-json';
import { PharmaceuticalIndustry } from './pharmaceutical-industry-model';

export class PharmaceuticalIndustryDomain implements IPharmaceuticalIndustryService {
    //#region constants

    private static ADMIN_MSP: string = 'n2mimsp';

    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('PID-001', 'Forbidden');

    private static ERROR_PHARMACEUTICAL_INDUSTRY_NOT_FOUND: ValidationError =
        new ValidationError('PID-002', 'The pharma_industry is not found.');

    private static ERROR_PHARMACEUTICAL_INDUSTRY_INACTIVATED: ValidationError =
        new ValidationError('PID-003', 'The pharma_industry is not active for negotiation.');

    //#endregion

    public async addPharmaceuticalIndustry(ctx: Context, strPharmaceuticalIndustry: string): Promise<string> {
        try {
            if (PharmaceuticalIndustryDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error(JSON.stringify(PharmaceuticalIndustryDomain.ERROR_NOT_ALLOWED_MSP));
            }

            const pharmaceuticalIndustry: PharmaceuticalIndustry = new PharmaceuticalIndustry();
            pharmaceuticalIndustry.fromJson(JSON.parse(strPharmaceuticalIndustry) as IPharmaceuticalIndustryJson);

            const validationResult: ValidationResult = (pharmaceuticalIndustry as PharmaceuticalIndustry).isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const pharmaceuticalIndustryID: string = Guid.create().toString();
            await ctx.stub.putState(pharmaceuticalIndustryID,
                Buffer.from(JSON.stringify(pharmaceuticalIndustry.toJson())));

            return pharmaceuticalIndustryID;

        } catch (error) {
            return JSON.stringify(error);
        }

    }

    public async queryPharmaceuticalIndustryByKey(ctx: Context, key: string): Promise<string> {
        const pharmaceuticalIndustryInBytes = await ctx.stub.getState(key);

        return pharmaceuticalIndustryInBytes.toString();
    }

    public async queryPharmaceuticalIndustryByName(ctx: Context, pharmaceuticalLaboratory: string): Promise<string> {
        const queryJson = {
            selector: {
                pharma_industry: pharmaceuticalLaboratory,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const pharmaceuticalIndustry: PharmaceuticalIndustry = await this.getPharmaceuticalIndustry(iterator);

        return pharmaceuticalIndustry ? JSON.stringify(pharmaceuticalIndustry.toJson()) : null;
    }

    public async validatePharmaceuticalIndustry(ctx: Context, pharmaIndustry: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const pharmaceuticalIndustry: PharmaceuticalIndustry = await this.
                getPharmaceuticalIndustryByName(ctx, pharmaIndustry);

            if (!pharmaceuticalIndustry) {
                validationResult.errors.push(PharmaceuticalIndustryDomain.ERROR_PHARMACEUTICAL_INDUSTRY_NOT_FOUND);
                validationResult.isValid = false;

                return validationResult;
            }

            if (pharmaceuticalIndustry.situation !== SituationEnum.ACTIVE) {
                validationResult.errors.push(PharmaceuticalIndustryDomain.ERROR_PHARMACEUTICAL_INDUSTRY_INACTIVATED);
                validationResult.isValid = false;

                return validationResult;
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    public async getPharmaceuticalIndustryByName(ctx: Context, pharmaceuticalIndustryName: string)
        : Promise<PharmaceuticalIndustry> {

        let pharmaceuticalIndustry: PharmaceuticalIndustry = null;
        const strPharmaceuticalIndustry: string =
            await this.queryPharmaceuticalIndustryByName(ctx, pharmaceuticalIndustryName);

        if (strPharmaceuticalIndustry) {
            pharmaceuticalIndustry = new PharmaceuticalIndustry();
            pharmaceuticalIndustry.fromJson(JSON.parse(strPharmaceuticalIndustry) as IPharmaceuticalIndustryJson);
            return pharmaceuticalIndustry;
        }

        return null;
    }

    //#region private methods
    private async getPharmaceuticalIndustry(iterator: Iterators.StateQueryIterator):
        Promise<PharmaceuticalIndustry> {

        let pharmaceuticalIndustry: PharmaceuticalIndustry = null;
        let pharmaceuticalIndustryJson: IPharmaceuticalIndustryJson;

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                pharmaceuticalIndustryJson =
                    JSON.parse(result.value.value.toString('utf8')) as IPharmaceuticalIndustryJson;

            }

            if (result.done) {
                break;
            }

        }

        if (pharmaceuticalIndustryJson) {
            pharmaceuticalIndustry = new PharmaceuticalIndustry();
            pharmaceuticalIndustry.fromJson(pharmaceuticalIndustryJson);
        }

        return pharmaceuticalIndustry;
    }
    //#endregion

}
