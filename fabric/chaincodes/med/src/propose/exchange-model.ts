import { Medicine } from '../medicine-abstract/medicine';

import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IProposedExchangeJson } from './proposed-exchange-json';
import { MedicineProposeExchange } from './medicine-exchange-model';

export class ProposedExchange extends Medicine {
    //#region constants
    

    //#endregion

    public amount: string;
    public medicine: MedicineProposeExchange;

    public fromJson(proposedExchange: IProposedExchangeJson): void {
        
        this.amount = proposedExchange.amount;
        this.medicine = new MedicineProposeExchange();
        if(proposedExchange.medicine){
            this.medicine.fromJson(proposedExchange.medicine);
        }
    }

    public toJson(): IProposedExchangeJson {
        
        const json: IProposedExchangeJson = {
            amount: this.amount,
            medicine: this.medicine.toJson()

        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        //if (!this.activeIngredient) {
        //    validationResult.errors.push(MedicineProposeExchange.ERROR_EMPTY_ACTIVE_INGREDIENT);
        //}

        

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

}
