import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { Medicine } from './medicine';

export class MedicineExchange extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('ME-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('ME-003', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('ME-004', 'The parameter concentration cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_INDUSTRY: ValidationError =
        new ValidationError('ME-005', 'The parameter pharma_industry cannot be empty or null');

    private static ERROR_EMPTY_CLASSIFICATION: ValidationError =
        new ValidationError('ME-006', 'The parameter classification cannot be empty or null');

    //#endregion

    // tslint:disable-next-line:variable-name
    public classification: string;
    // tslint:disable-next-line:variable-name
    public pharma_industry: string;

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.active_ingredient === null || this.active_ingredient === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (this.pharma_form === null || this.pharma_form === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_FORM);
        }

        if (this.concentration === null || this.concentration === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CONCENTRATION);
        }

        if (this.pharma_industry === null || this.pharma_industry === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_INDUSTRY);
        }

        if (this.classification === null || this.classification === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CLASSIFICATION);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
