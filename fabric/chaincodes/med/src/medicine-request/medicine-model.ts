import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';

/**
 *
 * @author fmarino
 */
export abstract class Medicine implements IValidatorModel {
        public activeIngredient: string;
        public comercialName: string;
        public pharmaForm: string;
        public dosage: string;
        public concentration: string;

        public abstract isValid(): ValidationResult;

}
