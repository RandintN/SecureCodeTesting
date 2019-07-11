import { MedicineModel } from "../medicine/medicine-model";
import { IMedicineRequestClaPharmIndJson } from "../medicine/medicine-initial-transaction-json";


export class MedicineRequestModel extends MedicineModel {
    
    public classification:  string[];
    public pharmaIndustry:  string[];

    public fromJson(medicineRequest: IMedicineRequestClaPharmIndJson): void {
        super.fromJson(medicineRequest);
        this.classification = medicineRequest.classification;
        this.pharmaIndustry = medicineRequest.pharma_industry;
    }

    public toJson(): IMedicineRequestClaPharmIndJson {
        const json: IMedicineRequestClaPharmIndJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
        };

        return json;
    }
}
