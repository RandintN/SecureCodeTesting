import { Medicine } from '../medicine-abstract/medicine';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';

export class MedicineOfferExchange extends Medicine {
    //#region constants
    //#endregion

    public classification: string;
    public pharmaIndustry: string;
    

    public fromJson(medicineExchange: IMedicineExchangeJson): void {

        this.activeIngredient = medicineExchange.active_ingredient;
        this.classification = medicineExchange.classification;
        this.commercialName = medicineExchange.commercial_name;
        this.concentration = medicineExchange.concentration;
        this.pharmaForm = medicineExchange.pharma_form;
        this.pharmaIndustry = medicineExchange.pharma_industry;

    }

    public toJson(): IMedicineExchangeJson {

        const json: IMedicineExchangeJson = {
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
        console.log("Rodou offer.");
        const validationResult: ValidationResult = new ValidationResult();

        return validationResult;
    }

}
