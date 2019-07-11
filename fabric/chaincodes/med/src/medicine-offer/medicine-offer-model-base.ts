import { MedicineModel } from "../medicine/medicine-model";
import { IMedicineOfferClaPharmIndJson } from "./medicine-offer-classification-pharma-industry-json";


export class MedicineOfferModel extends MedicineModel {
    
    public classification:  string;
    public pharmaIndustry:  string;
    public ref_value:       number;

    public fromJson(medicineOffer: IMedicineOfferClaPharmIndJson): void {
        super.fromJson(medicineOffer);
        this.classification = medicineOffer.classification;
        this.pharmaIndustry = medicineOffer.pharma_industry;
        this.ref_value = medicineOffer.ref_value;
    }

    public toJson(): IMedicineOfferClaPharmIndJson {
        const json: IMedicineOfferClaPharmIndJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
            ref_value: this.ref_value
        };

        return json;
    }
}
