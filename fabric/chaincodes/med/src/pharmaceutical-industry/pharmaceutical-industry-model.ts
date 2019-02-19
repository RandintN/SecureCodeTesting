import { SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IPharmaceuticalIndustryJson } from './pharmaceutical-industry-json';

export class PharmaceuticalIndustry implements IValidator {
    //#region constants
    private static ERROR_EMPTY_PHARMACEUTICAL_LABORATORY: ValidationError =
        new ValidationError('PI-001', 'The parameter pharmaceutical_laboratory cannot be empty or null');

    //#endregion
    public pharmaceuticalLaboratory: string;

    public situation: SituationEnum;

    public fromJson(json: IPharmaceuticalIndustryJson): void {
        this.pharmaceuticalLaboratory = json.pharmaceutical_laboratory;
        this.situation = json.situation;
    }

    public toJson(): IPharmaceuticalIndustryJson {
        const json: IPharmaceuticalIndustryJson = {
            pharmaceutical_laboratory: this.pharmaceuticalLaboratory,
            situation: this.situation,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.pharmaceuticalLaboratory === null || this.pharmaceuticalLaboratory === undefined) {
            validationResult.errors.push(PharmaceuticalIndustry.ERROR_EMPTY_PHARMACEUTICAL_LABORATORY);
        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

}
