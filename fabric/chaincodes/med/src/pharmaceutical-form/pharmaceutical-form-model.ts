import { SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IPharmaceuticalFormJson } from './pharmaceutical-form-json';

export class PharmaceuticalForm implements IValidator {

    private static ERROR_EMPTY_PHARMACEUTICAL_FORM: ValidationError =
        new ValidationError('PF-001', 'The parameter pharma_form cannot be empty or null');

    public pharmaForm: string;
    public situation: SituationEnum;

    public fromJson(json: IPharmaceuticalFormJson) {
        this.pharmaForm = json.pharma_form;
        this.situation = json.situation;

    }

    public toJson(): IPharmaceuticalFormJson {
        const json: IPharmaceuticalFormJson = {
            pharma_form: this.pharmaForm,
            situation: this.situation,
        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.pharmaForm === null || this.pharmaForm === undefined) {
            validationResult.errors.push(PharmaceuticalForm.ERROR_EMPTY_PHARMACEUTICAL_FORM);
        }

        validationResult.isValid = validationResult.errors.length === 0;
        return validationResult;
    }

}
