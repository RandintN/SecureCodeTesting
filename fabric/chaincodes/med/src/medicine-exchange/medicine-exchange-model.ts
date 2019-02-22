import { Medicine } from '../medicine-abstract/medicine-model';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';
import { MedicineBatch } from '../medicine-batch/medicine-batch-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineExchangeJson } from './medicine-exchange-json';

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

    private static ERROR_EMPTY_MEDICINE_BATCH: ValidationError =
        new ValidationError('ME-006', 'The parameter medicine_batch cannot be empty or null');

    private static ERROR_DUPLICATED_BATCH: ValidationError =
        new ValidationError('ME-007', 'The parameter medicine_batch cannot be duplicated');

    private static ERROR_DUPLICATED_UNDEFINED_BATCH: ValidationError =
        new ValidationError('ME-007', 'Unidentifieds medicine_batch cannot have the same expirate_date');
    //#endregion

    public classification: string;
    public pharmaIndustry: string;
    public refValue: number;
    public medicineBatch: MedicineBatch[];

    public fromJson(medicineExchange: IMedicineExchangeJson): void {
        this.medicineBatch = [];

        medicineExchange.medicine_batch.forEach((mbj) => {
            const medicineBatch: MedicineBatch = new MedicineBatch();
            medicineBatch.fromJson(mbj);
            this.medicineBatch.push(medicineBatch);

        });

        this.activeIngredient = medicineExchange.active_ingredient;
        this.classification = medicineExchange.classification;
        this.comercialName = medicineExchange.comercial_name;
        this.concentration = medicineExchange.concentration;
        this.dosage = medicineExchange.dosage;
        this.pharmaForm = medicineExchange.pharma_form;
        this.pharmaIndustry = medicineExchange.pharma_industry;

    }

    public toJson(): IMedicineExchangeJson {
        const medicineBatchJson: IMedicineBatchJson[] = [];

        this.medicineBatch.forEach((mb) => {
            medicineBatchJson.push(mb.toJson());

        });

        const json: IMedicineExchangeJson = {
            active_ingredient: this.activeIngredient,
            classification: this.classification,
            comercial_name: this.comercialName,
            concentration: this.concentration,
            dosage: this.dosage,
            medicine_batch: medicineBatchJson,
            pharma_form: this.activeIngredient,
            pharma_industry: this.pharmaIndustry,
            ref_value: this.refValue,

        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.activeIngredient) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_ACTIVE_INGREDIENT);

        }

        if (!this.pharmaForm) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_FORM);

        }

        if (!this.concentration) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CONCENTRATION);

        }

        if (!this.pharmaIndustry) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_PHARMA_INDUSTRY);

        }

        if (!this.classification === null || this.classification === undefined) {
            validationResult.errors.push(MedicineExchange.ERROR_EMPTY_CLASSIFICATION);

        }

        if (!this.medicineBatch || this.medicineBatch.length < 1) {
            validationResult.addError(MedicineExchange.ERROR_EMPTY_MEDICINE_BATCH);
        }

        const validationOfDuplicatedBatches: ValidationResult = this.validateDuplicatedBatches();

        if (!validationOfDuplicatedBatches.isValid) {
            validationResult.addErrors(validationOfDuplicatedBatches.errors);

        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    private validateDuplicatedBatches() {
        const validationResult: ValidationResult = new ValidationResult();

        const batches: string[] = [];
        this.medicineBatch.filter((mb) => mb.batch !== null && mb.batch !== undefined).
            forEach((mbnn) => {
                batches.push(mbnn.batch);
            });

        const validationResultOfIndentifiedBatches: ValidationResult =
            this.validateDuplicatedItems(batches, MedicineExchange.ERROR_DUPLICATED_BATCH);

        if (!validationResultOfIndentifiedBatches.isValid) {
            validationResult.addErrors(validationResultOfIndentifiedBatches.errors);

        }

        const expirateDatesOfUnidentifiedBatches: string[] = [];

        this.medicineBatch.filter((mb) => !mb.batch).forEach((mbu) => {
            expirateDatesOfUnidentifiedBatches.push(mbu.expireDate);
        });

        const validationResultOfUnindentifiedBatches: ValidationResult =
            this.validateDuplicatedItems(batches, MedicineExchange.ERROR_DUPLICATED_UNDEFINED_BATCH);

        if (!validationResultOfUnindentifiedBatches.isValid) {
            validationResult.addErrors(validationResultOfUnindentifiedBatches.errors);

        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    private validateDuplicatedItems(items: any[], errorInDuplicatedCase: ValidationError): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        const object: any = {};

        items.forEach((item) => {
            if (!object[item]) {
                object[item] = 0;

            }

            object[item] += 1;

        });

        for (const prop in object) {
            if (object[prop] >= 2) {
                validationResult.addError(errorInDuplicatedCase);

            }

        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

}
