import * as moment from 'moment';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineBatchJson } from './medicine-batch-json';

export class MedicineBatch implements IValidator {
    private static ERROR_EMPTY_EXPIRE_DATE: ValidationError =
        new ValidationError('MB-001', 'The parameter expire_date cannot be empty or null');

    private static ERROR_BAD_FORMAT_EXPIRE_DATE: ValidationError =
        new ValidationError('MB-002', 'The format of expire_date is not supported. Supported format: yyyy-MM');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MB-003', 'The parameter amount cannot be empty or null');

    private static ERROR_INVALID_AMOUNT: ValidationError =
        new ValidationError('MB-004', 'The parameter amount must be greater than 0');

    private static ERROR_DUPLICATED_BATCH: ValidationError =
        new ValidationError('MB-005', 'The parameter medicine_batch cannot be duplicated');

    private static ERROR_DUPLICATED_UNDEFINED_BATCH: ValidationError =
        new ValidationError('MB-006', 'Unidentifieds medicine_batch cannot have the same expirate_date');

    public batch: string;
    public expireDate: string;
    public amount: number;
    [key: string]: any;

    public fromJson(json: IMedicineBatchJson): void {
        this.amount = json.amount;
        this.batch = json.batch;
        this.expireDate = json.expire_date;

    }

    public toJson(): IMedicineBatchJson {
        const json: IMedicineBatchJson = {
            amount: this.amount,
            batch: this.batch,
            expire_date: this.expireDate,

        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        // Validatin expireDate value
        if (!this.expireDate) {
            validationResult.addError(MedicineBatch.ERROR_EMPTY_EXPIRE_DATE);

        } else if (!moment(this.expireDate, CommonConstants.DATE_FORMAT, true).isValid()) {
            validationResult.addError(MedicineBatch.ERROR_BAD_FORMAT_EXPIRE_DATE);

        }

        // Validatin amount value
        if (!this.amount) {
            validationResult.addError(MedicineBatch.ERROR_EMPTY_AMOUNT);

        } else if (this.amount < 1) {
            validationResult.addError(MedicineBatch.ERROR_INVALID_AMOUNT);

        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

    public validateDuplicatedBatches(medicineBatch: MedicineBatch[]) {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const batches: string[] = [];
            const indentifiedBatches: MedicineBatch[] =
                medicineBatch.filter((mb) => mb.batch !== null && mb.batch !== undefined);

            for (const idBatch of indentifiedBatches) {
                batches.push(idBatch.batch);

            }

            if (batches && batches.length > 0) {
                const validationResultOfIndentifiedBatches: ValidationResult =
                    this.validateDuplicatedItems(batches, MedicineBatch.ERROR_DUPLICATED_BATCH);

                if (!validationResultOfIndentifiedBatches.isValid) {
                    validationResult.addErrors(validationResultOfIndentifiedBatches.errors);

                }

            }

            const expirateDatesOfUnidentifiedBatches: string[] = [];

            const unindentifiedBatches: MedicineBatch[] = medicineBatch.filter((mb) => !mb.batch);

            for (const unidBatch of unindentifiedBatches) {
                expirateDatesOfUnidentifiedBatches.push(unidBatch.expireDate);

            }

            if (expirateDatesOfUnidentifiedBatches && expirateDatesOfUnidentifiedBatches.length > 0) {
                const validationResultOfUnindentifiedBatches: ValidationResult =
                    this.validateDuplicatedItems(expirateDatesOfUnidentifiedBatches,
                        MedicineBatch.ERROR_DUPLICATED_UNDEFINED_BATCH);

                if (!validationResultOfUnindentifiedBatches.isValid) {
                    validationResult.addErrors(validationResultOfUnindentifiedBatches.errors);

                }

            }

        } catch (error) {
            throw Error(error + ' ME-184');
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    private validateDuplicatedItems(items: any[], errorInDuplicatedCase: ValidationError): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        const object: any = {};

        for (const item of items) {
            if (!object[item]) {
                object[item] = 0;

            }

            object[item] += 1;

        }

        for (const prop in object) {
            if (object[prop] >= 2) {
                validationResult.addError(errorInDuplicatedCase);

            }

        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

}
