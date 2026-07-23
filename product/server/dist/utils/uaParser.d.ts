export interface UserAgentDetails {
    browser: string;
    device: string;
}
export declare function parseUserAgent(ua: string | undefined): UserAgentDetails;
