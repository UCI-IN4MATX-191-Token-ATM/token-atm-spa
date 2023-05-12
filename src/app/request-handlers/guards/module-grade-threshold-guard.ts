import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class ModuleGradeThresholdGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private moduleId: string,
        private studentId: string,
        private gradeThreshold: number,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const [obtainedPoints, totalPoints] = await this.canvasService.getModuleScore(
            this.courseId,
            this.moduleId,
            this.studentId
        );
        if (totalPoints != 0 && obtainedPoints / totalPoints <= this.gradeThreshold) {
            onReject(`Module score ${obtainedPoints}/${totalPoints} (${(obtainedPoints / totalPoints).toFixed(2)})`);
        }
    }
}
