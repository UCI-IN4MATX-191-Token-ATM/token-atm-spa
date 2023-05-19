export class ModuleItemInfo {
    private _id: string;
    private _moduleId: string;
    private _type: string;
    private _contentId?: string;
    private _pointsPossible?: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['module_id'] != 'string' ||
            typeof data['type'] != 'string' ||
            (typeof data['content_id'] != 'undefined' && typeof data['content_id'] != 'string') ||
            (typeof data['content_details']?.['points_possible'] != 'undefined' &&
                typeof data['content_details']?.['points_possible'] != 'number')
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._moduleId = data['module_id'];
        this._type = data['type'];
        this._contentId = data['content_id'];
        this._pointsPossible = data['content_details']?.['points_possible'];
    }

    public get id(): string {
        return this._id;
    }

    public get moduleId(): string {
        return this._moduleId;
    }

    public get type(): string {
        return this._type;
    }

    public get contentId(): string | undefined {
        return this._contentId;
    }

    public get pointsPossible(): number {
        return this._pointsPossible ?? 0;
    }
}
