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
        new ValidationError('MB-002', 'The format of expire_date is not supported. Supported format: yyyy-MM-dd');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MB-003', 'The parameter amount cannot be empty or null');

    private static ERROR_INVALID_AMOUNT: ValidationError =
        new ValidationError('MB-004', 'The parameter amount must be greater than 0');

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

        } else if (moment(this.expireDate, CommonConstants.DATE_FORMAT, true).isValid()) {
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

}
