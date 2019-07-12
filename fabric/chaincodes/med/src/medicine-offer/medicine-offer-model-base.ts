import { MedicineModel } from "../medicine/medicine-model";
import { IMedicineOfferClaPharmIndJson } from "./medicine-offer-classification-pharma-industry-json";
import { MedicineBatch }        from "../medicine-batch/medicine-batch-model";
import { IMedicineBatchJson }   from "../medicine-batch/medicine-batch-json";


export class MedicineOfferModel extends MedicineModel {
    
    public classification:  string;
    public pharmaIndustry:  string;
    public ref_value:       number;
    public medicineBatch:   MedicineBatch[];

    public fromJson(medicineOffer: IMedicineOfferClaPharmIndJson): void {
        this.medicineBatch = [];

        super.fromJson(medicineOffer);
        this.classification = medicineOffer.classification;
        this.pharmaIndustry = medicineOffer.pharma_industry;
        this.ref_value = medicineOffer.ref_value;
        for (const batchJson of medicineOffer.medicine_batch) {
            const medicineBatch: MedicineBatch = new MedicineBatch();
            medicineBatch.fromJson(batchJson);
            this.medicineBatch.push(medicineBatch);
        }
    }

    public toJson(): IMedicineOfferClaPharmIndJson {
        const medicineBatchJson: IMedicineBatchJson[] = [];
        for (const batch of this.medicineBatch) {
            medicineBatchJson.push(batch.toJson());

        }

        const json: IMedicineOfferClaPharmIndJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
            ref_value: this.ref_value,
            medicine_batch: medicineBatchJson
        };

        return json;
    }
}
