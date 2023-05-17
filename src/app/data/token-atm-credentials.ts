export class TokenATMCredentials {
    canvasURL = '';
    canvasAccessToken = '';
    qualtricsDataCenter = '';
    qualtricsClientID = '';
    qualtricsClientSecret = '';

    public toJSON(): unknown {
        return {
            canvasURL: this.canvasURL,
            canvasAccessToken: this.canvasAccessToken,
            qualtricsDataCenter: this.qualtricsDataCenter,
            qualtricsClientID: this.qualtricsClientID,
            qualtricsClientSecret: this.qualtricsClientSecret
        };
    }
}
