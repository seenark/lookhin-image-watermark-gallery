import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: ImageGallery,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      image: typeof search.image === "string" ? search.image : undefined,
    };
  },
});

interface ImageData {
  url: string;
  id?: string;
}

function ImageGallery() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const search = useSearch({ from: "/" });
  const selectedImage = search.image;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL || "http://localhost:3000/images",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      // Add IDs to images for unique keys
      const imagesWithIds = data.map((url: string, index: number) => ({
        url,
        id: `img-${index}`,
      }));
      setImages(imagesWithIds);
    } catch (err) {
      setError("Failed to load images. Please make sure the API is running.");
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename from URL
      const filename = imageUrl.split("/").pop() || "image.jpg";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async (imageUrl: string) => {
    const shareUrl = `${window.location.origin}/?image=${encodeURIComponent(imageUrl)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = async (imageUrl: string) => {
    try {
      const filename = imageUrl.split("/").pop();
      if (!filename) {
        console.error("Could not extract filename from URL");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/images";
      const response = await fetch(`${apiUrl}/${filename}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Close modal if the deleted image is currently being viewed
      if (selectedImage === imageUrl) {
        closeModal();
      }

      // Refresh images list
      await fetchImages();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const openModal = (imageUrl: string) => {
    navigate({ to: "/", search: { image: imageUrl } });
  };

  const closeModal = () => {
    navigate({ to: "/", search: { image: undefined } });
  };

  const visibleImages = images.slice(0, displayCount);
  const hasMore = displayCount < images.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-500">
            Image Gallery
          </h1>
          <p className="text-gray-300 text-lg">
            Click on any image to view it in full size
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Image Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/25"
                >
                  <img
                    src={image.url}
                    alt="Gallery image"
                    className="w-full h-auto transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onClick={() => openModal(image.url)}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(image.url);
                        }}
                        className="flex-1 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.url);
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.url);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 10)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Load More Images
                </button>
              </div>
            )}

            {/* Image count */}
            {images.length > 0 && (
              <p className="text-center text-gray-400 mt-6">
                Showing {visibleImages.length} of {images.length} images
              </p>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No images found</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors duration-200 text-4xl font-light"
              aria-label="Close"
            >
              ×
            </button>

            {/* Image */}
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Action buttons */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {/* Share button */}
              <button
                onClick={() => handleShare(selectedImage)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>

              {/* Download button */}
              <button
                onClick={() => handleDownload(selectedImage)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(selectedImage)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
