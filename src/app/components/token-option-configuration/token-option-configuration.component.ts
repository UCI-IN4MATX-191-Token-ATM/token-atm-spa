import { Component } from '@angular/core';
import type { Course } from 'app/data/course';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { v4 as uuidv4 } from 'uuid';

type ITokenOption = {
    name: string;
    type: string;
    balanceChange: number;
};

type ITokenOptionGroup = {
    name: string;
    uuid: string;
    options: ITokenOption[];
};

@Component({
    selector: 'app-token-option-configuration',
    templateUrl: './token-option-configuration.component.html',
    styleUrls: ['./token-option-configuration.component.sass']
})
export class TokenOptionConfigurationComponent implements CourseConfigurable {
    course?: Course;

    private static DATA: ITokenOptionGroup[] = [
        {
            name: 'Module 1',
            uuid: uuidv4(),
            options: []
        },
        {
            name: 'Module 2',
            uuid: uuidv4(),
            options: [
                {
                    name: 'Quiz #1',
                    type: 'Canvas Quiz',
                    balanceChange: 2
                },
                {
                    name: 'Feedback Survey Participation',
                    type: 'Qualtrics Survey',
                    balanceChange: 1
                },
                {
                    name: 'Lab 1 Data Set',
                    type: 'Lab Data',
                    balanceChange: -2
                },
                {
                    name: 'Lab Report 1 Resubmission',
                    type: 'Assignment Resubmission',
                    balanceChange: -1
                }
            ]
        },
        {
            name: 'Module 3',
            uuid: uuidv4(),
            options: []
        }
    ];

    async configureCourse(course: Course): Promise<void> {
        // TODO: configure course for token option configuration
        this.course = course;
    }

    get allData() {
        return TokenOptionConfigurationComponent.DATA;
    }

    getAbsValue(value: number) {
        return Math.abs(value);
    }
}
