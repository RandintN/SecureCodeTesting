import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IActiveIngredientService } from './active-ingredient-interface';
import { IActiveIngredientJson } from './active-ingredient-json';
import { ActiveIngredient } from './active-ingredient-model';

export class ActiveIngredientDomain implements IActiveIngredientService {
    private static ADMIN_MSP: string = 'n2mimsp';
    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('AID-001', 'Forbidden');

    //#region region of methods to be invoked
    public async addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string> {
        try {
            if (ActiveIngredientDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error(JSON.stringify(ActiveIngredientDomain.ERROR_NOT_ALLOWED_MSP));
            }

            const activeIngredient: ActiveIngredient = new ActiveIngredient();
            activeIngredient.fromJson(JSON.parse(strActiveIngredient) as IActiveIngredientJson);

            const validationResult: ValidationResult = activeIngredient.isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const activeIngredientID: string = Guid.create().toString();
            await ctx.stub.putState(activeIngredientID,
                Buffer.from(JSON.stringify(activeIngredient.toJson())));

            return activeIngredientID;

        } catch (error) {
            return JSON.stringify(error);
        }
    }
    //#endregion

    //#region queries
    public async queryActiveIngredientByKey(ctx: Context, key: string): Promise<string> {
        const activeIngredientInBytes = await ctx.stub.getState(key);
        return activeIngredientInBytes.toString();
    }

    public async queryActiveIngredientByName(ctx: Context, strName: string): Promise<string> {
        const queryJson = {
            selector: {
                name: strName,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        return JSON.stringify(await this.getActiveIngredient(iterator));
    }

    public async getActiveIngredientByName(ctx: Context, activeIngredientName: string): Promise<ActiveIngredient> {
        const activeIngredient: ActiveIngredient = new ActiveIngredient();
        activeIngredient.fromJson(JSON.parse(await this.queryActiveIngredientByName(ctx, activeIngredientName)));
        return activeIngredient;
    }
    //#endregion

    //#region private methods
    private async getActiveIngredient(iterator: Iterators.StateQueryIterator): Promise<ActiveIngredient> {
        const activeIngredient: ActiveIngredient = new ActiveIngredient();
        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                activeIngredient.fromJson(JSON.parse(result.value.value.toString('utf8')));
            }

            if (result.done) {
                break;
            }
        }

        return activeIngredient;
    }
    //#endregion
}
