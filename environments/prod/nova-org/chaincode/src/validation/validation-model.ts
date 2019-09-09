import { ValidationError } from './validation-error-model';

export class ValidationResult {
    public isValid: boolean;
    public errors: ValidationError[];

    constructor() {
        this.isValid = false;
        this.errors = [];

    }

    public addErrors(errors: ValidationError[]): void {
        this.errors = this.errors.concat(errors);

    }

    public addError(error: ValidationError) {
        this.errors.push(error);

    }

}
