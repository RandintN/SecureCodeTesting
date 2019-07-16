import { Medicine } from '../medicine-abstract/medicine';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineOfferExchangeJson } from './medicine-exchange-json';

export class MedicineOfferExchange extends Medicine {
    //#region constants
    //#endregion

    public classification: string[];
    public pharmaIndustry: string[];
    

    public fromJson(medicineExchange: IMedicineOfferExchangeJson): void {

        this.activeIngredient = medicineExchange.active_ingredient;
        this.classification = medicineExchange.classification;
        this.commercialName = medicineExchange.commercial_name;
        this.concentration = medicineExchange.concentration;
        this.pharmaForm = medicineExchange.pharma_form;
        this.pharmaIndustry = medicineExchange.pharma_industry;

    }

    public toJson(): IMedicineOfferExchangeJson {

        const json: IMedicineOfferExchangeJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,

        };

        return json;
    }

    //Este método não faz nada. Você pode apaga-lo, se isso não impactar outras coisas.
    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        return validationResult;
    }

}
