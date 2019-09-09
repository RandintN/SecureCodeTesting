import { SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { INegotiationModalityJson } from './negotiation-modality-json';

export class NegotiationModality implements IValidator {

    private static ERROR_EMPTY_MODALITY: ValidationError =
        new ValidationError('NM-001', 'The parameter modality cannot be empty or null');

    public modality: string;
    public situation: SituationEnum;

    public fromJson(json: INegotiationModalityJson) {
        this.modality = json.modality;
        this.situation = json.situation;
    }

    public toJson(): INegotiationModalityJson {
        const json: INegotiationModalityJson = {
            modality: this.modality,
            situation: this.situation,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.modality === null || this.modality === undefined) {
            validationResult.errors.push(NegotiationModality.ERROR_EMPTY_MODALITY);
        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

}
