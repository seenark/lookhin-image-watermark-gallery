import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/images/$id')({
  component: ImageModal,
})

function ImageModal() {
  const { id } = Route.useParams()
  const router = useRouter()

  // Redirect to home with modal open
  router.history.replace({
    search: { image: id },
  })

  return null
}
