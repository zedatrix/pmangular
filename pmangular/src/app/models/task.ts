export interface Task {

    user_id: number,
    status: string,
    due_at: Date,
    initiated_at: Date,
    riskchanges_at: Date,
    subprocess_start_event_id: number|null,
    data: {
            name: string,
            _user:{
              id: number,
              fullname: string,
              avatar: string

            }
    },
    requestor: {
      fullname: string,
      avatar: string
    },
    screen: {
      id:number,
      title:string,
      type:string,
      config: {
        name: string,
        items: {

        }
      }
    },
    id: number,
    process_id: number,
    process_request_id: number,
    element_id: string,
    element_type: string,
    element_index: number,
    element_name: string,
    created_at: Date,
    updated_at: Date,
    advanceStatus: string,
    due_notified: boolean,
    user: string|null,
    process: string,
    process_request: string,
    version_id: number
}
