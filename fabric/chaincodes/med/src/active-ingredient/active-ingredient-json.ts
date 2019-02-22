
/**
 * @author fmarino - CPqD
 *
 * Interface that's used as interface to data transfer json objects
 */
export interface IActiveIngredientJson {

    /**
     * Name of ActiveIngredient
     */
    name: string;

    /**
     * Flag that's indicate whether ActiveIngredient is special i.e.: restrict to negotiation.
     */
    special: boolean;

}
