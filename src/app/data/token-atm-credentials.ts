export type CanvasCredential = {
    canvasURL: string;
    canvasAccessToken: string;
};

export type TokenATMCredentials = {
    canvas: CanvasCredential;
} & {
    [K in string]?: object;
};
