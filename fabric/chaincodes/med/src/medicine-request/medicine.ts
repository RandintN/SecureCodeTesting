import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';

/**
 *
 * @author fmarino
 */
export abstract class Medicine implements IValidatorModel {
        // tslint:disable-next-line:variable-name
        public active_ingredient: string;
        // tslint:disable-next-line:variable-name
        public comercial_name: string;
        // tslint:disable-next-line:variable-name
        public pharma_form: string;
        public dosage: string;

        public concentration: string;

        public abstract isValid(): ValidationResult;

}
