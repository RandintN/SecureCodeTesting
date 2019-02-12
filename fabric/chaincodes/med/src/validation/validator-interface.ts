import { ValidationResult } from './validation-model';

export interface IValidatorModel {
    isValid(): ValidationResult;
}
