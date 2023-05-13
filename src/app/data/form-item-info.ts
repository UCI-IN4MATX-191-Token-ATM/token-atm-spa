export class FormItemInfo {
    propertyID = '';
    propertyName = '';
    propertyType = 'text';
    inputPlaceholder = '';
    tooltip = '';

    constructor(propertyID = '', propertyName = '', propertyType = 'text', inputPlaceholder = '', tooltip = '') {
        this.propertyID = propertyID;
        this.propertyName = propertyName;
        this.propertyType = propertyType;
        this.inputPlaceholder = inputPlaceholder;
        this.tooltip = tooltip;
    }
}
