import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';

/**
 *
 * @author fmarino
 */
export abstract class Medicine implements IValidator {
        public activeIngredient: string;
        public commercialName: string;
        public pharmaForm: string;
        public concentration: string;

        public abstract isValid(): ValidationResult;

}
