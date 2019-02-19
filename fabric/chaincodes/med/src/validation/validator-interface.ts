import { ValidationResult } from './validation-model';

export interface IValidator {
    isValid(): ValidationResult;
}
