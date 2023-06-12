export class AssignmentSubmission {
    private _id: string;
    private _workflowState: string;

    constructor(id: string, workflowState: string) {
        this._id = id;
        this._workflowState = workflowState;
    }

    public get id(): string {
        return this._id;
    }

    public get workflowState(): string {
        return this._workflowState;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): AssignmentSubmission {
        if (typeof data['id'] != 'string' || typeof data['workflow_state'] != 'string') throw new Error('Invalid data');
        return new AssignmentSubmission(data['id'], data['workflow_state']);
    }
}
