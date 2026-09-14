import { supabase } from './supabase'

/** 日历「重要日」表 calendar_events 的一条记录 */
export interface CalendarEvent {
  id: string
  user_id: string
  /** 本地时区 yyyy-MM-dd */
  date: string
  title: string
  emoji: string
  created_at: string
}

export interface CalendarEventInput {
  date: string
  title: string
  emoji: string
}

/** 查询某用户的全部重要日事件，按日期升序 */
export async function fetchMyEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as CalendarEvent[]) ?? []
}

/** 新增一条重要日事件 */
export async function createEvent(userId: string, input: CalendarEventInput): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      date: input.date,
      title: input.title,
      emoji: input.emoji,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CalendarEvent
}

/** 删除一条重要日事件 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)

  if (error) {
    throw new Error(error.message)
  }
}