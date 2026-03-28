import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createEvent, deleteEvent, updateEvent } from '../-repositories/events'

export const useEventMutations = () => {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['events'] })

  const createMutation = useMutation({
    mutationFn: ({ name, occurredOn }: { name: string; occurredOn: string }) =>
      createEvent({ name, occurredOn }),
    onSuccess: () => {
      void invalidateList()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      occurredOn,
    }: {
      id: string
      name?: string
      occurredOn?: string
    }) => updateEvent(id, { name, occurredOn }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['events', variables.id] })
      void invalidateList()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      void invalidateList()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
