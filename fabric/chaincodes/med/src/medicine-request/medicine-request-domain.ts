import { Context } from 'fabric-contract-api';
import { Guid } from 'guid-typescript';
import { ActiveIngredientDomain } from '../active-ingredient/active-ingredient-domain';
import { ActiveIngredient } from '../active-ingredient/active-ingredient-model';
import { Result } from '../result/result';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineRequestService } from './medicine-request-interface';
import { MedicineRequest } from './medicine-request-model';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants
    private static ERROR_ACTIVE_INGREDIENT_NOT_FOUND: ValidationError =
        new ValidationError('MRD-001', 'The active_ingredient is not found.');

    private static ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED: ValidationError =
        new ValidationError('MRD-001', 'The active_ingredient is not allowed for negotiation.');
    //#endregion

    //#region region of methods to be invoked

    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<string> {

        try {
            const medicineRequest: MedicineRequest = JSON.parse(medRequestJson);

            if (medicineRequest.isValid()) {
                return 'Deu certo a validação';
            }

            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult));
            }
            const idRequest: Guid = Guid.create();
            await ctx.stub.putPrivateData('N2miMSP-PD', idRequest.toString(), Buffer.from(medRequestJson));

            const timestamp: number = new Date().getTime();

            const result: Result = new Result();

            result.id = idRequest;
            result.timestamp = timestamp;

            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify(error);
        }
    }
    //#endregion

    //#region region of queries

    public async queryMedicineRequest(ctx: Context): Promise<string> {
        const requestAsByte = await ctx.stub.getPrivateData('N2miMSP-PD', 'test');
        return JSON.stringify(requestAsByte.toString());
    }

    //#endregion

    //#region of private methods
    private async validateMedicineRequestRules(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        const medicineBasicValidation: ValidationResult = medicineRequest.isValid();

        if (!medicineBasicValidation.isValid) {
            return medicineBasicValidation;
        }

        const activeIngredientDomain: ActiveIngredientDomain = new ActiveIngredientDomain();

        const activeIngredient: ActiveIngredient = await activeIngredientDomain.
            getActiveIngredientByName(ctx, medicineRequest.medicine.active_ingredient);

        if (!activeIngredient) {
            validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_INGREDIENT_NOT_FOUND);
            validationResult.isValid = false;
            return validationResult;
        }

        if (activeIngredient.special) {
            validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED);
            validationResult.isValid = false;
            return validationResult;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }
    //#endregion
}
