import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IActiveIngredientService } from './active-ingredient-interface';
import { IActiveIngredientJson } from './active-ingredient-json';
import { ActiveIngredient } from './active-ingredient-model';

/**
 * @author fmarino - CPqD
 *
 * Domain of ActiveIngredient, which implements IActiveIngredientService.
 */
export class ActiveIngredientDomain implements IActiveIngredientService {

    /**
     * Constant with MSP key of administrator org i.e.: N2MI
     */
    private static ADMIN_MSP: string = 'n2mimsp';

    /**
     * Constant of ValidationError to forbidden cases
     */
    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('AID-001', 'Forbidden');

    /**
     * Constant of ValidationError to active_ingredient not found
     */
    private static ERROR_ACTIVE_INGREDIENT_NOT_FOUND: ValidationError =
        new ValidationError('AID-002', 'The active_ingredient is not found.');

    /**
     * Constant of ValidationError to active_ingredient not allowed
     */
    private static ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED: ValidationError =
        new ValidationError('AID-003', 'The active_ingredient is not allowed for negotiation.');

    //#region region of methods to be invoked

    /**
     * Method to add an ActiveIngredient. These methods is allowed just for administration Org i.e.: N2Mi
     * @param ctx Context of operation
     * @param strActiveIngredient String json of implementation of IActiveIngredientJson
     */
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

    /**
     * Method to query ActivieIngredient by key
     * @param ctx Context of operation
     * @param key Key of ActiveIngredient
     */
    public async queryActiveIngredientByKey(ctx: Context, key: string): Promise<string> {
        const activeIngredientInBytes = await ctx.stub.getState(key);
        return activeIngredientInBytes.toString();
    }

    /**
     * Method to reach query of ActiveIngregient by name
     * @param ctx Context of operation
     * @param strName name of Active Ingredient
     */
    public async queryActiveIngredientByName(ctx: Context, strName: string): Promise<string> {
        // Creates QueryJson of couchDB index query
        const queryJson = {
            selector: {
                name: strName,
            },
        };

        // Getting query result
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const activeIngredient: ActiveIngredient = await this.getActiveIngredient(iterator);

        return activeIngredient ? JSON.stringify(activeIngredient.toJson()) : null;
    }

    /**
     * Method to validate an ActiveIngredient
     * @param ctx context of operation
     * @param activeIngredientName active ingredient name that will be validated
     */
    public async validateActiveIngredient(ctx: Context, activeIngredientName: string): Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const activeIngredient: ActiveIngredient = await this.getActiveIngredientByName(ctx, activeIngredientName);

            if (!activeIngredient) {
                validationResult.errors.push(ActiveIngredientDomain.ERROR_ACTIVE_INGREDIENT_NOT_FOUND);
                validationResult.isValid = false;
                return validationResult;
            }

            if (activeIngredient.special) {
                validationResult.errors.push(ActiveIngredientDomain.ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED);
                validationResult.isValid = false;
                return validationResult;
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    /**
     * Internal method used to get an ActiveIngredient by name
     * @param ctx context of operation
     * @param activeIngredientName ActiveIngredient name
     */
    public async getActiveIngredientByName(ctx: Context, activeIngredientName: string): Promise<ActiveIngredient> {
        let activeIngredient: ActiveIngredient = null;
        const strActiveIngredientJson: string =
            await this.queryActiveIngredientByName(ctx, activeIngredientName);

        if (strActiveIngredientJson) {

            activeIngredient = new ActiveIngredient();
            activeIngredient.fromJson(JSON.parse(strActiveIngredientJson) as IActiveIngredientJson);

            return activeIngredient;
        } else {
            return null;
        }

    }
    //#endregion

    //#region private methods

    /**
     * Auxiliar method that's iterate over an interator of ActiveIngredient to retrieve the query result.
     * @param iterator iterator
     */
    private async getActiveIngredient(iterator: Iterators.StateQueryIterator): Promise<ActiveIngredient> {
        let activeIngredient: ActiveIngredient;
        let activeIngredientJson: IActiveIngredientJson;

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                activeIngredientJson = JSON.parse(result.value.value.toString('utf8')) as IActiveIngredientJson;

            }

            if (result.done) {
                break;
            }

        }

        if (activeIngredientJson) {
            activeIngredient = new ActiveIngredient();
            activeIngredient.fromJson(activeIngredientJson);

        }

        return activeIngredient;
    }

    //#endregion
}
