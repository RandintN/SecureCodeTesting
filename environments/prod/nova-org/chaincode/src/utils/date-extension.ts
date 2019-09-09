import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';

export class DateExtension {
    private static ERROR_DATE_INVALID: ValidationError =
        new ValidationError('DE-001', 'Date is invalid');

    private static ERROR_DATE_FROM_PAST: ValidationError =
        new ValidationError('DE-002', 'Date cannot be before today');

    public validateDate(date: string, validationResult: ValidationResult): boolean {
        const miliseconds: number = Date.parse(date);
        if (Number.isNaN(miliseconds) || miliseconds <= 0) {
            validationResult.errors.push(DateExtension.ERROR_DATE_INVALID);
            return false;
        }
        if (miliseconds < Date.now()) {
            validationResult.errors.push(DateExtension.ERROR_DATE_FROM_PAST);
            return false;
        }
        return true;
    }
}
