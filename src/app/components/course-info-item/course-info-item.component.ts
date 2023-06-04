import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Course } from 'app/data/course';

@Component({
    selector: 'app-course-info-item',
    templateUrl: './course-info-item.component.html',
    styleUrls: ['./course-info-item.component.sass']
})
export class CourseInfoItemComponent {
    @Input() course: Course | undefined;
    @Output() selectCourse = new EventEmitter<Course>();

    onSelectCourse(): void {
        if (!this.course) return;
        this.selectCourse.emit(this.course);
    }
}
