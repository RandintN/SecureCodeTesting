import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
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
        const medicineClassificationInBytes = await ctx.stub.getState(key);
        return medicineClassificationInBytes.toString();
    }

    public async queryPharmaceuticalFormByForm(ctx: Context, strForm: string): Promise<string> {
        const queryJson = {
            selector: {
                pharmaceutical_form: strForm,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        return JSON.stringify(await this.gePharmaceuticalForm(iterator));
    }

    public async getPharmaceuticalFormByForm(ctx: Context, form: string): Promise<PharmaceuticalForm> {
        const pharmaceuticalForm: PharmaceuticalForm = new PharmaceuticalForm();
        pharmaceuticalForm.fromJson(JSON.parse(await this.queryPharmaceuticalFormByForm(ctx, form)));
        return pharmaceuticalForm;
    }

    //#endregion

    //#region private methods
    private async gePharmaceuticalForm(iterator: Iterators.StateQueryIterator): Promise<PharmaceuticalForm> {
        const pharmaceuticalForm: PharmaceuticalForm = new PharmaceuticalForm();
        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                pharmaceuticalForm.fromJson(JSON.parse(result.value.value.toString('utf8')));
            }

            if (result.done) {
                break;
            }
        }

        return pharmaceuticalForm;
    }

    //#endregion

}
