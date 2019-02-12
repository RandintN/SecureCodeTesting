import { ValidationError } from './validation-error-model';

export class ValidationResult {
    public isValid: boolean;
    public errors: ValidationError[];

    constructor() {
        this.isValid = false;
        this.errors = [];
    }

}
