import { Context } from 'fabric-contract-api';
import { ValidationResult } from '../validation/validation-model';

/**
 * @author fmarino
 *
 * Interface for services of ActiveIngredient.
 */
export interface IActiveIngredientService {

    /**
     * Method to add an ActiveIngredient. These methods is allowed just for administration Org i.e.: N2Mi
     * @param ctx Context of operation
     * @param strActiveIngredient String json of implementation of IActiveIngredientJson
     */
    addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string>;

    /**
     * Method to query ActivieIngredient by key
     * @param ctx Context of operation
     * @param key Key of ActiveIngredient
     */
    queryActiveIngredientByKey(ctx: Context, key: string): Promise<string>;

    /**
     * Method to reach query of ActiveIngregient by name
     * @param ctx Context of operation
     * @param strName name of Active Ingredient
     */
    queryActiveIngredientByName(ctx: Context, name: string): Promise<string>;

    /**
     * Method to validate an ActiveIngredient
     * @param ctx context of operation
     * @param activeIngredientName active ingredient name that will be validated
     */
    validateActiveIngredient(ctx: Context, activeIngredientName: string): Promise<ValidationResult>;

}
