import { RequestParticipant } from "./requestParticipant";

export interface Request {
  user_id: String,
  callable_id: String,
  data: {},
  status: String,
  name: String,
  process_id: String,
  process: {},
  id: String,
  process_collaboration_id: String,
  participant_id: String,
  process_category_id: String,
  created_at: Date,
  updated_at: Date,
  user: String,
  participants: RequestParticipant[]
}