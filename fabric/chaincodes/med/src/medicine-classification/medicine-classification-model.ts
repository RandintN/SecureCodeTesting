import { SituationEnum } from '../utils/situation-enum';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { IMedicineClassificationJson } from './medicine-classification-json';

export class MedicineClassification implements IValidatorModel {

    private static ERROR_EMPTY_CATEGORY: ValidationError =
        new ValidationError('MC-001', 'The parameter category cannot be empty or null');

    public category: string;
    public situation: SituationEnum;

    public fromJson(json: IMedicineClassificationJson) {
        this.category = json.category;
        this.situation = json.situation;
    }

    public toJson(): IMedicineClassificationJson {
        const json: IMedicineClassificationJson = {
            category: this.category,
            situation: this.situation,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.category === null || this.category === undefined) {
            validationResult.errors.push(MedicineClassification.ERROR_EMPTY_CATEGORY);
        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

}
