import { createConversation } from '../actions'

export default async function NewChatPage() {
  await createConversation()
  return null
}
