import { ValidationResult } from './validation-model';

/**
 * @author fmarino - CPqD
 *
 * Interface of validations.
 */
export interface IValidator {

    /**
     * Method that makes validations
     *
     * @returns ValidationResult
     */
    isValid(): ValidationResult;
}
