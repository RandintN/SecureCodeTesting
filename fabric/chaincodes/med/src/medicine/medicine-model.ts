import { Medicine } from '../medicine-abstract/medicine';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineInitialTransactionJson } from '../medicine-offer/medicine-initial-transaction-json';
import { Exchange } from '../exchange/exchange-model';

export class MedicineModel extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('MO-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('MO-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('MO-003', 'The parameter concentration cannot be empty or null');

    //#endregion

    public classification:  string[];
    public pharmaIndustry:  string[];
    public exchange:        Exchange[];
    public type:            string;
    public status:          any;

    public fromJson(medicineOffer: IMedicineInitialTransactionJson): void {
        this.activeIngredient = medicineOffer.active_ingredient;
        this.classification = medicineOffer.classification;
        this.commercialName = medicineOffer.commercial_name;
        this.concentration = medicineOffer.concentration;
        this.pharmaForm = medicineOffer.pharma_form;
        this.pharmaIndustry = medicineOffer.pharma_industry;
    }

    public toJson(): IMedicineInitialTransactionJson {
        const json: IMedicineInitialTransactionJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
        };

        return json;
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
