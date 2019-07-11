import { Medicine } from '../medicine-abstract/medicine';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { Exchange } from '../exchange/exchange-model';
import { IMedicineJson } from '../medicine-abstract/medicine-json';

export class MedicineModel extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('MO-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('MO-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('MO-003', 'The parameter concentration cannot be empty or null');

    //#endregion

    public exchange:        Exchange[];
    public type:            string;
    public status:          any;

    public fromJson(medicine: IMedicineJson): void {
        this.activeIngredient = medicine.active_ingredient;
        this.commercialName = medicine.commercial_name;
        this.concentration = medicine.concentration;
        this.pharmaForm = medicine.pharma_form;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (!this.activeIngredient) {
            validationResult.errors.push(MedicineModel.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (!this.pharmaForm) {
            validationResult.errors.push(MedicineModel.ERROR_EMPTY_PHARMA_FORM);
        }

        if (!this.concentration) {
            validationResult.errors.push(MedicineModel.ERROR_EMPTY_CONCENTRATION);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

}
