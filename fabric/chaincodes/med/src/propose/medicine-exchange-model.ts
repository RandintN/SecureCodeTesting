import { Medicine } from '../medicine-abstract/medicine';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';
import { MedicineBatch } from '../medicine-batch/medicine-batch-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineRequestExchangeJson } from '../medicine-request/medicine-exchange-json';
import { IProposedExchangeJson } from './proposed-exchange-json';
import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';

export class MedicineProposeExchange extends Medicine {
    //#region constants
    private static ERROR_EMPTY_ACTIVE_INGREDIENT: ValidationError =
        new ValidationError('ME-001', 'The parameter active_ingredient cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_FORM: ValidationError =
        new ValidationError('ME-002', 'The parameter pharma_form cannot be empty or null');

    private static ERROR_EMPTY_CONCENTRATION: ValidationError =
        new ValidationError('ME-003', 'The parameter concentration cannot be empty or null');

    private static ERROR_EMPTY_PHARMA_INDUSTRY: ValidationError =
        new ValidationError('ME-004', 'The parameter pharma_industry cannot be empty or null');

    private static ERROR_EMPTY_CLASSIFICATION: ValidationError =
        new ValidationError('ME-005', 'The parameter classification cannot be empty or null');

    private static ERROR_EMPTY_MEDICINE_BATCH: ValidationError =
        new ValidationError('ME-006', 'The parameter medicine_batch cannot be empty or null');

    //#endregion

    public classification: string;
    public pharmaIndustry: string;
    public refValue: number;
    public medicineBatch: MedicineBatch[];

    public fromJson(proposedExchange: IMedicineExchangeJson): void {
        this.medicineBatch = [];

        try {
            if (proposedExchange.medicine_batch) {
                for (const batchJson of proposedExchange.medicine_batch) {
                    const medicineBatch: MedicineBatch = new MedicineBatch();
                    medicineBatch.fromJson(batchJson);
                    this.medicineBatch.push(medicineBatch);

                }

            }

        } catch (error) {
            throw Error(error + ' ME-51');
        }

        this.activeIngredient = proposedExchange.active_ingredient;
        this.classification = proposedExchange.classification;
        this.commercialName = proposedExchange.commercial_name;
        this.concentration = proposedExchange.concentration;
        this.pharmaForm = proposedExchange.pharma_form;
        this.pharmaIndustry = proposedExchange.pharma_industry;
    }

    public toJson(): IMedicineExchangeJson {
        const medicineBatchJson: IMedicineBatchJson[] = [];

        try {
            if (this.medicineBatch) {
                for (const batch of this.medicineBatch) {
                    medicineBatchJson.push(batch.toJson());

                }

            }

        } catch (error) {
            throw Error(error + ' ME-75');
        }

        const json: IMedicineExchangeJson = {
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
            validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_ACTIVE_INGREDIENT);

        }

        if (!this.pharmaForm) {
            validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_PHARMA_FORM);

        }

        if (!this.concentration) {
            validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_CONCENTRATION);

        }

        if (!this.pharmaIndustry) {
            validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_PHARMA_INDUSTRY);

        }

        if (!this.classification === null || this.classification === undefined) {
            validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_CLASSIFICATION);

        }

        if (!this.medicineBatch || this.medicineBatch.length < 1) {
            validationResult.addError(MedicineProposeExchange.ERROR_EMPTY_MEDICINE_BATCH);

        } else {
            const medicineBatch = new MedicineBatch();
            let validationMedicineBatch: ValidationResult;

            const error: boolean = this.medicineBatch.some((batch) => {
                validationMedicineBatch = batch.isValid();
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
