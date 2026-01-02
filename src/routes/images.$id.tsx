import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/images/$id')({
  component: ImageModal,
})

function ImageModal() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  // Redirect to home with modal open
  navigate({
    to: '/',
    search: { image: id },
    replace: true,
  })

  return null
}
