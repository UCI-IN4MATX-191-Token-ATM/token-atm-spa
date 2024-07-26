import { Component, EventEmitter, Input, type OnInit, Output } from '@angular/core';
import { FormItemInfo } from 'app/data/form-item-info';
import { v4 as uuidv4 } from 'uuid';

// Not a generic component due to https://github.com/angular/angular/issues/13243
@Component({
    selector: 'app-form-item',
    templateUrl: './form-item.component.html',
    styleUrls: ['./form-item.component.sass']
})
export class FormItemComponent implements OnInit {
    uuid = '';
    @Input() info = new FormItemInfo();
    @Input() data = '';
    @Input() disabled = false;
    @Output() dataChange = new EventEmitter<string>();

    ngOnInit(): void {
        this.uuid = uuidv4();
    }

    onDataChange(value: string): void {
        this.dataChange.emit(value);
    }
}
