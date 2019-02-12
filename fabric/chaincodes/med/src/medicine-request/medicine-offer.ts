import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { Medicine } from './medicine';

export class MedicineOffer extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('MO-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('MO-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('MO-003', 'The parameter concentration cannot be empty or null');

    //#endregion

    // tslint:disable-next-line:variable-name
    public classification: string[];
    // tslint:disable-next-line:variable-name
    public pharma_industry: string[];

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.active_ingredient === null || this.active_ingredient === undefined) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (this.pharma_form === null || this.pharma_form === undefined) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_PHARMA_FORM);
        }

        if (this.concentration === null || this.concentration === undefined) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_CONCENTRATION);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

}
