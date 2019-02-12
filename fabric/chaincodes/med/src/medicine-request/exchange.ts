import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { MedicineExchange } from './medicine-exchange';

export class Exchange implements IValidatorModel {
    public amount: string;
    public medicine: MedicineExchange;

    public isValid(): ValidationResult {
        throw new Error('Method not implemented.');
    }
}
