export interface User {
    email: string|null,
    firstname: string|null,
    lastname: string|null,
    username: string|null,
    password?: string|null,
    address: string|null,
    city: string|null,
    state: string|null,
    postal:	string|null,
    country: string|null,
    phone: string|null,
    fax: string|null,
    cell: string|null,
    title: string|null,
    timezone: string|null,
    datetime_format: string|null,
    language: string|null,
    is_administrator: boolean,
    expires_at: string|null,
    loggedin_at: string|null,
    remember_token: string|null,
    status: string|null,
    id:	number,
    fullname: string|null,
    avatar: string|null,
    birthdate: string|null,
    created_at:	string|null,
    updated_at:	string|null
    deleted_at:	string|null
    meta: any,
    is_system: number,
    active_at: string| null,
    external_auth_id: string|null,
    media: any
}