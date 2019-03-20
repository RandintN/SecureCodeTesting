import { Medicine } from '../medicine-abstract/medicine-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineOfferJson } from './medicine-offer-json';

export class MedicineOffer extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('MO-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('MO-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('MO-003', 'The parameter concentration cannot be empty or null');

    //#endregion

    public classification: string[];
    public pharmaIndustry: string[];

    public fromJson(medicineExchange: IMedicineOfferJson): void {
        this.activeIngredient = medicineExchange.active_ingredient;
        this.classification = medicineExchange.classification;
        this.comercialName = medicineExchange.comercial_name;
        this.concentration = medicineExchange.concentration;
        this.dosage = medicineExchange.dosage;
        this.pharmaForm = medicineExchange.pharma_form;
        this.pharmaIndustry = medicineExchange.pharma_industry;
    }

    public toJson(): IMedicineOfferJson {
        const json: IMedicineOfferJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            comercial_name: this.comercialName,
            concentration: this.concentration,
            dosage: this.dosage,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (!this.activeIngredient) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (!this.pharmaForm) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_PHARMA_FORM);
        }

        if (!this.concentration) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_CONCENTRATION);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

}
