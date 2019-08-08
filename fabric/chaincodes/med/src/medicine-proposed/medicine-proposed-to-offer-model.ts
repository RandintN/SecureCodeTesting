import { Medicine } from '../medicine-abstract/medicine';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineProposedOfferJson } from './medicine-proposed-offer-json';

export class MedicineProposedToOffer extends Medicine {

    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('MO-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('MO-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('MO-003', 'The parameter concentration cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_INDUSTRY: ValidationError =
        new ValidationError('MO-004', 'The parameter pharma_industry cannot be empty or null');

    private static ERROR_EMPTY_CLASSIFICATION: ValidationError =
        new ValidationError('MO-005', 'The parameter classification cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MO-008', 'The parameter amount cannot be empty or null');

    //#endregion
    public amount: string;
    public pharmaIndustry: string;
    public classification: string;
    public refValue: number;
    

    public fromJson(medicineOffered: IMedicineProposedOfferJson): void {
      
        this.amount = medicineOffered.amount;
        this.activeIngredient = medicineOffered.active_ingredient;
        this.commercialName = medicineOffered.commercial_name;
        this.pharmaForm = medicineOffered.pharma_form;
        this.concentration = medicineOffered.concentration;
        this.classification = medicineOffered.classification;
        this.pharmaIndustry = medicineOffered.pharma_industry;
        this.refValue = medicineOffered.ref_value;

    }

    public toJson(): IMedicineProposedOfferJson {

        const json: IMedicineProposedOfferJson = {
            active_ingredient: this.activeIngredient,
            amount: this.amount,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
            ref_value: this.refValue,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.amount) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_AMOUNT);

        }

        if (!this.activeIngredient) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (!this.pharmaForm) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_PHARMA_FORM);
        }

        if (!this.concentration) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_CONCENTRATION);
        }

        if (!this.classification) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_CLASSIFICATION);
        }

        if (!this.pharmaIndustry) {
            validationResult.addError(MedicineProposedToOffer.ERROR_EMPTY_PHARMA_INDUSTRY);
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

}
