import { SituationEnum } from '../utils/situation-enum';

export interface IPharmaceuticalFormJson {
    pharmaceutical_form: string;
    situation: SituationEnum;
}
