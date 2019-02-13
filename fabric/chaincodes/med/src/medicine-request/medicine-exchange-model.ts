import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineExchangeJson } from './medicine-exchange-json';
import { Medicine } from './medicine-model';

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

    public classification: string;
    public pharmaIndustry: string;

    public fromJson(medicineExchange: IMedicineExchangeJson): void {
        this.activeIngredient = medicineExchange.active_ingredient;
        this.classification = medicineExchange.classification;
        this.comercialName = medicineExchange.comercial_name;
        this.concentration = medicineExchange.concentration;
        this.dosage = medicineExchange.dosage;
        this.pharmaForm = medicineExchange.pharma_form;
        this.pharmaIndustry = medicineExchange.pharma_industry;
    }

    public toJson(): IMedicineExchangeJson {
        const json: IMedicineExchangeJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            comercial_name: this.comercialName,
            concentration: this.concentration,
            dosage: this.dosage,
            pharma_form: this.activeIngredient,
            pharma_industry: this.pharmaIndustry,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.activeIngredient === null || this.activeIngredient === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (this.pharmaForm === null || this.pharmaForm === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_FORM);
        }

        if (this.concentration === null || this.concentration === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CONCENTRATION);
        }

        if (this.pharmaIndustry === null || this.pharmaIndustry === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_INDUSTRY);
        }

        if (this.classification === null || this.classification === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CLASSIFICATION);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
