export class ModuleItemInfo {
    private _id: string;
    private _moduleId: string;
    private _type: string;
    private _contentId?: string;
    private _pointsPossible?: number;

    constructor(id: string, moduleId: string, type: string, contentId?: string, pointsPossible?: number) {
        this._id = id;
        this._moduleId = moduleId;
        this._type = type;
        this._contentId = contentId;
        this._pointsPossible = pointsPossible;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): ModuleItemInfo {
        if (
            typeof data['id'] != 'string' ||
            typeof data['module_id'] != 'string' ||
            typeof data['type'] != 'string' ||
            (typeof data['content_id'] != 'undefined' && typeof data['content_id'] != 'string') ||
            (typeof data['content_details']?.['points_possible'] != 'undefined' &&
                typeof data['content_details']?.['points_possible'] != 'number')
        )
            throw new Error('Invalid data');
        return new ModuleItemInfo(
            data['id'],
            data['module_id'],
            data['type'],
            data['content_id'],
            data['content_details']?.['points_possible']
        );
    }
}
