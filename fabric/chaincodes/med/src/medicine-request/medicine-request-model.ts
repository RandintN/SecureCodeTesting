import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { Exchange } from './exchange';
import { MedicineOffer } from './medicine-offer';

export class MedicineRequest implements IValidatorModel {
    //#region constants
    private static ERROR_EMPTY_ORG_ID: ValidationError =
        new ValidationError('MR-001', 'The parameter org_id cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MR-002', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MR-003', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MR-003', 'The parameter exchange cannot be empty or null');
    //#endregion
    // tslint:disable-next-line:variable-name
    public org_id: string;
    public amount: string;
    public medicine: MedicineOffer;
    public type: string[];
    // tslint:disable-next-line:variable-name
    public return_date: string;
    public exchange: Exchange[];

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.org_id === null || this.org_id === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_ORG_ID);
        }

        if (this.amount === null || this.amount === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_AMOUNT);
        }

        const medicineValidation: ValidationResult = this.medicine.isValid();

        if (!medicineValidation.isValid) {
            validationResult.errors.concat(medicineValidation.errors);
        }

        if (this.type === null || this.type === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);
        } else if (this.type.length < 1) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);
        }
        if (this.exchange === null || this.exchange === undefined || this.exchange.length < 1) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_EXCHANGE);
        } else if (this.exchange !== null && this.exchange !== undefined) {
            for (const exchange of this.exchange) {
                const exchangeValidation: ValidationResult = exchange.isValid();
                if (!exchangeValidation.isValid) {
                    validationResult.errors.concat(exchangeValidation.errors);
                }
            }
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
