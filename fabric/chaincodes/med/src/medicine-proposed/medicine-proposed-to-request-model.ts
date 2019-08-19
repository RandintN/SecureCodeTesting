import { Medicine } from '../medicine-abstract/medicine';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';
import { MedicineBatch } from '../medicine-batch/medicine-batch-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineProposedRequestJson } from './medicine-proposed-request-json';

export class MedicineProposedToRequest extends Medicine {

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

    private static ERROR_EMPTY_MEDICINE_BATCH: ValidationError =
        new ValidationError('MO-006', 'The parameter medicine_batch cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MO-008', 'The parameter amount cannot be empty or null');

    private static ERROR_DUPLICATE_EXPIRE_DATE: ValidationError =
        new ValidationError('MO-009', 'The parameter expire_date of medicine_batch cannot be repeated.');



    //#endregion
    public pharmaIndustry: string;
    public classification: string;
    public refValue: number;
    public medicineBatch: MedicineBatch[];

    public fromJson(medicineOffered: IMedicineProposedRequestJson): void {
        this.medicineBatch = new Array<MedicineBatch>();

        try {
            if (medicineOffered.medicine_batch) {
                for (const batchJson of medicineOffered.medicine_batch) {
                    const medicineBatch = new MedicineBatch();
                    medicineBatch.fromJson(batchJson);
                    this.medicineBatch.push(medicineBatch);
                }
            }
        } catch (error) {
            throw Error(error + ' ME-51');

        }

        this.activeIngredient = medicineOffered.active_ingredient;
        this.commercialName = medicineOffered.commercial_name;
        this.pharmaForm = medicineOffered.pharma_form;
        this.concentration = medicineOffered.concentration;
        this.classification = medicineOffered.classification;
        this.pharmaIndustry = medicineOffered.pharma_industry;
        this.refValue = medicineOffered.ref_value;

    }

    public toJson(): IMedicineProposedRequestJson {
        const medicineBatchJson: IMedicineBatchJson[] = new Array<IMedicineBatchJson>();

        try {
            if (this.medicineBatch) {
                for (const batch of this.medicineBatch) {
                    medicineBatchJson.push(batch.toJson());

                }

            }

        } catch (error) {
            throw Error(error + ' ME-75');
        }

        const json: IMedicineProposedRequestJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            commercial_name: this.commercialName,
            concentration: this.concentration,
            medicine_batch: medicineBatchJson,
            pharma_form: this.pharmaForm,
            pharma_industry: this.pharmaIndustry,
            ref_value: this.refValue,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();


        if (!this.activeIngredient) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_ACTIVE_INGREDIENT);
        }

        if (!this.pharmaForm) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_PHARMA_FORM);
        }

        if (!this.concentration) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_CONCENTRATION);
        }

        if (!this.classification) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_CLASSIFICATION);
        }

        if (!this.pharmaIndustry) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_PHARMA_INDUSTRY);
        }

        if (!this.medicineBatch || this.medicineBatch.length < 1) {
            validationResult.addError(MedicineProposedToRequest.ERROR_EMPTY_MEDICINE_BATCH);

        } else {
            const medicineBatch = new MedicineBatch();
            let validationMedicineBatch: ValidationResult;
            let expireDateList : string[] = [];
            const error: boolean = this.medicineBatch.some((batch) => {
                validationMedicineBatch = batch.isValid();
                if(expireDateList.includes(batch.expireDate)){
                    validationResult.addError(MedicineProposedToRequest.ERROR_DUPLICATE_EXPIRE_DATE);
                }
                else{
                    expireDateList.push(batch.expireDate);
                }
                if (!validationMedicineBatch.isValid) {
                    validationResult.addErrors(validationMedicineBatch.errors);
                    return true;
                }
            });

            if (!error) {

                const validationOfDuplicatedBatches: ValidationResult
                    = medicineBatch.validateDuplicatedBatches(this.medicineBatch);

                if (!validationOfDuplicatedBatches.isValid) {
                    validationResult.addErrors(validationOfDuplicatedBatches.errors);

                }
            }
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

}
