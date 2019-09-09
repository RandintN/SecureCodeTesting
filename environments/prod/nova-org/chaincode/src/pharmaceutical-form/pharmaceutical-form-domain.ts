import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IPharmaceuticalFormService } from './pharmaceutical-form-interface';
import { IPharmaceuticalFormJson } from './pharmaceutical-form-json';
import { PharmaceuticalForm } from './pharmaceutical-form-model';

export class PharmaceuticalFormDomain implements IPharmaceuticalFormService {
    //#region constants
    private static ADMIN_MSP: string = 'n2mimsp';

    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('PFD-001', 'Forbidden');

    private static ERROR_PHARMACEUTICAL_FORM_NOT_FOUND: ValidationError =
        new ValidationError('PFD-002', 'The pharma_form is not found.');

    private static ERROR_PHARMACEUTICAL_FORM_INACTIVATED: ValidationError =
        new ValidationError('PFD-003', 'The pharma_form is not active for negotiation.');

    //#endregion

    public async addPharmaceuticalForm(ctx: Context, strPharmaceuticalForm: string): Promise<string> {
        try {
            if (PharmaceuticalFormDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error(JSON.stringify(PharmaceuticalFormDomain.ERROR_NOT_ALLOWED_MSP));
            }

            const pharmaceuticalForm: PharmaceuticalForm = new PharmaceuticalForm();
            pharmaceuticalForm.fromJson(JSON.parse(strPharmaceuticalForm) as IPharmaceuticalFormJson);

            const validationResult: ValidationResult = pharmaceuticalForm.isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const pharmaceuticalFormID: string = Guid.create().toString();
            await ctx.stub.putState(pharmaceuticalFormID, Buffer.from(JSON.stringify(pharmaceuticalForm.toJson())));

            return pharmaceuticalFormID;

        } catch (error) {
            return JSON.stringify(error + 'Error ocurrence');
        }
    }

    //#region queries
    public async queryPharmaceuticalFormByKey(ctx: Context, key: string): Promise<string> {
        const pharmaceuticalFormInBytes = await ctx.stub.getState(key);
        return pharmaceuticalFormInBytes.toString();
    }

    public async queryPharmaceuticalFormByForm(ctx: Context, strForm: string): Promise<string> {
        const queryJson = {
            selector: {
                pharma_form: strForm,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const pharmaceuticalForm: PharmaceuticalForm = await this.getPharmaceuticalForm(iterator);
        return pharmaceuticalForm ? JSON.stringify(pharmaceuticalForm.toJson()) : null;
    }

    public async validatePharmaceuticalForm(ctx: Context, strPharmaceuticalForm: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const pharmaceuticalForm: PharmaceuticalForm =
                await this.getPharmaceuticalFormByForm(ctx, strPharmaceuticalForm);

            if (!pharmaceuticalForm) {
                validationResult.errors.push(PharmaceuticalFormDomain.ERROR_PHARMACEUTICAL_FORM_NOT_FOUND);
                validationResult.isValid = false;
                return validationResult;
            }

            if (pharmaceuticalForm.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(PharmaceuticalFormDomain.
                    ERROR_PHARMACEUTICAL_FORM_INACTIVATED);
                validationResult.isValid = false;
                return validationResult;

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    public async getPharmaceuticalFormByForm(ctx: Context, form: string): Promise<PharmaceuticalForm> {
        let pharmaceuticalForm: PharmaceuticalForm = null;
        const strPharmaceuticalForm: string = await this.queryPharmaceuticalFormByForm(ctx, form);

        if (strPharmaceuticalForm) {
            pharmaceuticalForm = new PharmaceuticalForm();
            pharmaceuticalForm.fromJson(JSON.parse(strPharmaceuticalForm) as IPharmaceuticalFormJson);
            return pharmaceuticalForm;
        }
        return null;
    }

    //#endregion

    //#region private methods
    private async getPharmaceuticalForm(iterator: Iterators.StateQueryIterator): Promise<PharmaceuticalForm> {
        let pharmaceuticalForm: PharmaceuticalForm;
        let pharmaceuticalFormJson: IPharmaceuticalFormJson;

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                pharmaceuticalFormJson = JSON.parse(result.value.value.toString('utf8'));
            }

            if (result.done) {
                break;
            }
        }
        if (pharmaceuticalFormJson) {
            pharmaceuticalForm = new PharmaceuticalForm();
            pharmaceuticalForm.fromJson(pharmaceuticalFormJson);
        }
        return pharmaceuticalForm;
    }

    //#endregion

}
