import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { IActiveIngredientJson } from './active-ingredient-json';

/**
 * @author fmarino - CPqD
 *
 * Class of active ingredients.
 */
export class ActiveIngredient implements IValidatorModel {

    private static ERROR_EMPTY_NAME: ValidationError =
        new ValidationError('AI-001', 'The parameter pharmaceutical_laboratory cannot be empty or null');

    /**
     * name of active ingredient
     */
    public name: string;

    /**
     * Flag thats indicate whether the active ingredient is to restricted to negotiation.
     */
    public special: boolean;

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.name === null || this.name === undefined) {
            validationResult.errors.push(ActiveIngredient.ERROR_EMPTY_NAME);
        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

    public fromJson(json: IActiveIngredientJson): void {
        this.name = json.name;
        this.special = json.special;
    }

    public toJson(): IActiveIngredientJson {
        const json: IActiveIngredientJson = {
            name: this.name,
            special: this.special,
        };

        return json;
    }
}
