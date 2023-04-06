export class FormItemInfo {
    propertyID = '';
    propertyName = '';
    propertyType = 'text';
    inputPlaceholder = '';

    constructor(propertyID = '', propertyName = '', propertyType = 'text', inputPlaceholder = '') {
        this.propertyID = propertyID;
        this.propertyName = propertyName;
        this.propertyType = propertyType;
        this.inputPlaceholder = inputPlaceholder;
    }
}
