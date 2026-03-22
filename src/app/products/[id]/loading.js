export default function LoadingProduct() {
  return (
    <div className="bg-neutral-50 px-4 py-16 flex justify-center mt-20">
      <div className="max-w-screen-lg w-full grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 animate-pulse">
        <div className="w-full h-[600px] bg-gray-100 rounded-lg" />

        <div className="flex flex-col justify-between space-y-8">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded w-full" />
            <div className="h-12 bg-gray-200 rounded w-full" />
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
