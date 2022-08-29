export interface UserAuthResponse {
    token_type: string,
    expires_in: number,
    access_token: string,
    refresh_token: string
}