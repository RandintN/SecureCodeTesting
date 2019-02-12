import { SituationEnum } from '../utils/situation-enum';
import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { IMedicineClassificationJson } from './medicine-classification-json';

export class MedicineClassification implements IValidatorModel {
    public category: string;
    public situation: SituationEnum;

    public fromJson(json: IMedicineClassificationJson) {
        this.category = json.category;
        this.situation = json.situation;
    }

    public isValid(): ValidationResult {
        throw new Error('Method not implemented.');
    }

}
